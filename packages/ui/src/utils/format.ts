/**
 * Formatting helpers shared by the components.
 *
 * All `Intl`-based — no date library. Every function takes `now` and `locale` so the
 * output is deterministic in a test rather than dependent on the clock.
 */

const COMPACT_CACHE = new Map<string, Intl.NumberFormat>();

/** `1234 -> "1.2K"`. Used for stars, which routinely run to six figures. */
export function formatCompactNumber(value: number, locale?: string): string {
  const key = locale ?? 'default';
  let formatter = COMPACT_CACHE.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
    COMPACT_CACHE.set(key, formatter);
  }
  return formatter.format(value);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', YEAR],
  ['month', MONTH],
  ['week', WEEK],
  ['day', DAY],
  ['hour', HOUR],
  ['minute', MINUTE],
];

/**
 * `"2024-01-01T00:00:00Z" -> "3 months ago"`. Returns `fallback` for missing or
 * unparseable input, so a card never renders "Invalid Date" when GitHub omits a field.
 */
export function formatRelativeTime(
  iso: string | undefined,
  options: { now?: Date | number; locale?: string; fallback?: string } = {},
): string {
  const fallback = options.fallback ?? '—';
  if (!iso) return fallback;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return fallback;

  const now = options.now === undefined ? Date.now() : new Date(options.now).getTime();
  const deltaMs = then - now;
  const abs = Math.abs(deltaMs);
  const rtf = new Intl.RelativeTimeFormat(options.locale, { numeric: 'auto' });

  if (abs < MINUTE) return rtf.format(0, 'second').replace('0 seconds ago', 'just now');

  for (const [unit, ms] of UNITS) {
    if (abs >= ms) return rtf.format(Math.round(deltaMs / ms), unit);
  }
  return fallback;
}

/** The full date, for the tooltip behind every relative label. */
export function formatAbsoluteDate(
  iso: string | undefined,
  options: { locale?: string; fallback?: string } = {},
): string {
  const fallback = options.fallback ?? 'Unknown';
  if (!iso) return fallback;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(options.locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/** `"resets in 12m"` copy for the rate-limit error state. */
export function formatDuration(ms: number): string {
  if (ms <= 0) return 'now';
  const minutes = Math.ceil(ms / MINUTE);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
