/**
 * Boot-time rehydration.
 *
 * Runs once, before the store exists, and feeds `preloadedState` — not a `hydrate` action
 * dispatched after mount. That means the very first render is already correct: the tracked
 * page renders its cards straight away, with no flash of an empty list and no "is this
 * loading or genuinely empty?" ambiguity for the UI to resolve. What each card *shows*
 * still has to be fetched; what is restored here is the list itself.
 */
import type { SettingsState } from '../settings/settingsSlice.js';
import type { TrackedState } from '../tracked/trackedSlice.js';
import {
  LEGACY_TRACKED_KEY,
  LEGACY_TRACKED_SCHEMA_VERSION,
  SETTINGS_KEY,
  SETTINGS_SCHEMA_VERSION,
  TRACKED_KEY,
  TRACKED_SCHEMA_VERSION,
  unwrapIfCurrent,
  parseLegacyTrackedState,
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

  // One-off: a v1 blob still holds the user's list, so it is read *only* when v2 is absent
  // — after the first write under the v2 key this branch is dead for that browser. See
  // `parseLegacyTrackedState`.
  if (!result.tracked) {
    const legacy = readEnvelope(safeRead(storage, LEGACY_TRACKED_KEY));
    if (legacy) {
      const migrated = parseLegacyTrackedState(
        unwrapIfCurrent(legacy, LEGACY_TRACKED_SCHEMA_VERSION),
      );
      if (migrated) result.tracked = migrated;
    }
  }

  const settingsEnvelope = readEnvelope(safeRead(storage, SETTINGS_KEY));
  if (settingsEnvelope) {
    const settings = parseSettingsState(unwrapIfCurrent(settingsEnvelope, SETTINGS_SCHEMA_VERSION));
    if (settings) result.settings = settings;
  }

  return result;
}
