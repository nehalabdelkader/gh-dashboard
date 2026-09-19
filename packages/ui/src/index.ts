/**
 * `@gh/ui` — the design system.
 *
 * Presentational only: zero Redux, zero data fetching, zero sibling-package imports
 * (enforced by the lint config). Every component takes props and emits callbacks, which is
 * what lets fifteen `RepoCard`s render fifteen independent loading and error states.
 */
export { AppThemeProvider } from './theme/AppThemeProvider.js';
export type { AppThemeProviderProps } from './theme/AppThemeProvider.js';
export { useResolvedPaletteMode } from './theme/useResolvedPaletteMode.js';
export { createAppTheme } from './theme/createAppTheme.js';
export type { PaletteMode } from './theme/createAppTheme.js';

export { AppShell } from './components/AppShell.js';
export type { AppShellProps } from './components/AppShell.js';
export { ConfirmDialog } from './components/ConfirmDialog.js';
export type { ConfirmDialogProps } from './components/ConfirmDialog.js';
export { EmptyState } from './components/EmptyState.js';
export type { EmptyStateProps } from './components/EmptyState.js';
export { ErrorState } from './components/ErrorState.js';
export type { ErrorSeverity, ErrorStateProps } from './components/ErrorState.js';
export { LoadingSkeleton } from './components/LoadingSkeleton.js';
export type { LoadingSkeletonProps } from './components/LoadingSkeleton.js';
export { RepoCard } from './components/RepoCard.js';
export type { RepoCardProps } from './components/RepoCard.js';
export { RepoList } from './components/RepoList.js';
export type { RepoListProps } from './components/RepoList.js';
export { RepoListItem } from './components/RepoListItem.js';
export type { RepoListItemProps } from './components/RepoListItem.js';
export { SearchField } from './components/SearchField.js';
export type { SearchFieldProps } from './components/SearchField.js';
export { StatTile } from './components/StatTile.js';
export type { StatTileProps } from './components/StatTile.js';
export { ThemeToggle } from './components/ThemeToggle.js';
export type { ThemeToggleProps } from './components/ThemeToggle.js';

export {
  formatAbsoluteDate,
  formatCompactNumber,
  formatDuration,
  formatRelativeTime,
} from './utils/format.js';

export type { RepoCardRepo, RepoCardStats, RepoStatus, ThemeMode } from './types.js';

export * from './primitives.js';
export * from './icons.js';
