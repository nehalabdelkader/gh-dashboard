import { useMemo, type ReactNode } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from './createAppTheme.js';
import { useResolvedPaletteMode } from './useResolvedPaletteMode.js';
import type { ThemeMode } from '../types.js';

export interface AppThemeProviderProps {
  /** `'system'` follows `prefers-color-scheme` and re-renders when the OS setting flips. */
  mode?: ThemeMode | undefined;
  children: ReactNode;
}

export function AppThemeProvider({ mode = 'system', children }: AppThemeProviderProps) {
  const resolved = useResolvedPaletteMode(mode);
  const theme = useMemo(() => createAppTheme(resolved), [resolved]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
