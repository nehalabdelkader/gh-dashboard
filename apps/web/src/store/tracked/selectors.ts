/**
 * Derived reads of the tracked list.
 *
 * `createSelector` memoizes, which matters here because `selectTrackedRepos` builds a new
 * array: without memoization every store update would hand `RepoList` a fresh array and
 * re-render every card, including the fourteen that did not change.
 */
import { createSelector } from '@reduxjs/toolkit';
import type { RepoDetail, RepoId, TrackedRepo } from '@gh/github-api';
import { githubApi, repoCacheKey } from '../api/githubApi.js';
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
 * The query cache, as an input selector.
 *
 * Stars are server state, so this is where they are — the tracked slice holds references
 * only. Taking the `queries` dictionary as the input keeps the memoization honest: it is a
 * new object only when a query actually changed, not on every dispatch.
 */
const selectQueryCache = (state: RootState) => state[githubApi.reducerPath].queries;

/** A repo's cached detail, or `undefined` if it has not been fetched this session. */
function cachedDetail(
  cache: ReturnType<typeof selectQueryCache>,
  id: RepoId,
): RepoDetail | undefined {
  return cache[repoCacheKey(id)]?.data as RepoDetail | undefined;
}

/**
 * The stars bar chart's data, sorted desc.
 *
 * Deliberately shaped as `{ label, value }` rather than as repos: `@gh/charts` takes no
 * GitHub vocabulary, so the mapping has to happen on this side of the boundary.
 *
 * A tracked repo whose stats have not been fetched yet is left out rather than plotted as
 * zero — a bar at zero reads as "no stars", which is a different claim from "not loaded".
 */
export const selectStarsChartData = createSelector(
  [selectTrackedRepos, selectQueryCache],
  (repos, cache): Array<{ id: RepoId; label: string; value: number }> =>
    repos
      .map((repo) => ({ repo, detail: cachedDetail(cache, repo.id) }))
      .filter(
        (entry): entry is { repo: TrackedRepo; detail: RepoDetail } => entry.detail !== undefined,
      )
      .map(({ repo, detail }) => ({ id: repo.id, label: repo.name, value: detail.stats.stars }))
      .sort((a, b) => b.value - a.value),
);
