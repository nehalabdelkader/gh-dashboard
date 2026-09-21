import type { CSSProperties, ReactNode } from 'react';
import type { ChartTheme } from './types.js';

export interface ChartContainerProps {
  theme: ChartTheme;
  title?: string | undefined;
  /** Sub-label under the title. Also the chart's accessible description. */
  description?: string | undefined;
  /** Plot height in px. The width is always the container's — that is the responsive part. */
  height?: number | undefined;
  loading?: boolean | undefined;
  /** Renders the empty copy in place of the plot. The caller decides what "empty" means. */
  empty?: boolean | undefined;
  emptyMessage?: string | undefined;
  loadingMessage?: string | undefined;
  children: ReactNode;
}

/**
 * The frame every chart renders in: heading, fixed height, and the two states a plot
 * cannot draw itself.
 *
 * Loading and empty are handled here rather than in each chart because they are the same
 * box in both cases — and because a chart component that has to guard its own `data.length`
 * ends up owning copy, which is the consumer's call.
 */
export function ChartContainer({
  theme,
  title,
  description,
  height = 260,
  loading,
  empty,
  emptyMessage = 'Nothing to plot yet.',
  loadingMessage = 'Loading chart…',
  children,
}: ChartContainerProps) {
  const placeholder: CSSProperties = {
    height,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '0 16px',
    color: theme.mutedText,
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
    border: `1px dashed ${theme.grid}`,
    borderRadius: theme.borderRadius,
  };

  return (
    <figure style={{ margin: 0, width: '100%', fontFamily: theme.fontFamily }}>
      {title === undefined && description === undefined ? null : (
        <figcaption style={{ marginBottom: 12 }}>
          {title === undefined ? null : (
            <span
              style={{
                display: 'block',
                color: theme.text,
                fontSize: theme.fontSize + 2,
                fontWeight: 600,
              }}
            >
              {title}
            </span>
          )}
          {description === undefined ? null : (
            <span style={{ display: 'block', color: theme.mutedText, fontSize: theme.fontSize }}>
              {description}
            </span>
          )}
        </figcaption>
      )}

      {loading ? (
        <div style={placeholder} role="status" aria-busy="true">
          {loadingMessage}
        </div>
      ) : empty ? (
        <div style={placeholder}>{emptyMessage}</div>
      ) : (
        <div style={{ width: '100%', height }}>{children}</div>
      )}
    </figure>
  );
}
