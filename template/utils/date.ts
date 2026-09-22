/**
 * date.ts — Date formatting + comparison utilities for CF Workers + Node
 *
 * Zero external dependencies (no dayjs/moment). Workers-compatible.
 * Uses native `Intl.DateTimeFormat` and `Date` only.
 *
 * @module date
 */

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Thrown when a date argument is not a valid Date or parseable string.
 *
 * @example
 *   throw new InvalidDateError('not-a-date');
 *   // Error: InvalidDateError: cannot parse "not-a-date" as a valid date
 */
export class InvalidDateError extends Error {
  constructor(input: unknown) {
    super(`InvalidDateError: cannot parse "${String(input)}" as a valid date`);
    this.name = "InvalidDateError";
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Duration {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

export interface FormatHumanOptions {
  /** Intl.DateTimeFormat options — merged with sensible defaults. */
  dateStyle?: "full" | "long" | "medium" | "short";
  timeStyle?: "full" | "long" | "medium" | "short";
  /** Include time component (default: false). */
  includeTime?: boolean;
}

// ---------------------------------------------------------------------------
// isValidDate
// ---------------------------------------------------------------------------

/**
 * Returns `true` when `date` is a Date object whose time value is finite.
 *
 * @example
 *   isValidDate(new Date());          // true
 *   isValidDate(new Date("bad"));     // false
 *   isValidDate("2024-01-01");        // false — not a Date object
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

// ---------------------------------------------------------------------------
// formatISO
// ---------------------------------------------------------------------------

/**
 * Format a Date as an RFC 3339 / ISO 8601 string with millisecond precision.
 *
 * @throws {InvalidDateError} for invalid Date instances.
 *
 * @example
 *   formatISO(new Date("2024-07-04T12:00:00.000Z"));
 *   // "2024-07-04T12:00:00.000Z"
 */
export function formatISO(date: Date): string {
  if (!isValidDate(date)) throw new InvalidDateError(date);
  return date.toISOString();
}

// ---------------------------------------------------------------------------
// formatHuman
// ---------------------------------------------------------------------------

/**
 * Format a Date as a human-readable localized string using `Intl.DateTimeFormat`.
 *
 * Falls back gracefully if the runtime does not support the requested locale.
 *
 * @throws {InvalidDateError} for invalid Date instances.
 *
 * @example
 *   formatHuman(new Date("2024-07-04"), "en-US");
 *   // "Jul 4, 2024"
 *
 *   formatHuman(new Date("2024-07-04T14:30:00Z"), "de-DE", { includeTime: true });
 *   // "4. Juli 2024 um 14:30:00"  (locale-dependent)
 */
export function formatHuman(
  date: Date,
  locale: string | string[] = "en-US",
  opts: FormatHumanOptions = {},
): string {
  if (!isValidDate(date)) throw new InvalidDateError(date);

  const intlOpts: Intl.DateTimeFormatOptions = {};

  if (opts.timeStyle && opts.includeTime) {
    intlOpts.timeStyle = opts.timeStyle;
  }

  if (opts.dateStyle) {
    intlOpts.dateStyle = opts.dateStyle;
  } else {
    // Sensible default: "Jan 4, 2024"
    intlOpts.year = "numeric";
    intlOpts.month = "short";
    intlOpts.day = "numeric";
  }

  if (opts.includeTime && !opts.timeStyle) {
    intlOpts.hour = "2-digit";
    intlOpts.minute = "2-digit";
  }

  return new Intl.DateTimeFormat(locale, intlOpts).format(date);
}

// ---------------------------------------------------------------------------
// relative
// ---------------------------------------------------------------------------

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Return a human-readable relative time string ("3 hours ago", "in 2 days").
 *
 * Uses `Intl.RelativeTimeFormat` when available; falls back to simple English
 * strings for Workers runtimes that may not support it yet.
 *
 * @throws {InvalidDateError} if either argument is an invalid Date.
 *
 * @example
 *   const past = new Date(Date.now() - 3 * 60 * 60 * 1000);
 *   relative(past, new Date());  // "3 hours ago"
 *
 *   const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
 *   relative(future, new Date()); // "in 2 days"
 */
export function relative(date: Date, now: Date = new Date()): string {
  if (!isValidDate(date)) throw new InvalidDateError(date);
  if (!isValidDate(now)) throw new InvalidDateError(now);

  const diffMs = date.getTime() - now.getTime();
  const abs = Math.abs(diffMs);

  let value: number;
  let unit: Intl.RelativeTimeFormatUnit;

  if (abs < MINUTE) {
    value = Math.round(diffMs / SECOND);
    unit = "second";
  } else if (abs < HOUR) {
    value = Math.round(diffMs / MINUTE);
    unit = "minute";
  } else if (abs < DAY) {
    value = Math.round(diffMs / HOUR);
    unit = "hour";
  } else if (abs < WEEK) {
    value = Math.round(diffMs / DAY);
    unit = "day";
  } else if (abs < MONTH) {
    value = Math.round(diffMs / WEEK);
    unit = "week";
  } else if (abs < YEAR) {
    value = Math.round(diffMs / MONTH);
    unit = "month";
  } else {
    value = Math.round(diffMs / YEAR);
    unit = "year";
  }

  // Use Intl.RelativeTimeFormat when available (Workers v8 ≥ 94)
  if (typeof Intl !== "undefined" && "RelativeTimeFormat" in Intl) {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    return rtf.format(value, unit);
  }

  // Fallback: simple English
  const n = Math.abs(value);
  const label = n === 1 ? unit : `${unit}s`;
  return value < 0 ? `${n} ${label} ago` : `in ${n} ${label}`;
}

// ---------------------------------------------------------------------------
// addDuration
// ---------------------------------------------------------------------------

/**
 * Return a new Date with the given duration added.
 * The original date is never mutated.
 *
 * Month arithmetic uses calendar months (Jan+1 = Feb); day overflow is
 * handled natively by `Date` (e.g. Jan 31 + 1 month = Mar 2 or Mar 3).
 *
 * @throws {InvalidDateError} if `date` is invalid.
 * @throws {TypeError} if `duration` contains non-finite values.
 *
 * @example
 *   addDuration(new Date("2024-01-01"), { days: 7, hours: 3 });
 *   // 2024-01-08T03:00:00.000Z  (UTC)
 *
 *   addDuration(new Date("2024-01-31"), { months: 1 });
 *   // 2024-03-02T00:00:00.000Z  (day overflow handled by Date)
 */
export function addDuration(date: Date, duration: Duration): Date {
  if (!isValidDate(date)) throw new InvalidDateError(date);

  // Validate all values are finite numbers
  for (const [key, val] of Object.entries(duration)) {
    if (val !== undefined && !Number.isFinite(val)) {
      throw new TypeError(`addDuration: duration.${key} must be a finite number`);
    }
  }

  const d = new Date(date.getTime());

  if (duration.years) d.setUTCFullYear(d.getUTCFullYear() + duration.years);
  if (duration.months) d.setUTCMonth(d.getUTCMonth() + duration.months);
  if (duration.weeks) d.setUTCDate(d.getUTCDate() + duration.weeks * 7);
  if (duration.days) d.setUTCDate(d.getUTCDate() + duration.days);
  if (duration.hours) d.setUTCHours(d.getUTCHours() + duration.hours);
  if (duration.minutes) d.setUTCMinutes(d.getUTCMinutes() + duration.minutes);
  if (duration.seconds) d.setUTCSeconds(d.getUTCSeconds() + duration.seconds);
  if (duration.milliseconds) d.setUTCMilliseconds(d.getUTCMilliseconds() + duration.milliseconds);

  return d;
}

// ---------------------------------------------------------------------------
// parseFlexible
// ---------------------------------------------------------------------------

/** ISO 8601 date-only: 2024-07-04 */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+\-]+)?$/;
/** US date: MM/DD/YYYY or M/D/YYYY */
const US_DATE_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
/** RFC 2822 — matches "Thu, 04 Jul 2024 12:00:00 +0000" */
const RFC2822_RE =
  /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+(?:[+-]\d{4}|UTC|GMT)$/i;

/**
 * Parse a date string in one of several common formats:
 *  1. ISO 8601 / RFC 3339: `"2024-07-04"`, `"2024-07-04T12:00:00Z"`
 *  2. RFC 2822: `"Thu, 04 Jul 2024 12:00:00 +0000"`
 *  3. US date: `"07/04/2024"`, `"7/4/2024"`
 *
 * @throws {InvalidDateError} when no format matches or the parsed date is invalid.
 *
 * @example
 *   parseFlexible("2024-07-04").toISOString();       // "2024-07-04T00:00:00.000Z"
 *   parseFlexible("07/04/2024").toISOString();        // "2024-07-04T00:00:00.000Z"
 *   parseFlexible("Thu, 04 Jul 2024 00:00:00 +0000").toISOString(); // "2024-07-04T00:00:00.000Z"
 */
export function parseFlexible(input: string): Date {
  if (typeof input !== "string") throw new InvalidDateError(input);

  const trimmed = input.trim();

  // 1. ISO 8601 / RFC 3339
  if (ISO_DATE_RE.test(trimmed)) {
    // Date-only strings (no T) must be treated as UTC; append T00:00:00Z
    const iso = trimmed.includes("T") ? trimmed : `${trimmed}T00:00:00Z`;
    const d = new Date(iso);
    if (isValidDate(d)) return d;
  }

  // 2. RFC 2822
  if (RFC2822_RE.test(trimmed)) {
    const d = new Date(trimmed);
    if (isValidDate(d)) return d;
  }

  // 3. US MM/DD/YYYY
  const usMatch = trimmed.match(US_DATE_RE);
  if (usMatch) {
    const [, month, day, year] = usMatch.map(Number);
    // Validate ranges loosely — Date handles further validation
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(
        Date.UTC(year, month - 1, day),
      );
      if (isValidDate(d)) return d;
    }
  }

