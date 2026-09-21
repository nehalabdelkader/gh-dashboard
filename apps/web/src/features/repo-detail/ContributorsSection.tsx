import { Avatar, Box, LinearProgress, Link, Stack, Typography, formatCompactNumber } from '@gh/ui';
import { useGetContributorsQuery } from '@/store/api/githubApi.js';
import { toErrorDisplay } from '@/store/api/errorCopy.js';
import { DetailSection } from './DetailSection.js';

export interface ContributorsSectionProps {
  owner: string;
  name: string;
}

/** GitHub's own detail page shows a handful; more than this is a different feature. */
const LIMIT = 5;

export function ContributorsSection({ owner, name }: ContributorsSectionProps) {
  const { data, isLoading, error, refetch } = useGetContributorsQuery({
    owner,
    name,
    limit: LIMIT,
  });
  const display = toErrorDisplay(error);

  const contributors = data ?? [];
  // Bars are relative to the top contributor, not to the project total: the top five are
  // rarely the whole project, so a share of the visible five is the only honest scale.
  const top = contributors[0]?.contributions ?? 0;

  return (
    <DetailSection
      title="Top contributors"
      loading={isLoading}
      error={display}
      onRetry={() => void refetch()}
      empty={!isLoading && contributors.length === 0}
      emptyMessage="No contributor data for this repository."
      skeleton="list-row"
      skeletonCount={3}
    >
      <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {contributors.map((contributor) => (
          <Stack
            key={contributor.login}
            component="li"
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <Avatar src={contributor.avatarUrl} alt="" sx={{ width: 32, height: 32 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Link
                href={contributor.htmlUrl}
                target="_blank"
                rel="noreferrer noopener"
                variant="body2"
                noWrap
              >
                {contributor.login}
              </Link>
              <LinearProgress
                variant="determinate"
                value={top === 0 ? 0 : (contributor.contributions / top) * 100}
                aria-hidden
                sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatCompactNumber(contributor.contributions)} commits
            </Typography>
          </Stack>
        ))}
      </Stack>
    </DetailSection>
  );
}
