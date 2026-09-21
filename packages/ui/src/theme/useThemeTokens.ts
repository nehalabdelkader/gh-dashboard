import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import type { PaletteMode } from './createAppTheme.js';

/**
 * The theme, flattened to plain values.
 *
 * Exists so the app can hand the current look to something that is not a MUI consumer —
 * `@gh/charts` takes a theme object rather than reading a context, and the app is
 * forbidden from importing MUI to build one. Deliberately primitives only: a `Theme`
 * passed across that boundary would drag MUI's types along with it, which is exactly
 * what the boundary is for.
 */
export interface ThemeTokens {
  mode: PaletteMode;
  /** Categorical palette, ordered. First entry is the brand colour. */
  palette: readonly string[];
  background: string;
  surface: string;
  border: string;
  text: string;
  mutedText: string;
  fontFamily: string;
  fontSize: number;
  borderRadius: number;
}

export function useThemeTokens(): ThemeTokens {
  const theme = useTheme();

  // Memoized on the theme, which is itself memoized by the provider: consumers can put
  // the tokens straight into a dependency array without re-deriving on every render.
  return useMemo(
    () => ({
      mode: theme.palette.mode,
      palette: [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.info.main,
        theme.palette.error.main,
      ],
      background: theme.palette.background.default,
      surface: theme.palette.background.paper,
      border: theme.palette.divider,
      text: theme.palette.text.primary,
      mutedText: theme.palette.text.secondary,
      fontFamily: theme.typography.fontFamily ?? 'sans-serif',
      fontSize: 12,
      // MUI types this as `number | string` (a CSS length is legal); the tokens promise
      // px, so a themed `'0.5rem'` falls back rather than reaching a consumer as a number.
      borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 8,
    }),
    [theme],
  );
}
