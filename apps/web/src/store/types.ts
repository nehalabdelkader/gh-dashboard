/**
 * Store types, in their own module.
 *
 * Derived from the reducer map rather than from the configured store, because selectors
 * and the persistence middleware both need `RootState` and both are imported *by*
 * `store/index.ts` — inferring from the store would make that a cycle.
 */
import type { Action, ThunkAction, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import type { rootReducer } from './rootReducer.js';

export type RootState = ReturnType<typeof rootReducer>;

export type AppDispatch = ThunkDispatch<RootState, undefined, UnknownAction>;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  undefined,
  Action<string>
>;
