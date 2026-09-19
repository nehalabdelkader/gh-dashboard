import { Provider } from 'react-redux';
import { AppThemeProvider } from '@gh/ui';
import { AppRouter } from './app/AppRouter.js';
import { store } from './store/index.js';
import { selectThemeMode } from './store/settings/settingsSlice.js';
import { useAppSelector } from './store/hooks.js';

/**
 * Inside the `Provider`, so the theme can be read from the store.
 *
 * The mode lives in `settingsSlice` rather than in component state because it is
 * persisted: the listener middleware writes it to localStorage, and `loadPersisted()`
 * hands it back at boot as `preloadedState` — so a reload paints in the chosen theme
 * instead of flashing the default one first.
 */
function ThemedApp() {
  const mode = useAppSelector(selectThemeMode);

  return (
    <AppThemeProvider mode={mode}>
      <AppRouter />
    </AppThemeProvider>
  );
}

/**
 * Composition root: store, then theme, then routes.
 *
 * The `Provider` lives here rather than in `main.tsx` so tests render the real wiring —
 * a test that has to assemble its own providers is testing its own assembly.
 */
export function App() {
  return (
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  );
}
