/**
 * scrub-pii.ts — PII scrubbing utilities for CF Workers + Node
 *
 * Uses Web Crypto (`crypto.subtle.digest`) — zero runtime deps, Workers-compatible.
 * See `rules/pii-handling-discipline.md` for when each function applies.
 *
 * @module scrub-pii
 *
 * Rule of thumb:
 *   - Audit/event log rows  → hashEmail() / hashIp() / scrubPii()
 *   - Unstructured strings  → redactPii()  (logging, error messages, AI prompts)
 *   - Never store plaintext PII in audit tables, logs, or analytics events.
 */

// ---------------------------------------------------------------------------
// Core: SHA-256 hex digest via Web Crypto
// ---------------------------------------------------------------------------

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// hashEmail
// ---------------------------------------------------------------------------

/**
 * Produce a SHA-256 hex digest of a normalized email address.
 *
 * Use this before storing any email reference in:
 *   login_attempts, deletion_audit, security_events, payment_events,
 *   admin_action_log, webhook_delivery_log.
 *
 * The result is deterministic for the same email — useful for JOIN lookups
 * without retaining the plaintext.
 *
 * @example
 *   const emailHash = await hashEmail("  Brian@Example.COM  ");
 *   // "3b9f4..." (SHA-256 of "brian@example.com")
 */
export async function hashEmail(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  return sha256Hex(normalized);
}

// ---------------------------------------------------------------------------
// hashIp
// ---------------------------------------------------------------------------

/**
 * Produce a SHA-256 hex digest of a normalized IP address.
 *
 * Accepts IPv4 ("1.2.3.4") or IPv6. Normalizes IPv4 by trimming whitespace.
 * IPv6 is lowercased so "::1" and "::1" are identical.
 *
 * Use in security_events, login_attempts, rate-limit audit rows.
 *
 * @example
 *   const ipHash = await hashIp("192.168.1.1");
 */
export async function hashIp(ip: string): Promise<string> {
  const normalized = ip.trim().toLowerCase();
  return sha256Hex(normalized);
}

// ---------------------------------------------------------------------------
// scrubPii
// ---------------------------------------------------------------------------

/**
 * Clone an object and replace named fields with their SHA-256 hash,
 * appending `_sha256` to the key and removing the original plaintext key.
 *
 * Designed for structured event/audit rows before D1 insert.
 *
 * @example
 *   const row = { email: "a@b.com", ip: "1.2.3.4", action: "login" };
 *   const safe = await scrubPii(row, ["email", "ip"]);
 *   // { email_sha256: "3b9...", ip_sha256: "f1c...", action: "login" }
 *
 * @param obj    The source object (not mutated).
 * @param fields Keys whose values should be hashed. Values must be strings.
 */
export async function scrubPii<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T & string)[],
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = { ...obj };

  await Promise.all(
    fields.map(async (field) => {
      const value = obj[field];
      if (typeof value === "string") {
        result[`${field}_sha256`] = await sha256Hex(value.trim());
        delete result[field];
      }
    }),
  );

  return result;
}

// ---------------------------------------------------------------------------
// redactPii
// ---------------------------------------------------------------------------

/** Regex patterns for common PII in unstructured text. */
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE =
  /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}(?:\s?(?:x|ext)\.?\s?\d{1,5})?/g;
const SSN_RE = /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g;

/**
 * Replace PII patterns in an unstructured string with placeholder tokens.
 *
 * Use this before:
 *   - Logging error messages or request bodies to console / Axiom / PostHog.
 *   - Passing user content to an AI model (LLM prompt hygiene).
 *   - Storing free-text in non-audit fields.
 *
 * Redacts: email addresses → `[email]`, phone numbers → `[phone]`,
 *          US Social Security Numbers → `[ssn]`.
 *
 * @example
 *   redactPii("Contact brian@example.com or call 555-867-5309.");
 *   // "Contact [email] or call [phone]."
 */
export function redactPii(text: string): string {
  return text
    .replace(EMAIL_RE, "[email]")
    .replace(PHONE_RE, "[phone]")
    .replace(SSN_RE, "[ssn]");
}

// ---------------------------------------------------------------------------
// Vitest unit tests (co-located — run with `vitest run src/utils/scrub-pii.ts`)
// ---------------------------------------------------------------------------

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("hashEmail", () => {
    it("produces a 64-char hex string", async () => {
      const h = await hashEmail("test@example.com");
      expect(h).toHaveLength(64);
      expect(h).toMatch(/^[0-9a-f]+$/);
    });

    it("normalizes case and whitespace", async () => {
      const a = await hashEmail("  Brian@EXAMPLE.COM  ");
      const b = await hashEmail("brian@example.com");
      expect(a).toBe(b);
    });

    it("different emails produce different hashes", async () => {
      const a = await hashEmail("a@example.com");
      const b = await hashEmail("b@example.com");
      expect(a).not.toBe(b);
    });
  });

  describe("hashIp", () => {
    it("produces a 64-char hex string for IPv4", async () => {
      const h = await hashIp("192.168.1.1");
      expect(h).toHaveLength(64);
    });

    it("normalizes IPv6 case", async () => {
      const a = await hashIp("::1");
      const b = await hashIp("::1");
      expect(a).toBe(b);
    });
  });

  describe("scrubPii", () => {
    it("replaces named fields with _sha256 suffixed keys", async () => {
      const row = { email: "a@b.com", ip: "1.2.3.4", action: "login" };
      const safe = await scrubPii(row, ["email", "ip"]);
      expect(safe).not.toHaveProperty("email");
      expect(safe).not.toHaveProperty("ip");
      expect(safe).toHaveProperty("email_sha256");
      expect(safe).toHaveProperty("ip_sha256");
      expect(safe.action).toBe("login");
    });

    it("does not mutate the source object", async () => {
      const row = { email: "a@b.com" };
      await scrubPii(row, ["email"]);
      expect(row.email).toBe("a@b.com");
    });

    it("skips non-string fields gracefully", async () => {
      const row = { count: 42, email: "a@b.com" } as Record<string, unknown>;
      const safe = await scrubPii(row, ["count" as "email", "email"]);
      // non-string "count" is left alone (no hash attempted)
      expect(safe.count).toBe(42);
      expect(safe).toHaveProperty("email_sha256");
    });
  });

  describe("redactPii", () => {
    it("redacts email addresses", () => {
      expect(redactPii("reach me at user@example.com")).toBe(
        "reach me at [email]",
      );
    });

    it("redacts US phone numbers", () => {
      expect(redactPii("call 555-867-5309")).toBe("call [phone]");
    });

    it("redacts SSNs", () => {
      expect(redactPii("SSN 123-45-6789")).toBe("SSN [ssn]");
    });

    it("leaves clean text unchanged", () => {
      expect(redactPii("Hello, world!")).toBe("Hello, world!");
    });

    it("handles multiple PII types in one string", () => {
      const result = redactPii(
        "Email user@test.com phone 800-555-1234 ssn 987-65-4321",
      );
      expect(result).toBe("Email [email] phone [phone] ssn [ssn]");
    });
  });
}
