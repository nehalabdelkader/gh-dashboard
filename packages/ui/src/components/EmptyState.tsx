import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export interface EmptyStateProps {
  title: string;
  description?: ReactNode | undefined;
  icon?: ReactNode | undefined;
  /** A button, usually. Rendered under the copy. */
  action?: ReactNode | undefined;
}

/** "Nothing here yet" — a legitimate outcome, not a failure. Distinct from `ErrorState`. */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1.5,
        py: 6,
        px: 3,
        color: 'text.secondary',
      }}
    >
      {icon ? <Box sx={{ fontSize: 48, lineHeight: 1, opacity: 0.6 }}>{icon}</Box> : null}
      <Typography variant="h3" color="text.primary">
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ mt: 1 }}>{action}</Box> : null}
    </Box>
  );
}
