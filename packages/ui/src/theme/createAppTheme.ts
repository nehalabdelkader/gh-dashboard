import { createTheme, type Theme } from '@mui/material/styles';

/**
 * The resolved palette mode. `'system'` is a *setting*, not a mode — the app resolves it
 * against `prefers-color-scheme` before it gets here.
 */
export type PaletteMode = 'light' | 'dark';

const BRAND = {
  light: { primary: '#0969da', secondary: '#8250df', bg: '#f6f8fa', paper: '#ffffff' },
  dark: { primary: '#58a6ff', secondary: '#bc8cff', bg: '#0d1117', paper: '#161b22' },
} as const;

/**
 * Single source of truth for the visual language.
 *
 * Everything cosmetic lives here rather than in `sx` props scattered through components:
 * that is what makes the theme swappable and what keeps `@gh/charts` able to read a small
 * derived `ChartTheme` from one place (Phase 6).
 */
export function createAppTheme(mode: PaletteMode): Theme {
  const brand = BRAND[mode];

  return createTheme({
    palette: {
      mode,
      primary: { main: brand.primary },
      secondary: { main: brand.secondary },
      background: { default: brand.bg, paper: brand.paper },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: { fontSize: '1.75rem', fontWeight: 700 },
      h2: { fontSize: '1.375rem', fontWeight: 700 },
      h3: { fontSize: '1.125rem', fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: { root: { height: '100%', display: 'flex', flexDirection: 'column' } },
      },
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiChip: { defaultProps: { size: 'small' } },
      MuiTooltip: { defaultProps: { arrow: true, enterDelay: 400 } },
      MuiLink: { defaultProps: { underline: 'hover' } },
      MuiCssBaseline: {
        styleOverrides: {
          // Keyboard users must always be able to see where they are; MUI's default ring
          // is dropped by some resets, so it is pinned explicitly.
          ':focus-visible': { outline: `2px solid ${brand.primary}`, outlineOffset: '2px' },
        },
      },
    },
  });
}
