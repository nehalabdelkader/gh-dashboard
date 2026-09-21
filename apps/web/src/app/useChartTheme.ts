import { useMemo } from 'react';
import { useThemeTokens } from '@gh/ui';
import type { ChartTheme } from '@gh/charts';

/**
 * Where the design system meets the chart package — the only place the two touch.
 *
 * `@gh/charts` has no MUI dependency and the app is forbidden from importing MUI, so
 * neither can reach the other's vocabulary directly. `@gh/ui` publishes the current theme
 * as plain tokens and this maps them onto the shape the charts ask for. Adding a chart
 * library, or a second theme, is a change to this file and nothing else.
 */
export function useChartTheme(): ChartTheme {
  const tokens = useThemeTokens();

  return useMemo(
    () => ({
      series: tokens.palette,
      surface: tokens.surface,
      grid: tokens.border,
      text: tokens.text,
      mutedText: tokens.mutedText,
      fontFamily: tokens.fontFamily,
      fontSize: tokens.fontSize,
      borderRadius: tokens.borderRadius,
    }),
    [tokens],
  );
}
