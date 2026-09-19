/**
 * Typed replacements for `useDispatch` / `useSelector`.
 *
 * Every component imports these instead of the react-redux originals, so `state` is
 * `RootState` everywhere and a typo in a selector is a compile error rather than
 * `undefined` at runtime.
 */
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './types.js';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