  throw new InvalidDateError(input);
}

// ---------------------------------------------------------------------------
// Vitest co-located tests
// ---------------------------------------------------------------------------

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  const JUL4 = new Date("2024-07-04T00:00:00.000Z");

  describe("isValidDate", () => {
    it("returns true for valid Date", () => expect(isValidDate(JUL4)).toBe(true));
    it("returns false for invalid Date", () => expect(isValidDate(new Date("bad"))).toBe(false));
    it("returns false for non-Date", () => expect(isValidDate("2024-01-01")).toBe(false));
  });

  describe("formatISO", () => {
    it("returns ISO 8601 string", () => {
      expect(formatISO(JUL4)).toBe("2024-07-04T00:00:00.000Z");
    });
    it("throws for invalid date", () => {
      expect(() => formatISO(new Date("bad"))).toThrow(InvalidDateError);
    });
  });

  describe("formatHuman", () => {
    it("returns localized string", () => {
      const result = formatHuman(JUL4, "en-US");
      expect(result).toContain("2024");
    });
    it("includes time when includeTime=true", () => {
      const result = formatHuman(JUL4, "en-US", { includeTime: true });
      // Should contain a colon for HH:MM
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
    it("throws for invalid date", () => {
      expect(() => formatHuman(new Date("bad"))).toThrow(InvalidDateError);
    });
  });

  describe("relative", () => {
    it("returns 'X hours ago' for past date", () => {
      const past = new Date(JUL4.getTime() - 3 * 60 * 60 * 1000);
      const result = relative(past, JUL4);
      expect(result).toMatch(/3 hour/);
    });
    it("returns 'in X days' for future date", () => {
      const future = new Date(JUL4.getTime() + 2 * 24 * 60 * 60 * 1000);
      const result = relative(future, JUL4);
      expect(result).toMatch(/2 day/);
    });
    it("throws for invalid date", () => {
      expect(() => relative(new Date("bad"))).toThrow(InvalidDateError);
    });
  });

  describe("addDuration", () => {
    it("adds days", () => {
      const result = addDuration(JUL4, { days: 7 });
      expect(result.toISOString()).toBe("2024-07-11T00:00:00.000Z");
    });
    it("adds hours", () => {
      const result = addDuration(JUL4, { hours: 3 });
      expect(result.toISOString()).toBe("2024-07-04T03:00:00.000Z");
    });
    it("adds weeks", () => {
      const result = addDuration(JUL4, { weeks: 1 });
      expect(result.toISOString()).toBe("2024-07-11T00:00:00.000Z");
    });
    it("does not mutate source date", () => {
      const orig = new Date(JUL4.getTime());
      addDuration(orig, { days: 5 });
      expect(orig.getTime()).toBe(JUL4.getTime());
    });
    it("throws TypeError for non-finite duration value", () => {
      expect(() => addDuration(JUL4, { days: Infinity })).toThrow(TypeError);
    });
  });

  describe("parseFlexible", () => {
    it("parses ISO date-only", () => {
      expect(parseFlexible("2024-07-04").toISOString()).toBe("2024-07-04T00:00:00.000Z");
    });
    it("parses ISO datetime", () => {
      expect(parseFlexible("2024-07-04T12:00:00Z").toISOString()).toBe("2024-07-04T12:00:00.000Z");
    });
    it("parses US date MM/DD/YYYY", () => {
      expect(parseFlexible("07/04/2024").toISOString()).toBe("2024-07-04T00:00:00.000Z");
    });
    it("parses RFC 2822", () => {
      const d = parseFlexible("Thu, 04 Jul 2024 00:00:00 +0000");
      expect(d.toISOString()).toBe("2024-07-04T00:00:00.000Z");
    });
    it("throws for unparseable input", () => {
      expect(() => parseFlexible("not-a-date")).toThrow(InvalidDateError);
    });
  });
}
