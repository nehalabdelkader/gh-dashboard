import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

export interface StatTileProps {
  label: string;
  /** Pre-formatted. The component never decides how a number reads — the caller does. */
  value: ReactNode;
  icon?: ReactNode | undefined;
  /** Hover copy, e.g. the absolute date behind a relative one. */
  tooltip?: string | undefined;
  loading?: boolean | undefined;
  /** Dims the value while a refresh is in flight, so stale numbers read as stale. */
  stale?: boolean | undefined;
}

/** One labelled number. The atom every card's stats row is built from. */
export function StatTile({ label, value, icon, tooltip, loading, stale }: StatTileProps) {
  const body = (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        component="div"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        {icon}
        {label}
      </Typography>
      {loading ? (
        <Skeleton width={48} height={24} />
      ) : (
        <Typography
          variant="subtitle1"
          component="div"
          sx={{ fontWeight: 600, opacity: stale ? 0.55 : 1, transition: 'opacity 150ms' }}
          noWrap
        >
          {value}
        </Typography>
      )}
    </Box>
  );

  return tooltip ? <Tooltip title={tooltip}>{body}</Tooltip> : body;
}
