import { NavLink, Outlet } from 'react-router-dom';
import { AppShell, Button, ThemeToggle } from '@gh/ui';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { selectThemeMode, themeModeChanged } from '../store/settings/settingsSlice.js';
import { ROUTES } from './routes.js';

/**
 * The shell every route renders inside.
 *
 * `@gh/ui` knows nothing about routing — it forbids importing a router — so the router
 * vocabulary stays here and meets the design system on `component={NavLink}`. The active
 * style keys off the `.active` class `NavLink` sets, so nothing has to mirror the current
 * route in state. The rate-limit chip joins the theme toggle in `actions` once requests
 * are being made.
 */
export function AppLayout() {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(selectThemeMode);

  return (
    <AppShell
      title="GitHub Repo Dashboard"
      navigation={
        <Button
          component={NavLink}
          to={ROUTES.search}
          end
          color="inherit"
          size="small"
          sx={{ '&.active': { bgcolor: 'action.selected', fontWeight: 600 } }}
        >
          Search
        </Button>
      }
      actions={
        <ThemeToggle mode={themeMode} onChange={(mode) => dispatch(themeModeChanged(mode))} />
      }
    >
      <Outlet />
    </AppShell>
  );
}
