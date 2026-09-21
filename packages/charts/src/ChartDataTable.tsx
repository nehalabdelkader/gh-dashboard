import type { CSSProperties } from 'react';
import type { ChartDatum, ValueFormatter } from './types.js';

/** Off-screen but still in the accessibility tree and still focusable. */
const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export interface ChartDataTableProps {
  caption: string;
  data: readonly ChartDatum[];
  labelHeader?: string | undefined;
  valueHeader?: string | undefined;
  formatValue: ValueFormatter;
  /** When given, each row's label becomes a button — the keyboard equivalent of a bar click. */
  onSelect?: ((datum: ChartDatum, index: number) => void) | undefined;
}

/**
 * The same numbers as the plot, as a table, for screen readers.
 *
 * An SVG with `role="img"` is a single opaque image to assistive tech: the label says
 * what the chart is, and this says what is in it. It also carries the keyboard path to
 * whatever a bar click does, since an SVG rect is not focusable.
 */
export function ChartDataTable({
  caption,
  data,
  labelHeader = 'Item',
  valueHeader = 'Value',
  formatValue,
  onSelect,
}: ChartDataTableProps) {
  return (
    <table style={VISUALLY_HIDDEN}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{labelHeader}</th>
          <th scope="col">{valueHeader}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((datum, index) => (
          <tr key={datum.id ?? datum.label}>
            <th scope="row">
              {onSelect ? (
                <button type="button" onClick={() => onSelect(datum, index)}>
                  {datum.label}
                </button>
              ) : (
                datum.label
              )}
            </th>
            <td>{formatValue(datum.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
