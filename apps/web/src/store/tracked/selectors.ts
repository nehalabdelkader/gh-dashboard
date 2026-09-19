/**
 * Derived reads of the tracked list.
 *
 * `createSelector` memoizes, which matters here because `selectTrackedRepos` builds a new
 * array: without memoization every store update would hand `RepoList` a fresh array and
 * re-render every card, including the fourteen that did not change.
 */
import { createSelector } from '@reduxjs/toolkit';
import type { RepoId, TrackedRepo } from '@gh/github-api';
import type { RootState } from '../types.js';

export const selectTrackedState = (state: RootState) => state.tracked;
export const selectTrackedIds = (state: RootState): readonly RepoId[] => state.tracked.ids;
export const selectTrackedEntities = (state: RootState) => state.tracked.entities;

export const selectTrackedRepo = (state: RootState, id: RepoId): TrackedRepo | undefined =>
  state.tracked.entities[id];

export const selectIsTracked = (state: RootState, id: RepoId): boolean =>
  id in state.tracked.entities;

export const selectTrackedCount = (state: RootState): number => state.tracked.ids.length;

export const selectTrackedRepos = createSelector(
  [selectTrackedIds, selectTrackedEntities],
  (ids, entities): TrackedRepo[] =>
    ids.map((id) => entities[id]).filter((repo): repo is TrackedRepo => repo !== undefined),
);

/**
 * The stars bar chart's data, sorted desc.
 *
 * Deliberately shaped as `{ label, value }` rather than as repos: `@gh/charts` takes no
 * GitHub vocabulary, so the mapping has to happen on this side of the boundary.
 */
export const selectStarsChartData = createSelector(
  [selectTrackedRepos],
  (repos): Array<{ id: RepoId; label: string; value: number }> =>
    repos
      .filter((repo) => repo.snapshot !== undefined)
      .map((repo) => ({
        id: repo.id,
        label: repo.name,
        value: repo.snapshot?.stats.stars ?? 0,
      }))
      .sort((a, b) => b.value - a.value),
);

/** Repos whose snapshot is missing or older than `maxAgeMs` — the refresh-all worklist. */
export const makeSelectStaleTracked = (maxAgeMs: number) =>
  createSelector([selectTrackedRepos, (_state: RootState, now: number) => now], (repos, now) =>
    repos.filter((repo) => {
      if (!repo.snapshot) return true;
      const fetchedAt = new Date(repo.snapshot.fetchedAt).getTime();
      return Number.isNaN(fetchedAt) || now - fetchedAt > maxAgeMs;
    }),
  );
