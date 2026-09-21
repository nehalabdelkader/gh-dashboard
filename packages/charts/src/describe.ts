import type { ChartDatum, ValueFormatter } from './types.js';

/**
 * One sentence describing a plot: what it is, how many marks, and the range.
 *
 * An SVG with `role="img"` needs a name, and a name every caller has to write by hand is
 * a name half of them get wrong. Generated here so the default is always accurate, with
 * an `ariaLabel` prop on each chart for when the default reads badly.
 */
export function describeSeries(
  kind: string,
  data: readonly ChartDatum[],
  format: ValueFormatter,
  what: string,
): string {
  const first = data[0];
  const last = data[data.length - 1];
  if (!first || !last) return `${kind} of ${what}. No data.`;
  if (data.length === 1) return `${kind} of ${what}: ${first.label}, ${format(first.value)}.`;
  const count = `${String(data.length)} item${data.length === 1 ? '' : 's'}`;
  return (
    `${kind} of ${what}: ${count}, from ${first.label} at ${format(first.value)} ` +
    `to ${last.label} at ${format(last.value)}.`
  );
}

const MAX_TICK_CHARS = 14;

/** Axis ticks are not the place to read a long name — the tooltip and the table are. */
export function truncateTick(label: string): string {
  return label.length > MAX_TICK_CHARS ? `${label.slice(0, MAX_TICK_CHARS - 1)}…` : label;
}

/** The default when a caller passes no formatter: locale digits, nothing clever. */
export const formatPlain: ValueFormatter = (value) => value.toLocaleString();
