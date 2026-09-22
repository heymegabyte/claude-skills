/**
 * deprecation-headers.ts — RFC 8594 deprecation and sunset header helpers
 *
 * Zero external dependencies. Workers-compatible (no Node-only APIs).
 * Implements the Deprecation HTTP Header (RFC 8594) and Sunset HTTP Header
 * (RFC 8594) for signaling API lifecycle state to clients.
 *
 * @module deprecation-headers
 */

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Thrown when a Sunset date string cannot be parsed as a valid HTTP date.
 *
 * @example
 *   throw new DeprecationDateParseError('not-a-date', 'Deprecation');
 *   // Error: Cannot parse Deprecation header value as a date: "not-a-date"
 */
export class DeprecationDateParseError extends Error {
  constructor(
    public readonly raw: string,
    public readonly field: "Deprecation" | "Sunset",
  ) {
    super(`Cannot parse ${field} header value as a date: "${raw}"`);
    this.name = "DeprecationDateParseError";
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for setting RFC 8594 deprecation headers on a response. */
export interface DeprecationOptions {
  /** ISO 8601 date string or Date object for the Sunset date (when the endpoint will be removed). */
  sunset?: Date | string;
  /**
   * URL pointing to documentation about the deprecation.
   * Becomes `Link: <url>; rel="deprecation"`.
   */
  link?: string;
  /**
   * If true, also adds `Deprecation: true` (the boolean form per RFC 8594 §2).
   * If a Date is provided here it overrides the boolean form.
   * Defaults to `true`.
   */
  deprecation?: true | Date | string;
}

/** Minimal Hono context interface — accepts `c.header(name, value)`. */
export interface HonoContextLike {
  header(name: string, value: string): void;
}

// ---------------------------------------------------------------------------
// setDeprecation
// ---------------------------------------------------------------------------

/**
 * Set RFC 8594 deprecation/sunset headers on a Hono response context.
 *
 * Sets `Deprecation: true` by default. If `opts.sunset` is provided, also
 * sets `Sunset: <IMF-fixdate>`. If `opts.link` is provided, appends a
 * `Link` header with `rel="deprecation"`.
 *
 * @param c    - Hono context (or any object exposing `.header(name, value)`).
 * @param opts - Deprecation configuration options.
 * @returns void
 *
 * @example
 *   app.get('/v1/users', (c) => {
 *     setDeprecation(c, {
 *       sunset: new Date('2026-01-01'),
 *       link: 'https://api.example.com/docs/migration',
 *     });
 *     return c.json({ users: [] });
 *   });
 *
 * @example
 *   // Boolean deprecation only (no sunset date yet known)
 *   setDeprecation(c, {});
 *   // → Deprecation: true
 *
 * @example
 *   // With explicit deprecation date
 *   setDeprecation(c, { deprecation: new Date('2025-06-01') });
 *   // → Deprecation: Sat, 01 Jun 2025 00:00:00 GMT
 */
export function setDeprecation(c: HonoContextLike, opts: DeprecationOptions): void {
  const { sunset, link, deprecation = true } = opts;

  // Deprecation header — boolean or date form
  if (deprecation === true) {
    c.header("Deprecation", "true");
  } else {
    const d = deprecation instanceof Date ? deprecation : new Date(deprecation);
    c.header("Deprecation", toImfFixdate(d));
  }

  // Sunset header
  if (sunset !== undefined) {
    const d = sunset instanceof Date ? sunset : new Date(sunset);
    c.header("Sunset", toImfFixdate(d));
  }

  // Link header
  if (link) {
    c.header("Link", `<${link}>; rel="deprecation"`);
  }
}

// ---------------------------------------------------------------------------
// getDeprecationDate
// ---------------------------------------------------------------------------

/**
 * Extract and parse the `Deprecation` header value from a `Headers` object.
 *
 * Returns `null` if the header is absent or set to the boolean `"true"`.
 * Returns a `Date` if the header contains an HTTP date string.
 * Throws `DeprecationDateParseError` if the value is present but unparseable.
 *
 * @param headers - A WHATWG `Headers` object (Fetch API / CF Workers compatible).
 * @returns Parsed `Date`, or `null` if header is absent or boolean-only.
 * @throws {DeprecationDateParseError} When the header value cannot be parsed.
 *
 * @example
 *   const headers = new Headers({ Deprecation: 'Sat, 01 Jun 2025 00:00:00 GMT' });
 *   getDeprecationDate(headers);
 *   // → Date object for 2025-06-01
 *
 * @example
 *   const headers = new Headers({ Deprecation: 'true' });
 *   getDeprecationDate(headers);
 *   // → null (boolean form, no date)
 *
 * @example
 *   const headers = new Headers();
 *   getDeprecationDate(headers);
 *   // → null (absent)
 */
export function getDeprecationDate(headers: Headers): Date | null {
  const raw = headers.get("Deprecation");
  if (raw === null || raw === "true") return null;

  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    throw new DeprecationDateParseError(raw, "Deprecation");
  }
  return d;
}

// ---------------------------------------------------------------------------
// isDeprecated
// ---------------------------------------------------------------------------

/**
 * Predicate — returns `true` when the response carries a `Deprecation` header.
 *
 * Does not parse the date; just checks presence. Useful in client middleware
 * to emit a warning when calling a deprecated endpoint.
 *
 * @param headers - A WHATWG `Headers` object.
 * @returns `true` if the `Deprecation` header is present with any value.
 *
 * @example
 *   const res = await fetch('https://api.example.com/v1/old');
 *   if (isDeprecated(res.headers)) {
 *     console.warn('This endpoint is deprecated — migrate to v2.');
 *   }
 *
 * @example
 *   const clean = new Headers();
 *   isDeprecated(clean);
 *   // → false
 */
export function isDeprecated(headers: Headers): boolean {
  return headers.has("Deprecation");
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Convert a Date to IMF-fixdate format as required by RFC 7231 / RFC 8594. */
function toImfFixdate(d: Date): string {
  return d.toUTCString();
}

// ---------------------------------------------------------------------------
// Vitest co-located tests
// ---------------------------------------------------------------------------

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  // Minimal mock Hono context
  function mockContext(): { header: (n: string, v: string) => void; headers: Record<string, string> } {
    const headers: Record<string, string> = {};
    return {
      header(name: string, value: string) {
        headers[name] = value;
      },
      headers,
    };
  }

  describe("setDeprecation", () => {
    it("sets Deprecation: true by default", () => {
      const c = mockContext();
      setDeprecation(c, {});
      expect(c.headers["Deprecation"]).toBe("true");
    });

    it("sets Sunset header when provided as Date", () => {
      const c = mockContext();
      const date = new Date("2026-01-01T00:00:00Z");
      setDeprecation(c, { sunset: date });
      expect(c.headers["Sunset"]).toBeTruthy();
      expect(new Date(c.headers["Sunset"]).getFullYear()).toBe(2026);
    });

    it("sets Sunset header when provided as ISO string", () => {
      const c = mockContext();
      setDeprecation(c, { sunset: "2026-06-01" });
      expect(c.headers["Sunset"]).toBeTruthy();
    });

    it("sets Link header with rel=deprecation when link provided", () => {
      const c = mockContext();
      setDeprecation(c, { link: "https://example.com/docs/migration" });
      expect(c.headers["Link"]).toBe(
        '<https://example.com/docs/migration>; rel="deprecation"',
      );
    });

    it("sets Deprecation as IMF-fixdate when Date passed as deprecation option", () => {
      const c = mockContext();
      setDeprecation(c, { deprecation: new Date("2025-06-01T00:00:00Z") });
      expect(c.headers["Deprecation"]).not.toBe("true");
      expect(new Date(c.headers["Deprecation"]).getFullYear()).toBe(2025);
    });

    it("sets all three headers together", () => {
      const c = mockContext();
      setDeprecation(c, {
        sunset: new Date("2026-12-31T00:00:00Z"),
        link: "https://example.com/v2",
        deprecation: true,
      });
      expect(c.headers["Deprecation"]).toBe("true");
      expect(c.headers["Sunset"]).toBeTruthy();
      expect(c.headers["Link"]).toContain("rel=\"deprecation\"");
    });
  });

  describe("getDeprecationDate", () => {
    it("returns null when header is absent", () => {
      const headers = new Headers();
      expect(getDeprecationDate(headers)).toBeNull();
    });

    it("returns null for boolean form", () => {
      const headers = new Headers({ Deprecation: "true" });
      expect(getDeprecationDate(headers)).toBeNull();
    });

    it("parses a valid HTTP date string", () => {
      const headers = new Headers({ Deprecation: "Thu, 01 Jan 2026 00:00:00 GMT" });
      const d = getDeprecationDate(headers);
      expect(d).toBeInstanceOf(Date);
      expect(d!.getFullYear()).toBe(2026);
    });

    it("throws DeprecationDateParseError for unparseable value", () => {
      const headers = new Headers({ Deprecation: "not-a-date" });
      expect(() => getDeprecationDate(headers)).toThrow(DeprecationDateParseError);
    });
  });

  describe("isDeprecated", () => {
    it("returns false when Deprecation header is absent", () => {
      expect(isDeprecated(new Headers())).toBe(false);
    });

    it("returns true when Deprecation: true is set", () => {
      expect(isDeprecated(new Headers({ Deprecation: "true" }))).toBe(true);
    });

    it("returns true when Deprecation has a date value", () => {
      expect(
        isDeprecated(new Headers({ Deprecation: "Thu, 01 Jan 2026 00:00:00 GMT" })),
      ).toBe(true);
    });
  });
}
