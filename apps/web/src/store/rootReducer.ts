/**
 * The reducer map, separate from `configureStore`.
 *
 * `combineReducers` first, store second: that is what lets `preloadedState` be a
 * `Partial<RootState>` (rehydration may produce one slice, both, or neither) without the
 * type of every individual reducer having to admit an `undefined` preloaded state.
 */
import { combineReducers } from '@reduxjs/toolkit';
import { githubApi } from './api/githubApi.js';
import { rateLimitReducer } from './meta/rateLimitSlice.js';
import { settingsReducer } from './settings/settingsSlice.js';
import { trackedReducer } from './tracked/trackedSlice.js';

export const rootReducer = combineReducers({
  tracked: trackedReducer,
  settings: settingsReducer,
  rateLimit: rateLimitReducer,
  [githubApi.reducerPath]: githubApi.reducer,
});
