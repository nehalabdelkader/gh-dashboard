import {
  Avatar,
  Box,
  Button,
  Chip,
  CommitIcon,
  ErrorState,
  ForkIcon,
  HomeIcon,
  IssueIcon,
  LaunchIcon,
  LicenseIcon,
  Link,
  LoadingSkeleton,
  Stack,
  StarIcon,
  StatTile,
  Typography,
  WatchersIcon,
  formatAbsoluteDate,
  formatCompactNumber,
  formatRelativeTime,
} from '@gh/ui';
import type { CommitSummary, RepoDetail } from '@gh/github-api';
import { toErrorStateProps, type ErrorDisplay } from '@/store/api/errorCopy.js';

export interface RepoOverviewProps {
  repo: RepoDetail | undefined;
  lastCommit: CommitSummary | null | undefined;
  loading: boolean;
  error: ErrorDisplay | undefined;
  isTracked: boolean;
  onToggleTrack: () => void;
}

/**
 * The page's header: identity, stats, and the track toggle.
 *
 * Not `RepoCard` from `@gh/ui`. That component is built for a grid — clamped
 * description, four stats, a fixed action row — and stretching it to also be a page
 * header would mean a pile of `variant` props inside the design system for one caller.
 * A page this shape is the app's composition job; the parts it is built from (`StatTile`,
 * `ErrorState`, the formatters) are the design system's.
 */
export function RepoOverview({
  repo,
  lastCommit,
  loading,
  error,
  isTracked,
  onToggleTrack,
}: RepoOverviewProps) {
  if (loading && !repo) return <LoadingSkeleton variant="card" />;

  // A failure with nothing cached is the whole header; with a cached repo the strip sits
  // above values that are merely stale, which is worth keeping on screen.
  if (!repo) {
    return error ? (
      <ErrorState {...toErrorStateProps(error)} />
    ) : (
      <LoadingSkeleton variant="card" />
    );
  }

  const committedAt = lastCommit?.committedAt;

  return (
    <Stack spacing={2} component="header">
      {error ? <ErrorState {...toErrorStateProps(error)} variant="inline" /> : null}

      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Avatar src={repo.ownerAvatarUrl} alt="" variant="rounded" sx={{ width: 48, height: 48 }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h2" component="h1" sx={{ wordBreak: 'break-word' }}>
            {repo.fullName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {repo.description ?? 'No description.'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button
            variant={isTracked ? 'outlined' : 'contained'}
            color={isTracked ? 'error' : 'primary'}
            startIcon={<StarIcon />}
            onClick={onToggleTrack}
          >
            {isTracked ? 'Untrack' : 'Track'}
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {repo.language ? <Chip label={repo.language} variant="outlined" /> : null}
        {repo.archived ? <Chip label="Archived" color="warning" variant="outlined" /> : null}
        {repo.isFork ? <Chip label="Fork" variant="outlined" /> : null}
        {repo.license ? (
          <Chip icon={<LicenseIcon />} label={repo.license} variant="outlined" />
        ) : null}
        {repo.topics.map((topic) => (
          <Chip key={topic} label={topic} size="small" />
        ))}
      </Stack>

      <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
        <StatTile
          label="Stars"
          icon={<StarIcon fontSize="inherit" />}
          value={formatCompactNumber(repo.stats.stars)}
          tooltip={`${repo.stats.stars.toLocaleString()} stars`}
        />
        <StatTile
          label="Open issues"
          icon={<IssueIcon fontSize="inherit" />}
          value={formatCompactNumber(repo.stats.openIssues)}
          tooltip={`${repo.stats.openIssues.toLocaleString()} open issues`}
        />
        <StatTile
          label="Forks"
          icon={<ForkIcon fontSize="inherit" />}
          value={formatCompactNumber(repo.stats.forks)}
        />
        <StatTile
          label="Watchers"
          icon={<WatchersIcon fontSize="inherit" />}
          value={formatCompactNumber(repo.subscribersCount ?? repo.stats.watchers)}
        />
        <StatTile
          label="Last commit"
          icon={<CommitIcon fontSize="inherit" />}
          value={formatRelativeTime(committedAt)}
          tooltip={formatAbsoluteDate(committedAt)}
          loading={loading && committedAt === undefined}
        />
      </Stack>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Link
          href={repo.htmlUrl}
          target="_blank"
          rel="noreferrer noopener"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          <LaunchIcon fontSize="inherit" /> View on GitHub
        </Link>
        {repo.homepage ? (
          <Link
            href={repo.homepage}
            target="_blank"
            rel="noreferrer noopener"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            <HomeIcon fontSize="inherit" /> Homepage
          </Link>
        ) : null}
      </Stack>
    </Stack>
  );
}
