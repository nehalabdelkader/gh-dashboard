/**
 * The tracked list — client state, and *only* client state.
 *
 * An entry is a reference: `{ id, owner, name }`. Which repos the user follows is the one
 * fact this app owns; stars, description, default branch and last commit all belong to
 * GitHub and live in the RTK Query cache, keyed by the same id. Keeping a second copy here
 * meant two sources of truth for one repo, a write to localStorage on every refresh of
 * every card, and a persisted `stars: 41200` that was wrong by the next morning.
 *
 * Normalized `{ ids, entities }` so a repo can be found or removed by id without walking an
 * array, and so `ids` alone gives the render order.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { toRepoId, type RepoId, type TrackedRepo } from '@gh/github-api';

export interface TrackedState {
  ids: RepoId[];
  entities: Record<RepoId, TrackedRepo>;
}

export const initialTrackedState: TrackedState = { ids: [], entities: {} };

/**
 * What a search row or a detail page has to hand when the user hits Track.
 *
 * Two fields, and both are identity. A caller with a whole `RepoSummary` passes the two it
 * needs rather than the twelve it has — the other ten are already cached under this id.
 */
export interface TrackRepoInput {
  owner: string;
  name: string;
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
      // The id is derived here rather than in the caller so the format is defined in one
      // place — it is also the cache key every query for this repo is stored under.
      prepare(input: TrackRepoInput) {
        return {
          payload: {
            id: toRepoId(input.owner, input.name),
            owner: input.owner,
            name: input.name,
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

    /** Wholesale replace — used by the persistence layer's tests and by migrations. */
    trackedReplaced(_state, action: PayloadAction<TrackedState>) {
      return action.payload;
    },
  },
});

export const { trackRepo, untrackRepo, trackedReplaced } = trackedSlice.actions;
export const trackedReducer = trackedSlice.reducer;
export const TRACKED_SLICE_NAME = trackedSlice.name;
