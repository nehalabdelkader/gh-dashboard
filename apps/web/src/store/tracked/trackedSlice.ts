/**
 * The tracked list — client state, not server state.
 *
 * Normalized `{ ids, entities }` so a card can be read, updated or removed by id without
 * walking an array, and so `snapshotUpdated` touches exactly one entity (fifteen cards
 * refreshing in parallel must not fight over one list).
 *
 * Each entry holds identity **plus a last-known snapshot**. That snapshot is what makes
 * the tracked page render instantly from localStorage on a cold load, before any request
 * resolves — the revalidation then happens behind already-correct-looking content.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { toRepoId, type RepoId, type RepoSnapshot, type TrackedRepo } from '@gh/github-api';

export interface TrackedState {
  ids: RepoId[];
  entities: Record<RepoId, TrackedRepo>;
}

export const initialTrackedState: TrackedState = { ids: [], entities: {} };

/** What a search row or a detail page has to hand when the user hits Track. */
export interface TrackRepoInput {
  owner: string;
  name: string;
  fullName?: string | undefined;
  description?: string | undefined;
  htmlUrl: string;
  defaultBranch: string;
  snapshot?: RepoSnapshot | undefined;
}

const trackedSlice = createSlice({
  name: 'tracked',
  initialState: initialTrackedState,
  reducers: {
    trackRepo: {
      reducer(state, action: PayloadAction<TrackedRepo>) {
        const repo = action.payload;
        // Idempotent: double-clicking Track, or tracking from search and detail at once,
        // must not produce a duplicate id.
        if (!(repo.id in state.entities)) state.ids.push(repo.id);
        state.entities[repo.id] = repo;
      },
      // `trackedAt` is generated here rather than in the caller so every dispatch site
      // does not have to remember to stamp it — and so the action stays serializable.
      prepare(input: TrackRepoInput) {
        const id = toRepoId(input.owner, input.name);
        return {
          payload: {
            id,
            owner: input.owner,
            name: input.name,
            fullName: input.fullName ?? id,
            description: input.description,
            htmlUrl: input.htmlUrl,
            defaultBranch: input.defaultBranch,
            trackedAt: new Date().toISOString(),
            snapshot: input.snapshot,
          } satisfies TrackedRepo,
        };
      },
    },

    untrackRepo(state, action: PayloadAction<RepoId>) {
      const id = action.payload;
      if (!(id in state.entities)) return;
      delete state.entities[id];
      state.ids = state.ids.filter((existing) => existing !== id);
    },

    /** Written on every successful refresh, so localStorage always holds the latest stats. */
    snapshotUpdated(state, action: PayloadAction<{ id: RepoId; snapshot: RepoSnapshot }>) {
      const entity = state.entities[action.payload.id];
      // A refresh can resolve after the user untracked the repo. Dropping it is correct;
      // re-adding the entity here would resurrect a card the user just removed.
      if (!entity) return;
      entity.snapshot = action.payload.snapshot;
    },

    /** Metadata refresh (description or default branch changed upstream). */
    trackedRepoUpdated(
      state,
      action: PayloadAction<{ id: RepoId; changes: Partial<Omit<TrackedRepo, 'id'>> }>,
    ) {
      const entity = state.entities[action.payload.id];
      if (!entity) return;
      Object.assign(entity, action.payload.changes);
    },

    /** Wholesale replace — used by the persistence layer's tests and by migrations. */
    trackedReplaced(_state, action: PayloadAction<TrackedState>) {
      return action.payload;
    },
  },
});

export const { trackRepo, untrackRepo, snapshotUpdated, trackedRepoUpdated, trackedReplaced } =
  trackedSlice.actions;
export const trackedReducer = trackedSlice.reducer;
export const TRACKED_SLICE_NAME = trackedSlice.name;
