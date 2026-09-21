/**
 * The write half of persistence.
 *
 * A listener middleware, not a reducer side effect: reducers must stay pure, or
 * time-travel debugging, tests and StrictMode's double-invoke all stop meaning anything.
 *
 * It matches only the two slices worth persisting. Without that filter it would fire on
 * every RTK Query lifecycle action — dozens per search — and `localStorage.setItem` is
 * synchronous, so each one blocks the main thread while it stringifies the whole list.
 *
 * Since the tracked list holds references only, the matching actions are just the three
 * that change *which* repos are tracked. Refreshing a card writes nothing to disk at all.
 */
import { createListenerMiddleware, isAnyOf, type TypedStartListening } from '@reduxjs/toolkit';
import { settingsReplaced, themeModeChanged } from '../settings/settingsSlice.js';
import { trackRepo, trackedReplaced, untrackRepo } from '../tracked/trackedSlice.js';
import type { AppDispatch, RootState } from '../types.js';
import {
  SETTINGS_KEY,
  SETTINGS_SCHEMA_VERSION,
  TRACKED_KEY,
  TRACKED_SCHEMA_VERSION,
  writeEnvelope,
} from './schema.js';
import { getDefaultStorage, safeWrite } from './storage.js';

/** Coalesces a burst — tracking five repos quickly is one write, not five. */
const WRITE_DEBOUNCE_MS = 300;

export function createPersistenceMiddleware(debounceMs: number = WRITE_DEBOUNCE_MS) {
  const storage = getDefaultStorage();
  const listener = createListenerMiddleware();
  const startListening = listener.startListening as TypedStartListening<RootState, AppDispatch>;

  startListening({
    matcher: isAnyOf(trackRepo, untrackRepo, trackedReplaced),
    effect: async (_action, api) => {
      // Cancels the *pending* effect from the previous matching action, which is what
      // makes this a debounce rather than N delayed writes.
      api.cancelActiveListeners();
      await api.delay(debounceMs);
      safeWrite(
        storage,
        TRACKED_KEY,
        writeEnvelope(TRACKED_SCHEMA_VERSION, api.getState().tracked),
      );
    },
  });

  startListening({
    matcher: isAnyOf(themeModeChanged, settingsReplaced),
    effect: async (_action, api) => {
      api.cancelActiveListeners();
      await api.delay(debounceMs);
      safeWrite(
        storage,
        SETTINGS_KEY,
        writeEnvelope(SETTINGS_SCHEMA_VERSION, api.getState().settings),
      );
    },
  });

  return listener;
}
