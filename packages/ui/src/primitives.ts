/**
 * MUI primitives, re-exported.
 *
 * The app depends on `@gh/ui` alone and never on `@mui/material` directly (its lint config
 * blocks it), so the design system stays the single place MUI is versioned, themed and —
 * if it ever comes to that — swapped. These are re-exports rather than wrappers on
 * purpose: wrapping `Button` to rename `variant` buys nothing but a second API to learn
 * and a prop list that is permanently one release behind MUI's.
 *
 * Anything with opinions in it — a card, a list row, an error state — is a real component
 * in `./components`, not a primitive.
 */
export { default as Box } from '@mui/material/Box';
export { default as Button } from '@mui/material/Button';
export { default as Chip } from '@mui/material/Chip';
export { default as CircularProgress } from '@mui/material/CircularProgress';
export { default as Divider } from '@mui/material/Divider';
export { default as IconButton } from '@mui/material/IconButton';
export { default as Link } from '@mui/material/Link';
export { default as Pagination } from '@mui/material/Pagination';
export { default as Snackbar } from '@mui/material/Snackbar';
export { default as Stack } from '@mui/material/Stack';
export { default as Tooltip } from '@mui/material/Tooltip';
export { default as Typography } from '@mui/material/Typography';

export type { BoxProps } from '@mui/material/Box';
export type { ButtonProps } from '@mui/material/Button';
export type { ChipProps } from '@mui/material/Chip';
export type { StackProps } from '@mui/material/Stack';
export type { TypographyProps } from '@mui/material/Typography';
