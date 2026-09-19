import useMediaQuery from '@mui/material/useMediaQuery';
import type { PaletteMode } from './createAppTheme.js';
import type { ThemeMode } from '../types.js';

/**
 * Resolves a stored `ThemeMode` against the OS preference.
 *
 * Lives beside the provider rather than inside it so the provider file exports only a
 * component — otherwise Fast Refresh gives up on the whole module.
 */
export function useResolvedPaletteMode(mode: ThemeMode = 'system'): PaletteMode {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  if (mode === 'system') return prefersDark ? 'dark' : 'light';
  return mode;
}
