import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

export interface LoadingSkeletonProps {
  /** Matches the shape of what is loading, so the layout doesn't jump when data lands. */
  variant?: 'card' | 'list-row' | 'text' | undefined;
  count?: number | undefined;
}

function CardSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton width="60%" height={28} />
        <Skeleton width="90%" />
        <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
          <Skeleton width={56} height={40} />
          <Skeleton width={56} height={40} />
          <Skeleton width={56} height={40} />
        </Stack>
      </CardContent>
    </Card>
  );
}

function RowSkeleton() {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1.5 }}>
      <Skeleton variant="circular" width={32} height={32} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="40%" />
        <Skeleton width="70%" height={14} />
      </Box>
      <Skeleton variant="rounded" width={88} height={32} />
    </Stack>
  );
}

export function LoadingSkeleton({ variant = 'text', count = 1 }: LoadingSkeletonProps) {
  const items = Array.from({ length: Math.max(1, count) }, (_, i) => i);

  return (
    <Box aria-busy="true" aria-live="polite" role="status">
      <Box component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        Loading…
      </Box>
      {items.map((i) =>
        variant === 'card' ? (
          <Box key={i} sx={{ mb: 2 }}>
            <CardSkeleton />
          </Box>
        ) : variant === 'list-row' ? (
          <RowSkeleton key={i} />
        ) : (
          <Skeleton key={i} width={`${60 + ((i * 17) % 35)}%`} />
        ),
      )}
    </Box>
  );
}
