import type { ReactNode } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

export interface AppShellProps {
  title?: string | undefined;
  /** Nav links. Routing lives in the app — this slot only places them. */
  navigation?: ReactNode | undefined;
  /** Right-hand toolbar slot: the rate-limit chip and the theme toggle. */
  actions?: ReactNode | undefined;
  children: ReactNode;
  footer?: ReactNode | undefined;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false | undefined;
}

/** Page frame: header, main landmark, optional footer. Slots only, no routing knowledge. */
export function AppShell({
  title = 'GitHub Dashboard',
  navigation,
  actions,
  children,
  footer,
  maxWidth = 'lg',
}: AppShellProps) {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h3" component="span" sx={{ flexShrink: 0 }}>
            {title}
          </Typography>
          {navigation ? (
            <Stack component="nav" direction="row" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
              {navigation}
            </Stack>
          ) : (
            <Box sx={{ flex: 1 }} />
          )}
          {actions ? (
            <Stack direction="row" spacing={1} alignItems="center">
              {actions}
            </Stack>
          ) : null}
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth={maxWidth} sx={{ flex: 1, py: 3 }}>
        {children}
      </Container>

      {footer ? (
        <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', py: 2 }}>
          <Container maxWidth={maxWidth}>{footer}</Container>
        </Box>
      ) : null}
    </Box>
  );
}
