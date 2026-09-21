import { RepoCard } from '@gh/ui';
import type { TrackedRepo } from '@gh/github-api';
import { useGetLastCommitQuery, useGetRepoQuery } from '@/store/api/githubApi.js';
import { toErrorDisplay, toErrorStateProps } from '@/store/api/errorCopy.js';
import { toRepoCardRepo } from './toRepoCardRepo.js';

export interface TrackedRepoCardProps {
  repo: TrackedRepo;
  onUntrack: () => void;
  onOpen: () => void;
}

/**
 * One tracked repo, with its own loading and error state.
 *
 * The store hands this component a reference and nothing else; everything on screen comes
 * from the two queries below. Both are keyed on *this* repo's args, so fifteen of these
 * hold fifteen independent `isFetching` / `error` entries — which is why one repo 404-ing
 * leaves the other fourteen refreshing normally.
 *
 * Nothing is written back. `getRepo` provides a `Repo` tag keyed on this repo's id, so
 * "Refresh all" invalidates the tags and RTK Query re-runs exactly the subscriptions these
 * hooks hold; the card's own button refetches just its two.
 */
export function TrackedRepoCard({ repo, onUntrack, onOpen }: TrackedRepoCardProps) {
  const repoQuery = useGetRepoQuery({ owner: repo.owner, name: repo.name });
  // No `ref`: the tracked entry no longer carries a default branch, and GitHub's own
  // default is the right answer anyway — one less field to keep in sync with upstream.
  const commitQuery = useGetLastCommitQuery({ owner: repo.owner, name: repo.name });

  const isFetching = repoQuery.isFetching || commitQuery.isFetching;
  const isLoading = repoQuery.isLoading || commitQuery.isLoading;
  const error = repoQuery.error ?? commitQuery.error;
  const display = toErrorDisplay(error);

  const card = toRepoCardRepo(repo, {
    detail: repoQuery.data,
    lastCommitAt: commitQuery.data?.committedAt,
  });

  // `loading` is a first fetch with nothing to show, `refreshing` a revalidation over
  // values already on screen. Same skeleton, but the card keeps the distinction for its
  // aria-busy and disabled-refresh handling.
  const status = isLoading ? 'loading' : isFetching ? 'refreshing' : display ? 'error' : 'idle';

  const onRefresh = () => {
    void repoQuery.refetch();
    void commitQuery.refetch();
  };

  return (
    <RepoCard
      repo={card}
      status={status}
      error={display ? toErrorStateProps(display, onRefresh) : undefined}
      onRefresh={onRefresh}
      onUntrack={onUntrack}
      onOpen={onOpen}
    />
  );
}
