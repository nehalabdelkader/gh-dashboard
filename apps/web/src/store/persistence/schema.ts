/**
 * Validation and migration for anything read back out of localStorage.
 *
 * Persisted data is **untrusted input**. It can be hand-edited in DevTools, written by an
 * older build with a different shape, or truncated by a tab killed mid-write. And the
 * failure mode is unusually nasty: bad data that crashes boot reloads with the page, so
 * the app is bricked until the user clears site data by hand. Hence: validate everything,
 * and on any doubt discard rather than throw.
 *
 * Hand-written rather than a schema library — two shapes do not earn the dependency.
 */
import type { TrackedRepo } from '@gh/github-api';
import { initialTrackedState, type TrackedState } from '../tracked/trackedSlice.js';
import {
  initialSettingsState,
  type SettingsState,
  type ThemeMode,
} from '../settings/settingsSlice.js';

/**
 * Bump when a stored shape changes incompatibly.
 *
 * The version is part of the key, so a bump **discards** rather than migrates: the new
 * build reads a key that does not exist yet and the user starts fresh. Deliberate — most
 * stored shapes are caches of something re-fetchable, and a migration path per version is
 * its own source of bugs.
 *
 * The old blob is orphaned under the old key rather than deleted. Harmless, and it means
 * a rolled-back deploy finds its data intact.
 *
 * v2 is the documented exception, in {@link parseLegacyTrackedState}: the tracked list is
 * now the *only* thing this app cannot re-fetch, and a v1 entry already contains the three
 * fields a v2 entry needs. Discarding it would delete the user's list on deploy day.
 */
export const TRACKED_SCHEMA_VERSION = 2;
export const SETTINGS_SCHEMA_VERSION = 1;

/** v1 held a full repo copy per entry. Read once, at boot, to salvage the ids. */
export const LEGACY_TRACKED_KEY = 'gh-dash:tracked:v1';
export const LEGACY_TRACKED_SCHEMA_VERSION = 1;

export const TRACKED_KEY = `gh-dash:tracked:v${TRACKED_SCHEMA_VERSION}`;
export const SETTINGS_KEY = `gh-dash:settings:v${SETTINGS_SCHEMA_VERSION}`;

/**
 * The version is stored in the payload as well as in the key.
 *
 * Redundant by design: the key already routes a new build away from old data. This is the
 * guard for the case the key cannot catch — a payload whose version disagrees with the key
 * it was found under, which means a hand-edit in DevTools or a partially-written blob.
 */
export interface Envelope<T> {
  version: number;
  data: T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Three string fields, and that is the whole record now.
 *
 * A v1 entry carried stats, a description and a default branch too. Those are server state
 * and live in the query cache; validating them here was validating a copy that was already
 * wrong by the time it was read back.
 */
function isTrackedRepo(value: unknown): value is TrackedRepo {
  if (!isRecord(value)) return false;
  return isString(value['id']) && isString(value['owner']) && isString(value['name']);
}

/**
 * Validates, and drops individual bad entries rather than the whole list.
 *
 * Losing fourteen good repos because the fifteenth is malformed would be the wrong trade —
 * this is the same "one failure must not take out the others" rule the cards follow.
 */
export function parseTrackedState(value: unknown): TrackedState | undefined {
  if (!isRecord(value)) return undefined;
  const { ids, entities } = value;
  if (!Array.isArray(ids) || !isRecord(entities)) return undefined;

  const result: TrackedState = { ids: [], entities: {} };
  for (const id of ids) {
    if (!isString(id)) continue;
    const entity = entities[id];
    // An id with no entity (or a broken one) would render as a blank card forever.
    if (!isTrackedRepo(entity) || entity.id !== id) continue;
    result.ids.push(id);
    result.entities[id] = entity;
  }
  return result;
}

/**
 * Salvages the references out of a v1 blob.
 *
 * Every v1 entry carried `id`, `owner` and `name` alongside the stats — so the migration is
 * a projection, not a transform: drop everything that is server state and keep the three
 * fields that identify the repo. Anything malformed is skipped, same rule as above.
 */
export function parseLegacyTrackedState(value: unknown): TrackedState | undefined {
  if (!isRecord(value)) return undefined;
  const { ids, entities } = value;
  if (!Array.isArray(ids) || !isRecord(entities)) return undefined;

  const result: TrackedState = { ids: [], entities: {} };
  for (const id of ids) {
    if (!isString(id)) continue;
    const entity = entities[id];
    if (!isRecord(entity)) continue;
    const owner = entity['owner'];
    const name = entity['name'];
    if (!isString(owner) || !isString(name) || entity['id'] !== id) continue;
    result.ids.push(id);
    result.entities[id] = { id, owner, name };
  }
  return result.ids.length > 0 ? result : undefined;
}

const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

export function parseSettingsState(value: unknown): SettingsState | undefined {
  if (!isRecord(value)) return undefined;
  const themeMode = value['themeMode'];
  // Rebuilt field by field rather than spread, so a blob written by an older build contributes only what the current shape declares.
  return {
    themeMode: THEME_MODES.includes(themeMode as ThemeMode)
      ? (themeMode as ThemeMode)
      : initialSettingsState.themeMode,
  };
}

/**
 * Unwraps an envelope, or discards it if it is not the version we expect.
 *
 * Not a migration step, and not named like one: nothing is ever transformed here. Because
 * the version is in the key, a bumped build simply never finds the old blob, so data from
 * a previous schema does not reach this function at all.
 *
 * What it does catch is a payload that disagrees with its key — hand-edited, or written by
 * a build that got the pairing wrong. Discarding beats guessing at the shape.
 */
export function unwrapIfCurrent(envelope: Envelope<unknown>, currentVersion: number): unknown {
  if (envelope.version === currentVersion) return envelope.data;
  return undefined;
}

export function readEnvelope(raw: string | null): Envelope<unknown> | undefined {
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isFiniteNumber(parsed['version'])) return undefined;
    return { version: parsed['version'], data: parsed['data'] };
  } catch {
    // Truncated or hand-mangled JSON.
    return undefined;
  }
}

export function writeEnvelope<T>(version: number, data: T): string {
  return JSON.stringify({ version, data } satisfies Envelope<T>);
}

export { initialTrackedState, initialSettingsState };
