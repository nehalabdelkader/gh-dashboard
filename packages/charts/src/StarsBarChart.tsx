import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer } from './ChartContainer.js';
import { ChartDataTable } from './ChartDataTable.js';
import type { ChartDatum, ChartTheme, ValueFormatter } from './types.js';

export interface StarsBarChartProps {
  data: readonly ChartDatum[];
  theme: ChartTheme;
  /** `'vertical'` bars rise from the category axis; `'horizontal'` ones run right from it. */
  orientation?: 'vertical' | 'horizontal' | undefined;
  onBarClick?: ((datum: ChartDatum, index: number) => void) | undefined;
  /** Defaults to the raw number. The app passes its compact formatter (`1.2K`). */
  formatValue?: ValueFormatter | undefined;
  title?: string | undefined;
  description?: string | undefined;
  loading?: boolean | undefined;
  emptyMessage?: string | undefined;
  loadingMessage?: string | undefined;
  height?: number | undefined;
  /** Accessible name for the plot. Generated from the data when omitted. */
  ariaLabel?: string | undefined;
  valueLabel?: string | undefined;
  categoryLabel?: string | undefined;
}

const MAX_TICK_CHARS = 14;

function truncate(label: string): string {
  return label.length > MAX_TICK_CHARS ? `${label.slice(0, MAX_TICK_CHARS - 1)}…` : label;
}

/**
 * Describes the plot in one sentence: what it is, how many bars, and the range.
 *
 * Generated rather than required so a caller gets a usable label for free, and can still
 * override it when the default reads badly.
 */
function describe(data: readonly ChartDatum[], format: ValueFormatter, what: string): string {
  const first = data[0];
  const last = data[data.length - 1];
  if (!first || !last) return `Bar chart of ${what}. No data.`;
  const count = `${String(data.length)} item${data.length === 1 ? '' : 's'}`;
  if (data.length === 1) return `Bar chart of ${what}: ${first.label}, ${format(first.value)}.`;
  return (
    `Bar chart of ${what}: ${count}, from ${first.label} at ${format(first.value)} ` +
    `to ${last.label} at ${format(last.value)}.`
  );
}

/**
 * A single-series bar chart.
 *
 * Named for the use it was built for, but it knows nothing about repositories: it plots
 * `{ label, value }` rows in the order given — sorting is the caller's decision, because
 * only the caller knows whether the order carries meaning.
 */
export function StarsBarChart({
  data,
  theme,
  orientation = 'vertical',
  onBarClick,
  formatValue = (value) => value.toLocaleString(),
  title,
  description,
  loading,
  emptyMessage,
  loadingMessage,
  height = 280,
  ariaLabel,
  valueLabel = 'Stars',
  categoryLabel = 'Repository',
}: StarsBarChartProps) {
  const horizontal = orientation === 'horizontal';
  const fill = theme.series[0] ?? theme.text;
  const label = ariaLabel ?? describe(data, formatValue, valueLabel.toLowerCase());

  // Recharts mutates nothing, but it does want a mutable array.
  const rows = [...data];

  const axisStyle = {
    fill: theme.mutedText,
    fontSize: theme.fontSize,
    fontFamily: theme.fontFamily,
  };

  // The category axis carries the labels wherever it sits; the value axis carries the
  // numbers. Which is x and which is y is the only thing `orientation` changes.
  const categoryAxis = {
    type: 'category',
    dataKey: 'label',
    tickFormatter: truncate,
    interval: 0,
    ...(horizontal ? { width: 112 } : {}),
  } as const;

  const valueAxis = {
    type: 'number',
    tickFormatter: formatValue,
    ...(horizontal ? {} : { width: 56 }),
  } as const;

  return (
    <ChartContainer
      theme={theme}
      title={title}
      description={description}
      height={height}
      loading={loading}
      empty={rows.length === 0}
      emptyMessage={emptyMessage}
      loadingMessage={loadingMessage}
    >
      {/* `role="img"` collapses the SVG to one node for assistive tech; the table below
          carries the values and the keyboard path to `onBarClick`. */}
      <div role="img" aria-label={label} style={{ width: '100%', height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 8, right: 16, bottom: 8, left: horizontal ? 8 : 0 }}
          >
            <CartesianGrid
              stroke={theme.grid}
              strokeDasharray="3 3"
              horizontal={!horizontal}
              vertical={horizontal}
            />
            {/* Both axes are direct children of `BarChart`, and each one's role swaps
                with the orientation. Recharts finds its axes by walking its own
                children: wrap them in a fragment or a conditional branch and it sees
                none, silently falls back to indices, and every label reads "1", "2". */}
            <XAxis
              {...(horizontal ? valueAxis : categoryAxis)}
              tick={axisStyle}
              stroke={theme.grid}
            />
            <YAxis
              {...(horizontal ? categoryAxis : valueAxis)}
              tick={axisStyle}
              stroke={theme.grid}
            />
            <Tooltip
              cursor={{ fill: theme.grid, fillOpacity: 0.3 }}
              formatter={(value: number) => [formatValue(value), valueLabel] as [string, string]}
              labelFormatter={(value: string) => `${categoryLabel}: ${value}`}
              contentStyle={{
                background: theme.surface,
                border: `1px solid ${theme.grid}`,
                borderRadius: theme.borderRadius,
                color: theme.text,
                fontFamily: theme.fontFamily,
                fontSize: theme.fontSize,
              }}
              itemStyle={{ color: theme.text }}
              labelStyle={{ color: theme.mutedText }}
            />
            <Bar
              dataKey="value"
              fill={fill}
              radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              isAnimationActive={false}
              {...(onBarClick
                ? {
                    onClick: (_: unknown, index: number) =>
                      onBarClick(rows[index] as ChartDatum, index),
                  }
                : {})}
            >
              {rows.map((datum) => (
                <Cell key={datum.id ?? datum.label} cursor={onBarClick ? 'pointer' : 'default'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <ChartDataTable
          caption={label}
          data={rows}
          labelHeader={categoryLabel}
          valueHeader={valueLabel}
          formatValue={formatValue}
          onSelect={onBarClick}
        />
      </div>
    </ChartContainer>
  );
}
