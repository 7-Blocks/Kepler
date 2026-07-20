/**
 * numberFormatter.ts
 *
 * Pure formatting helpers for the AnimatedCounter component.
 * No React, no DOM, no animation — just number -> string.
 */

export interface FormatOptions {
  /** Number of decimal places to show. Default: inferred from the value's precision (0 for ints). */
  decimals?: number;
  /** Use locale thousands separators, e.g. 1250 -> "1,250". Default: true. */
  useGrouping?: boolean;
  /** Use compact notation for large numbers, e.g. 152340 -> "152K". Default: false. */
  compact?: boolean;
  /** Text placed before the number, e.g. "$". */
  prefix?: string;
  /** Text placed after the number, e.g. "%" or " km/s". */
  suffix?: string;
  /** BCP 47 locale for Intl.NumberFormat. Default: "en-US". */
  locale?: string;
}

/**
 * Figures out a sensible decimal count when the caller didn't specify one:
 * integers render with 0 decimals, floats keep their natural precision
 * (capped at 2) so 98.5 -> "98.5" and 7.823 -> "7.82".
 */
function inferDecimals(value: number): number {
  if (Number.isInteger(value)) return 0;
  const str = value.toString();
  const dot = str.indexOf('.');
  if (dot === -1) return 0;
  return Math.min(str.length - dot - 1, 2);
}

/**
 * Formats a number for display, e.g.:
 *   formatNumber(1250)                          -> "1,250"
 *   formatNumber(98.5, { suffix: '%' })         -> "98.5%"
 *   formatNumber(7.82, { suffix: ' km/s' })     -> "7.82 km/s"
 *   formatNumber(152340, { compact: true })     -> "152K"
 */
export function formatNumber(value: number, options: FormatOptions = {}): string {
  const {
    decimals = inferDecimals(value),
    useGrouping = true,
    compact = false,
    prefix = '',
    suffix = '',
    locale = 'en-US',
  } = options;

  const formatted = new Intl.NumberFormat(locale, {
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: compact ? 0 : decimals,
    maximumFractionDigits: decimals,
    useGrouping,
  }).format(value);

  return `${prefix}${formatted}${suffix}`;
}

/** A plain-language version of the final value, used for screen-reader announcements. */
export function formatForScreenReader(value: number, options: FormatOptions = {}): string {
  // Screen readers handle grouped numbers fine, but compact notation ("152K")
  // can be ambiguous when read aloud, so we spell out the full number instead.
  return formatNumber(value, { ...options, compact: false });
}
