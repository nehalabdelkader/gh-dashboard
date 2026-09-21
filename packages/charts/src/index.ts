/**
 * `@gh/charts` — chart components.
 *
 * MUI-free by contract (enforced by the lint config): the consumer passes a `ChartTheme`,
 * so these render under the app's theme without ever depending on it. Nothing in the
 * public API mentions GitHub either — the app maps its domain onto `{ label, value }`
 * rows on its own side of the boundary.
 */
export { ChartContainer } from './ChartContainer.js';
export type { ChartContainerProps } from './ChartContainer.js';
export { ChartDataTable } from './ChartDataTable.js';
export type { ChartDataTableProps } from './ChartDataTable.js';
export { StarsBarChart } from './StarsBarChart.js';
export type { StarsBarChartProps } from './StarsBarChart.js';
export type { ChartDatum, ChartTheme, ValueFormatter } from './types.js';
