import type { ReactNode } from 'react';
import { Box, Card, CardContent, ErrorState, LoadingSkeleton, Stack, Typography } from '@gh/ui';
import { toErrorStateProps, type ErrorDisplay } from '@/store/api/errorCopy.js';

export interface DetailSectionProps {
  title: string;
  /** Rendered beside the title — a count, a link, a retry. */
  action?: ReactNode | undefined;
  loading?: boolean | undefined;
  error?: ErrorDisplay | undefined;
  onRetry?: (() => void) | undefined;
  empty?: boolean | undefined;
  emptyMessage?: string | undefined;
  skeleton?: 'text' | 'card' | 'list-row' | undefined;
  skeletonCount?: number | undefined;
  children: ReactNode;
}

/**
 * One panel of the detail page, with its own loading and error state.
 *
 * The page fires four independent queries and each section renders exactly one of them,
 * so a failed contributors call costs the contributors panel and nothing else — the
 * stats, the languages and the commit history stay on screen. That is the same per-entity
 * independence the tracked grid has, applied to sections of one page instead of cards in
 * a list.
 *
 * The error strip is `inline`: the panel keeps its heading, so the page's shape does not
 * change when one section fails.
 */
export function DetailSection({
  title,
  action,
  loading,
  error,
  onRetry,
  empty,
  emptyMessage = 'Nothing to show.',
  skeleton = 'text',
  skeletonCount = 3,
  children,
}: DetailSectionProps) {
  return (
    <Card component="section" aria-busy={loading ?? false}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="h3" component="h2">
            {title}
          </Typography>
          {action}
        </Stack>

        {error ? (
          <ErrorState {...toErrorStateProps(error, onRetry)} variant="inline" />
        ) : loading ? (
          <LoadingSkeleton variant={skeleton} count={skeletonCount} />
        ) : empty ? (
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        ) : (
          <Box sx={{ flex: 1 }}>{children}</Box>
        )}
      </CardContent>
    </Card>
  );
}
