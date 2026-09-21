import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer } from './ChartContainer.js';
import { ChartDataTable } from './ChartDataTable.js';
import { describeSeries, formatPlain } from './describe.js';
import type { ChartDatum, ChartTheme, ValueFormatter } from './types.js';

export interface LanguagesDonutProps {
  data: readonly ChartDatum[];
  theme: ChartTheme;
  onSliceClick?: ((datum: ChartDatum, index: number) => void) | undefined;
  formatValue?: ValueFormatter | undefined;
  title?: string | undefined;
  description?: string | undefined;
  loading?: boolean | undefined;
  emptyMessage?: string | undefined;
  loadingMessage?: string | undefined;
  height?: number | undefined;
  ariaLabel?: string | undefined;
  valueLabel?: string | undefined;
  categoryLabel?: string | undefined;
}

/**
 * A composition chart: parts of one whole.
 *
 * A donut rather than a pie because the hole is where the total goes — and because the
 * arcs are easier to compare against a common inner edge. Slices cycle `theme.series`,
 * so the palette is the consumer's and the package still has no colours of its own.
 *
 * Like every chart here it takes `{ label, value }` rows: languages, dependencies or
 * anything else that sums to a meaningful total.
 */
export function LanguagesDonut({
  data,
  theme,
  onSliceClick,
  formatValue = formatPlain,
  title,
  description,
  loading,
  emptyMessage,
  loadingMessage,
  height = 260,
  ariaLabel,
  valueLabel = 'Share',
  categoryLabel = 'Language',
}: LanguagesDonutProps) {
  const rows = [...data];
  const label =
    ariaLabel ?? describeSeries('Donut chart', rows, formatValue, valueLabel.toLowerCase());

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
      <div role="img" aria-label={label} style={{ width: '100%', height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="label"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={1}
              stroke={theme.surface}
              isAnimationActive={false}
              {...(onSliceClick
                ? {
                    onClick: (_: unknown, index: number) =>
                      onSliceClick(rows[index] as ChartDatum, index),
                  }
                : {})}
            >
              {rows.map((datum, index) => (
                <Cell
                  key={datum.id ?? datum.label}
                  // Cycles rather than runs out: a repo with nine languages still gets
                  // nine slices, and the palette is the only source of colour.
                  fill={theme.series[index % Math.max(theme.series.length, 1)] ?? theme.text}
                  cursor={onSliceClick ? 'pointer' : 'default'}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) =>
                [formatValue(value), name] as [string, string]
              }
              contentStyle={{
                background: theme.surface,
                border: `1px solid ${theme.grid}`,
                borderRadius: theme.borderRadius,
                color: theme.text,
                fontFamily: theme.fontFamily,
                fontSize: theme.fontSize,
              }}
              itemStyle={{ color: theme.text }}
            />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              formatter={(value: string) => (
                <span style={{ color: theme.mutedText, fontSize: theme.fontSize }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        <ChartDataTable
          caption={label}
          data={rows}
          labelHeader={categoryLabel}
          valueHeader={valueLabel}
          formatValue={formatValue}
          onSelect={onSliceClick}
        />
      </div>
    </ChartContainer>
  );
}
