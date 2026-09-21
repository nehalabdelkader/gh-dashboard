import CallSplitIcon from '@mui/icons-material/CallSplit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
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
import type { ElementType } from 'react';
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
  /**
   * Where the card points. Given, the whole card is a link to it.
   *
   * A URL rather than an `onOpen` callback: navigation is what an anchor is for, and an
   * anchor is what gives middle-click, cmd-click, "copy link address" and a status-bar
   * preview. A callback would have to reimplement all four, badly.
   */
  href?: string | undefined;
  /**
   * The router's link component — react-router's `Link`, say. It receives `to`.
   * Omitted, the card renders a plain `<a href>`, which is what keeps this package
   * free of a router dependency.
   */
  linkComponent?: ElementType | undefined;
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
  href,
  linkComponent,
  refreshDisabled,
  refreshDisabledReason,
  now,
}: RepoCardProps) {
  const isRefreshing = status === 'refreshing';

  // A first load has nothing to show yet, and a refresh is treated the same way: while
  // values are in flight the card shows the skeleton rather than stale numbers.
  if (status === 'loading' || isRefreshing) {
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
    <Card
      aria-busy={isRefreshing}
      sx={
        href !== undefined
          ? {
              position: 'relative',
              transition: 'border-color 150ms',
              '&:hover': { borderColor: 'primary.main' },
              // The whole card reacts, but only the title is focusable — see the
              // stretched hit area below.
              '&:has(:focus-visible)': { borderColor: 'primary.main' },
            }
          : undefined
      }
    >
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
              {href === undefined ? (
                repo.fullName
              ) : (
                <Link
                  {...(linkComponent ? { component: linkComponent, to: href } : { href })}
                  color="inherit"
                  sx={{
                    textAlign: 'left',
                    // The card is one big click target, but this anchor is the only
                    // focusable thing in it: its hit area is stretched over the whole
                    // card with a pseudo-element. Wrapping the card in the anchor
                    // instead would nest the refresh and untrack buttons inside a link —
                    // invalid HTML, and unusable with a screen reader.
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      cursor: 'pointer',
                    },
                  }}
                >
                  {repo.fullName}
                </Link>
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

        {/* Above the stretched hit area, so its retry button is clickable rather than
            swallowed by the card's own click target. */}
        {error ? (
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* `onRetry` first so a caller that supplies its own still wins. */}
            <ErrorState onRetry={onRefresh} {...error} variant="inline" />
          </Box>
        ) : null}
      </CardContent>

      {/* Same: the action row sits above the card's hit area, so Refresh and Untrack
          stay their own buttons instead of navigating. */}
      <CardActions
        sx={{ justifyContent: 'end', px: 2, pb: 1.5, pt: 0, position: 'relative', zIndex: 1 }}
      >
        <Stack direction="row" spacing={0.5}>
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
