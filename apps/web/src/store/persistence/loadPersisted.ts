/**
 * Boot-time rehydration.
 *
 * Runs once, before the store exists, and feeds `preloadedState` — not a `hydrate` action
 * dispatched after mount. That means the very first render is already correct: the tracked
 * page paints from the snapshot with no flash of an empty list, and no "is this loading or
 * genuinely empty?" ambiguity for the UI to resolve.
 */
import type { SettingsState } from '../settings/settingsSlice.js';
import type { TrackedState } from '../tracked/trackedSlice.js';
import {
  SETTINGS_KEY,
  SETTINGS_SCHEMA_VERSION,
  TRACKED_KEY,
  TRACKED_SCHEMA_VERSION,
  unwrapIfCurrent,
  parseSettingsState,
  parseTrackedState,
  readEnvelope,
} from './schema.js';
import { getDefaultStorage, safeRead } from './storage.js';

export interface PersistedState {
  tracked?: TrackedState | undefined;
  settings?: SettingsState | undefined;
}

/**
 * Returns whatever survived validation. Anything missing simply falls back to the slice's
 * own `initialState`, which is why every failure path here returns `undefined` instead of
 * throwing.
 */
export function loadPersisted(storage: Storage = getDefaultStorage()): PersistedState {
  const result: PersistedState = {};

  const trackedEnvelope = readEnvelope(safeRead(storage, TRACKED_KEY));
  if (trackedEnvelope) {
    const tracked = parseTrackedState(unwrapIfCurrent(trackedEnvelope, TRACKED_SCHEMA_VERSION));
    if (tracked) result.tracked = tracked;
  }

  const settingsEnvelope = readEnvelope(safeRead(storage, SETTINGS_KEY));
  if (settingsEnvelope) {
    const settings = parseSettingsState(unwrapIfCurrent(settingsEnvelope, SETTINGS_SCHEMA_VERSION));
    if (settings) result.settings = settings;
  }

  return result;
}
