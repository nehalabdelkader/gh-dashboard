/**
 * The store: server state and client state, kept apart on purpose.
 *
 *  - `githubApi` (RTK Query) owns everything that came from GitHub. Its cache is keyed per
 *    argument, which is what gives every repo its own loading and error state.
 *  - `tracked` / `settings` are client state — the user's list and preferences, persisted
 *    to localStorage and owned by nobody else.
 *  - `rateLimit` is observed state: written by the baseQuery from response headers.
 *
 * Persistence is not optional: the store always reads `localStorage` at boot and writes
 * back on every tracked/settings change. A store that silently forgets would be a
 * different app from the one that ships.
 */
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { githubApi } from './api/githubApi.js';
import { createPersistenceMiddleware } from './persistence/listener.js';
import { loadPersisted } from './persistence/loadPersisted.js';
import { rootReducer } from './rootReducer.js';

export const store = configureStore({
  reducer: rootReducer,
  // Whatever survived validation at boot. Slices absent here fall back to their own
  // `initialState`, so a first-time user and a corrupt blob take the same path.
  preloadedState: loadPersisted(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      // Prepended so the write sees state *after* the reducer ran, and so a persistence
      // failure can never stop an action reaching the API middleware.
      .prepend(createPersistenceMiddleware().middleware)
      .concat(githubApi.middleware),
});

export type AppStore = typeof store;

// Powers RTK Query's `refetchOnFocus` / `refetchOnReconnect`. Both are off by default
// (see `githubApi`) — quota is too tight to refetch on every tab focus — but the wiring
// is here so a single endpoint can opt in.
setupListeners(store.dispatch);

export { githubApi } from './api/githubApi.js';
export * from './api/errors.js';
export * from './meta/rateLimitSlice.js';
export * from './settings/settingsSlice.js';
export * from './tracked/trackedSlice.js';
export * from './tracked/selectors.js';
export { loadPersisted } from './persistence/loadPersisted.js';
export { useAppDispatch, useAppSelector } from './hooks.js';
export type { AppDispatch, AppThunk, RootState } from './types.js';
