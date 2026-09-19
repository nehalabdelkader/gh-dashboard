import CallSplitIcon from '@mui/icons-material/CallSplit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LaunchIcon from '@mui/icons-material/Launch';
import RefreshIcon from '@mui/icons-material/Refresh';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { RepoCardRepo, RepoStatus } from '../types.js';
import { formatAbsoluteDate, formatCompactNumber, formatRelativeTime } from '../utils/format.js';
import { ErrorState, type ErrorStateProps } from './ErrorState.js';
import { LoadingSkeleton } from './LoadingSkeleton.js';
import { StatTile } from './StatTile.js';

export interface RepoCardProps {
  repo: RepoCardRepo;
  /** The one prop that drives every per-card visual. See `RepoStatus`. */
  status?: RepoStatus | undefined;
  /** Rendered as an inline strip. The card keeps its stale values on screen beside it. */
  error?: ErrorStateProps | undefined;
  onRefresh?: (() => void) | undefined;
  onUntrack?: (() => void) | undefined;
  /** Navigate to the detail page. The card emits; the app decides what that means. */
  onOpen?: (() => void) | undefined;
  /** Set while the quota is too low to be worth spending. */
  refreshDisabled?: boolean | undefined;
  refreshDisabledReason?: string | undefined;
  now?: Date | number | undefined;
}

/**
 * One tracked repository.
 *
 * Knows nothing about a store, a query cache or GitHub: it takes a `status`, a `repo` and
 * callbacks. That is what makes independent per-repo loading and error states renderable —
 * fifteen of these can sit in a grid, each in a different state, with no shared blob.
 */
export function RepoCard({
  repo,
  status = 'idle',
  error,
  onRefresh,
  onUntrack,
  onOpen,
  refreshDisabled,
  refreshDisabledReason,
  now,
}: RepoCardProps) {
  const isRefreshing = status === 'refreshing';

  // A first load has nothing to show yet; a refresh keeps the previous values visible and
  // just dims them, so the card never flashes empty on revalidation.
  if (status === 'loading') {
    return <LoadingSkeleton variant="card" />;
  }

  const lastCommitTooltip = formatAbsoluteDate(repo.lastCommitAt);
  const refreshButton = (
    <span>
      <IconButton
        aria-label={`Refresh ${repo.fullName}`}
        onClick={onRefresh}
        disabled={isRefreshing || (refreshDisabled ?? false) || !onRefresh}
        size="small"
      >
        {isRefreshing ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
      </IconButton>
    </span>
  );

  return (
    <Card aria-busy={isRefreshing}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Avatar
            src={repo.ownerAvatarUrl}
            alt=""
            variant="rounded"
            sx={{ width: 32, height: 32 }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h3" component="h2" noWrap title={repo.fullName}>
              {onOpen ? (
                <Link
                  component="button"
                  type="button"
                  onClick={onOpen}
                  color="inherit"
                  sx={{ textAlign: 'left' }}
                >
                  {repo.fullName}
                </Link>
              ) : (
                repo.fullName
              )}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {repo.description ?? 'No description.'}
            </Typography>
          </Box>
          {status === 'error' ? (
            <Tooltip title="Last refresh failed">
              <ErrorOutlineIcon color="error" fontSize="small" />
            </Tooltip>
          ) : null}
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {repo.language ? <Chip label={repo.language} variant="outlined" /> : null}
          {repo.archived ? <Chip label="Archived" color="warning" variant="outlined" /> : null}
        </Stack>

        <Stack direction="row" spacing={3} sx={{ mt: 'auto', pt: 1 }}>
          <StatTile
            label="Stars"
            icon={<StarBorderIcon fontSize="inherit" />}
            value={formatCompactNumber(repo.stats.stars)}
            tooltip={`${repo.stats.stars.toLocaleString()} stars`}
            stale={isRefreshing}
          />
          <StatTile
            label="Open issues"
            icon={<ErrorOutlineIcon fontSize="inherit" />}
            value={formatCompactNumber(repo.stats.openIssues)}
            tooltip={`${repo.stats.openIssues.toLocaleString()} open issues`}
            stale={isRefreshing}
          />
          {repo.stats.forks === undefined ? null : (
            <StatTile
              label="Forks"
              icon={<CallSplitIcon fontSize="inherit" />}
              value={formatCompactNumber(repo.stats.forks)}
              stale={isRefreshing}
            />
          )}
          <StatTile
            label="Last commit"
            value={formatRelativeTime(repo.lastCommitAt, now === undefined ? {} : { now })}
            tooltip={lastCommitTooltip}
            stale={isRefreshing}
          />
        </Stack>

        {/* `onRetry` first so a caller that supplies its own still wins. */}
        {error ? <ErrorState onRetry={onRefresh} {...error} variant="inline" /> : null}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 1.5, pt: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {repo.fetchedAt
            ? `Updated ${formatRelativeTime(repo.fetchedAt, now === undefined ? {} : { now })}`
            : 'Never refreshed'}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Open on GitHub">
            <IconButton
              size="small"
              component="a"
              href={repo.htmlUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`Open ${repo.fullName} on GitHub`}
            >
              <LaunchIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={refreshDisabled ? (refreshDisabledReason ?? 'Refresh unavailable') : 'Refresh'}
          >
            {refreshButton}
          </Tooltip>
          {onUntrack ? (
            <Tooltip title="Stop tracking">
              <IconButton
                size="small"
                color="error"
                onClick={onUntrack}
                aria-label={`Stop tracking ${repo.fullName}`}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </CardActions>
    </Card>
  );
}
