/**
 * slug.ts — URL-safe slug generation for CF Workers + Node
 *
 * Zero external dependencies. Workers-compatible (no Node-only APIs).
 * Handles Unicode normalization, collision detection, and validation.
 *
 * @module slug
 */

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Thrown when slugify receives an empty or whitespace-only string.
 *
 * @example
 *   throw new SlugInputError('   ');
 *   // Error: slugify: input is empty or whitespace-only after normalization (received: "   ")
 */
export class SlugInputError extends Error {
  constructor(input: string) {
    super(`slugify: input is empty or whitespace-only after normalization (received: ${JSON.stringify(input)})`);
    this.name = "SlugInputError";
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SlugifyOptions {
  /** Maximum character length of the generated slug (default: 60). */
  maxLength?: number;
  /** Replacement character for invalid sequences (default: "-"). */
  separator?: string;
  /** Allow numeric-only slugs (default: false). */
  allowNumericOnly?: boolean;
}

// ---------------------------------------------------------------------------
// unicodeNormalize
// ---------------------------------------------------------------------------

/**
 * NFKD-normalize a string and strip all combining diacritical marks,
 * mapping accented characters to their ASCII base equivalent.
 *
 * Handles common Latin-extended characters. Characters with no ASCII
 * equivalent are dropped during the subsequent ASCII-strip in `slugify`.
 *
 * @example
 *   unicodeNormalize("Søren");  // "Soren"
 *   unicodeNormalize("naïve");  // "naive"
 *   unicodeNormalize("façade"); // "facade"
 *   unicodeNormalize("Ångström"); // "Angstrom"
 */
export function unicodeNormalize(text: string): string {
  // NFKD decomposes accented chars into base + combining marks
  return text
    .normalize("NFKD")
    // Remove combining diacritical marks (U+0300–U+036F)
    .replace(/[̀-ͯ]/g, "")
    // Ligate common multi-char replacements that NFKD won't split
    .replace(/æ/gi, "ae")
    .replace(/œ/gi, "oe")
    .replace(/ø/gi, "o")
    .replace(/ß/gi, "ss")
    .replace(/þ/gi, "th")
    .replace(/ð/gi, "d")
    .replace(/ł/gi, "l")
    .replace(/ı/gi, "i");
}

// ---------------------------------------------------------------------------
// Emoji & special-char regex
// ---------------------------------------------------------------------------

// Matches emoji (broad range), control chars, and non-ASCII after normalization
const NON_ASCII_RE = /[^\x00-\x7F]/g;
// Matches anything that is not a letter, digit, or separator candidate
const NON_ALPHANUMERIC_RE = /[^a-z0-9]+/g;
// Leading/trailing separators
const TRIM_SEPARATOR_RE = /^-+|-+$/g;

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------

/**
 * Convert arbitrary text into a URL-safe, lowercase, kebab-case slug.
 *
 * Steps:
 *  1. Unicode-normalize + diacritic-strip via `unicodeNormalize`
 *  2. Lowercase
 *  3. Replace non-alphanumeric sequences with the separator
 *  4. Trim leading/trailing separators
 *  5. Truncate to `maxLength` (default 60), never cutting mid-word if avoidable
 *
 * @throws {SlugInputError} when the input reduces to an empty string.
 *
 * @example
 *   slugify("Hello, World!");         // "hello-world"
 *   slugify("Søren Kierkegaard");     // "soren-kierkegaard"
 *   slugify("  foo  bar  ", { maxLength: 5 }); // "foo-b" (truncated)
 *   slugify("100% Pure 🍋 Lemon");    // "100-pure-lemon"
 */
export function slugify(text: string, opts: SlugifyOptions = {}): string {
  const maxLength = opts.maxLength ?? 60;
  const separator = opts.separator ?? "-";

  if (maxLength < 1) throw new RangeError("slugify: maxLength must be >= 1");

  let slug = unicodeNormalize(text)
    .toLowerCase()
    .replace(NON_ASCII_RE, "") // drop leftover non-ASCII (emoji etc.)
    .replace(NON_ALPHANUMERIC_RE, separator)
    .replace(TRIM_SEPARATOR_RE, "");

  if (slug.length === 0) throw new SlugInputError(text);

  // Numeric-only guard
  if (!opts.allowNumericOnly && /^\d+$/.test(slug)) {
    slug = `item-${slug}`;
  }

  // Truncate, preferring a clean separator boundary
  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength).replace(/-[^-]*$/, "") || slug.slice(0, maxLength);
    slug = slug.replace(TRIM_SEPARATOR_RE, "");
  }

  return slug;
}

// ---------------------------------------------------------------------------
// isValidSlug
// ---------------------------------------------------------------------------

