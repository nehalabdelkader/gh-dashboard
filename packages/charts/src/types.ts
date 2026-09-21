/**
 * The chart package's whole vocabulary.
 *
 * No GitHub in it, and no MUI. A chart is handed rows of `{ label, value }` and a
 * `ChartTheme` describing how the consumer's design system looks — that indirection is
 * what keeps the package renderable under any theme (and testable under none) while
 * still matching the app pixel for pixel.
 */

/** One plotted row. `id` is an opaque key the consumer gets back on a click. */
export interface ChartDatum {
  label: string;
  value: number;
  /** Not used for rendering — carried through so a click can be resolved to an entity. */
  id?: string | undefined;
}

/**
 * The visual contract with the consumer.
 *
 * Every colour the charts draw comes from here; nothing is hard-coded, so light and dark
 * are the caller's problem and this package has no modes of its own.
 */
export interface ChartTheme {
  /** Categorical palette. Single-series charts use the first entry. */
  series: readonly string[];
  /** Panel background, also the tooltip's. */
  surface: string;
  /** Hairlines: grid, axis, tooltip border. */
  grid: string;
  text: string;
  mutedText: string;
  fontFamily: string;
  fontSize: number;
  borderRadius: number;
}

/** How a value reads on an axis, in a tooltip and in the accessible table. */
export type ValueFormatter = (value: number) => string;
