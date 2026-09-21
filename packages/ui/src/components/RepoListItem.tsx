import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { RepoCardRepo } from '../types.js';
import { formatCompactNumber } from '../utils/format.js';

export interface RepoListItemProps {
  repo: RepoCardRepo;
  tracked: boolean;
  onToggleTrack: (repo: RepoCardRepo) => void;
  onOpen?: ((repo: RepoCardRepo) => void) | undefined;
  /** Disables the toggle while an optimistic update settles. */
  busy?: boolean | undefined;
}

/**
 * A search result row.
 *
 * Search payloads carry stars and open issues inline but no commit date, so the row
 * deliberately shows neither a last-commit column nor a refresh button — that data costs
 * a request per repo and belongs on the tracked and detail pages.
 */
export function RepoListItem({ repo, tracked, onToggleTrack, onOpen, busy }: RepoListItemProps) {
  return (
    <ListItem
      divider
      alignItems="flex-start"
      secondaryAction={
        // Same button as the detail page's, down to the colour pair: tracking a repo
        // should look and read identically wherever it is offered. The label names the
        // action rather than the state ("Untrack", not "Tracked"), so there is no
        // `aria-pressed` — a toggle announces its state through one or the other, and
        // both at once contradict each other.
        <Button
          variant={tracked ? 'outlined' : 'contained'}
          color={tracked ? 'error' : 'primary'}
          startIcon={<StarBorderIcon />}
          disabled={busy ?? false}
          onClick={() => onToggleTrack(repo)}
        >
          {tracked ? 'Untrack' : 'Track'}
        </Button>
      }
      // Room for the widest label the button can hold, so a long repo name never runs
      // under it.
      sx={{ pr: 17 }}
    >
      <ListItemAvatar>
        <Avatar src={repo.ownerAvatarUrl} alt="" variant="rounded" />
      </ListItemAvatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {onOpen ? (
            <Link component="button" type="button" onClick={() => onOpen(repo)} color="inherit">
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
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ mt: 0.5 }}
          flexWrap="wrap"
          useFlexGap
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <StarBorderIcon fontSize="inherit" />
            {formatCompactNumber(repo.stats.stars)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <ErrorOutlineIcon fontSize="inherit" />
            {formatCompactNumber(repo.stats.openIssues)}
          </Typography>
          {repo.language ? <Chip label={repo.language} variant="outlined" /> : null}
          {repo.archived ? <Chip label="Archived" color="warning" variant="outlined" /> : null}
        </Stack>
      </Box>
    </ListItem>
  );
}
