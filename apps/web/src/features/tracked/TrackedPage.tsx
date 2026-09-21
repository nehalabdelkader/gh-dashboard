import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  ConfirmDialog,
  EmptyState,
  RefreshIcon,
  Stack,
  StarIcon,
  Typography,
} from '@gh/ui';
import type { RepoId } from '@gh/github-api';
import { useAppDispatch, useAppSelector } from '@/store/hooks.js';
import { selectTrackedRepo, selectTrackedRepos } from '@/store/tracked/selectors.js';
import { githubApi } from '@/store/api/githubApi.js';
import { untrackRepo } from '@/store/tracked/trackedSlice.js';
import { repoDetailPath, ROUTES } from '@/app/routes.js';
import { StarsChart } from './StarsChart.js';
import { TrackedRepoCard } from './TrackedRepoCard.js';

/**
 * The tracked list.
 *
 * Renders straight from the store, which holds references only — each card fetches what it
 * shows. The list itself (which repos, in what order) is the one thing that survives a
 * reload.
 *
 * The stars chart the grid reads the same query cache the cards fill, so it costs
 * no request of its own and follows every refresh.
 *
 * "Refresh all" invalidates cache tags rather than fetching: the button is here and the
 * queries are on the cards, so RTK Query re-runs every subscription that provides a `Repo`
 * or `Commit` tag. Each card refetches through its own hooks, which is what keeps its
 * spinner and its error its own.
 */
export function TrackedPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const repos = useAppSelector(selectTrackedRepos);

  // The dialog holds an id, not the repo: the entity is read back out of the store at
  // render time, so an untrack from another tab can't leave a stale object on screen.
  const [pendingUntrack, setPendingUntrack] = useState<RepoId | undefined>(undefined);
  const pendingRepo = useAppSelector((state) =>
    pendingUntrack === undefined ? undefined : selectTrackedRepo(state, pendingUntrack),
  );

  // Invalidation, not a fetch: RTK Query refetches the subscriptions the cards hold, so
  // each card's `isFetching` and `error` are the ones that move.
  const refreshAll = () => {
    dispatch(githubApi.util.invalidateTags(['Repo', 'Commit']));
  };

  const confirmUntrack = () => {
    if (pendingUntrack !== undefined) dispatch(untrackRepo(pendingUntrack));
    setPendingUntrack(undefined);
  };

  if (repos.length === 0) {
    return (
      <EmptyState
        title="No tracked repositories yet"
        description="Track a repository from search to watch its stars, open issues and last commit here."
        icon={<StarIcon fontSize="inherit" />}
        action={
          <Button variant="contained" onClick={() => void navigate(ROUTES.search)}>
            Go to search
          </Button>
        }
      />
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <Stack spacing={0.5}>
          <Typography variant="h2" component="h1">
            Tracked repositories
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {repos.length} tracked
          </Typography>
        </Stack>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refreshAll}>
          Refresh all
        </Button>
      </Stack>

      {/* A raw 12-column grid instead of MUI's Grid: each card claims 6 columns (two per
          row), collapsing to the full 12 below `md` where half a row is too narrow. */}
      <Box
        component="ul"
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(12, 1fr)',
          '& > li': {
            gridColumn: { xs: 'span 12', md: 'span 6' },
            display: 'flex',
            '& > *': { flex: 1 },
          },
        }}
      >
        {repos.map((repo) => (
          <li key={repo.id}>
            <TrackedRepoCard
              repo={repo}
              onUntrack={() => setPendingUntrack(repo.id)}
              href={repoDetailPath(repo.owner, repo.name)}
            />
          </li>
        ))}
      </Box>

      <Box sx={{ mt: 3 }}>
        <StarsChart />
      </Box>

      <ConfirmDialog
        open={pendingRepo !== undefined}
        title="Stop tracking this repository?"
        description={
          pendingRepo
            ? `${pendingRepo.id} will be removed from this browser's tracked list.`
            : undefined
        }
        confirmLabel="Stop tracking"
        destructive
        onConfirm={confirmUntrack}
        onCancel={() => setPendingUntrack(undefined)}
      />
    </Stack>
  );
}