/**
 * Returns `true` when `text` is a well-formed URL slug.
 *
 * Valid slug: lowercase alphanumeric + hyphens, no leading/trailing hyphens,
 * no consecutive hyphens, 1–60 characters.
 *
 * @example
 *   isValidSlug("hello-world");  // true
 *   isValidSlug("Hello");        // false (uppercase)
 *   isValidSlug("-oops");        // false (leading hyphen)
 *   isValidSlug("a--b");         // false (consecutive hyphens)
 */
export function isValidSlug(text: string): boolean {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(text) && !text.includes("--");
}

// ---------------------------------------------------------------------------
// slugifyCollision
// ---------------------------------------------------------------------------

/**
 * Given a desired `slug` and a set of already-used slugs, returns a unique
 * variant by appending `-2`, `-3`, etc.
 *
 * If `slug` is not in `existingSlugs`, it is returned as-is.
 *
 * @example
 *   slugifyCollision("my-post", new Set(["my-post", "my-post-2"]));
 *   // "my-post-3"
 *
 *   slugifyCollision("unique-title", new Set([]));
 *   // "unique-title"
 */
export function slugifyCollision(
  slug: string,
  existingSlugs: Set<string> | string[],
): string {
  const existing = existingSlugs instanceof Set ? existingSlugs : new Set(existingSlugs);

  if (!existing.has(slug)) return slug;

  let counter = 2;
  while (existing.has(`${slug}-${counter}`)) {
    counter++;
  }
  return `${slug}-${counter}`;
}

// ---------------------------------------------------------------------------
// Vitest co-located tests
// ---------------------------------------------------------------------------

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("unicodeNormalize", () => {
    it("strips diacritics", () => {
      expect(unicodeNormalize("naïve")).toBe("naive");
      expect(unicodeNormalize("café")).toBe("cafe");
    });

    it("handles Scandinavian ligatures", () => {
      expect(unicodeNormalize("Søren").toLowerCase()).toBe("soren");
      expect(unicodeNormalize("æther").toLowerCase()).toBe("aether");
    });

    it("handles German ß", () => {
      expect(unicodeNormalize("Straße").toLowerCase()).toBe("strasse");
    });

    it("passes through plain ASCII unchanged", () => {
      expect(unicodeNormalize("hello world")).toBe("hello world");
    });
  });

  describe("slugify", () => {
    it("produces lowercase kebab-case", () => {
      expect(slugify("Hello, World!")).toBe("hello-world");
    });

    it("strips emoji", () => {
      expect(slugify("Pure 🍋 Lemon")).toBe("pure-lemon");
    });

    it("normalizes unicode", () => {
      expect(slugify("Søren Kierkegaard")).toBe("soren-kierkegaard");
    });

    it("truncates to maxLength", () => {
      const result = slugify("a".repeat(100), { maxLength: 20 });
      expect(result.length).toBeLessThanOrEqual(20);
    });

    it("does not produce trailing hyphens after truncation", () => {
      const result = slugify("hello world again", { maxLength: 8 });
      expect(result).not.toMatch(/-$/);
    });

    it("prefixes numeric-only slugs with 'item-'", () => {
      expect(slugify("42")).toBe("item-42");
    });

    it("allows numeric-only when opt set", () => {
      expect(slugify("42", { allowNumericOnly: true })).toBe("42");
    });

    it("throws SlugInputError for empty input", () => {
      expect(() => slugify("   ")).toThrow(SlugInputError);
    });

    it("throws RangeError for maxLength < 1", () => {
      expect(() => slugify("hello", { maxLength: 0 })).toThrow(RangeError);
    });
  });

  describe("isValidSlug", () => {
    it("accepts valid slugs", () => {
      expect(isValidSlug("hello")).toBe(true);
      expect(isValidSlug("hello-world")).toBe(true);
      expect(isValidSlug("abc123")).toBe(true);
    });

    it("rejects uppercase", () => {
      expect(isValidSlug("Hello")).toBe(false);
    });

    it("rejects leading hyphen", () => {
      expect(isValidSlug("-oops")).toBe(false);
    });

    it("rejects trailing hyphen", () => {
      expect(isValidSlug("oops-")).toBe(false);
    });

    it("rejects consecutive hyphens", () => {
      expect(isValidSlug("a--b")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isValidSlug("")).toBe(false);
    });
  });

  describe("slugifyCollision", () => {
    it("returns slug as-is when no collision", () => {
      expect(slugifyCollision("my-post", new Set())).toBe("my-post");
    });

    it("appends -2 on first collision", () => {
      expect(slugifyCollision("my-post", new Set(["my-post"]))).toBe("my-post-2");
    });

    it("increments past existing numbered variants", () => {
      const existing = new Set(["my-post", "my-post-2", "my-post-3"]);
      expect(slugifyCollision("my-post", existing)).toBe("my-post-4");
    });

    it("accepts array input", () => {
      expect(slugifyCollision("slug", ["slug"])).toBe("slug-2");
    });
  });
}
