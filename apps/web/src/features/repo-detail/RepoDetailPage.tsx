import { Link as RouterLink, useParams } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';
import { Box, Button, ErrorState, Stack } from '@gh/ui';
import { toRepoId } from '@gh/github-api';
import { useGetLastCommitQuery, useGetRepoQuery } from '@/store/api/githubApi.js';
import { toErrorDisplay } from '@/store/api/errorCopy.js';
import { useAppDispatch, useAppSelector } from '@/store/hooks.js';
import { selectIsTracked } from '@/store/tracked/selectors.js';
import { trackRepo, untrackRepo } from '@/store/tracked/trackedSlice.js';
import { ROUTES } from '@/app/routes.js';
import { ContributorsSection } from './ContributorsSection.js';
import { LanguagesSection } from './LanguagesSection.js';
import { RepoOverview } from './RepoOverview.js';

/**
 * `/repo/:owner/:name`.
 *
 * Four queries, each owned by the part of the page that renders it, all keyed on this
 * repo's args. Nothing is coordinated: the header, the languages and the contributors
 * each load and fail on their own, so a 403 on contributors leaves the stats on screen.
 * The repo and last-commit entries are the same cache entries the tracked page fills, so
 * arriving from there is free.
 *
 * A direct cold load is the case that matters: the URL is the only input, and none of
 * this depends on the repo being tracked.
 */
export function RepoDetailPage() {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  const dispatch = useAppDispatch();

  // The route cannot match without both segments, but `useParams` types them as optional
  // and `skipToken` is how "no argument yet" stays a type rather than a runtime check.
  const arg = owner && name ? { owner, name } : undefined;
  const repoQuery = useGetRepoQuery(arg ?? skipToken);
  const commitQuery = useGetLastCommitQuery(arg ?? skipToken);

  const isTracked = useAppSelector((state) =>
    arg ? selectIsTracked(state, toRepoId(arg.owner, arg.name)) : false,
  );

  const display = toErrorDisplay(repoQuery.error ?? commitQuery.error);

  const toggleTrack = () => {
    if (!arg) return;
    if (isTracked) dispatch(untrackRepo(toRepoId(arg.owner, arg.name)));
    else dispatch(trackRepo(arg));
  };

  const backToSearch = (
    <Button component={RouterLink} to={ROUTES.search} variant="contained">
      Back to search
    </Button>
  );

  if (!arg) {
    return (
      <ErrorState
        title="Repository not found"
        message="That URL is missing an owner or a repository name."
        severity="warning"
        action={backToSearch}
      />
    );
  }

  // A 404 is about the URL, not about one section: there is no repo, so there is nothing
  // for the other panels to describe. Every other failure keeps the page and shows the
  // strip in whichever section owns it.
  const repoDisplay = toErrorDisplay(repoQuery.error);
  if (repoDisplay && !repoQuery.data && !repoDisplay.retryable) {
    return (
      <ErrorState
        title={repoDisplay.title}
        message={`${owner ?? ''}/${name ?? ''} — ${repoDisplay.message}`}
        severity={repoDisplay.severity}
        action={backToSearch}
      />
    );
  }

  return (
    <Stack spacing={3}>
      <RepoOverview
        repo={repoQuery.data}
        lastCommit={commitQuery.data}
        loading={repoQuery.isLoading || commitQuery.isLoading}
        error={display}
        isTracked={isTracked}
        onToggleTrack={toggleTrack}
      />

      {/* Two panels side by side above `md`, stacked below — the donut and the
          contributor list are both unreadable in half a phone's width. */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          alignItems: 'stretch',
        }}
      >
        <LanguagesSection owner={arg.owner} name={arg.name} />
        <ContributorsSection owner={arg.owner} name={arg.name} />
      </Box>
    </Stack>
  );
}
