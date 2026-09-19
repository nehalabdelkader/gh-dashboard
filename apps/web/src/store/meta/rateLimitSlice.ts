/**
 * What is left of the GitHub quota.
 *
 * Unauthenticated the ceiling is 60 core requests an hour, which is the binding constraint
 * on the whole app (plan §1). Keeping it in the store — fed by the headers on every
 * response, not by a dedicated poll — is what lets the header chip, the "Refresh all"
 * gate and the rate-limit error copy all read the same number.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RateLimitInfo, RateLimitSnapshot } from '@gh/github-api';

export interface RateLimitState {
  core: RateLimitInfo | undefined;
  search: RateLimitInfo | undefined;
  /** ISO-8601 of the last observation, so the UI can mark a stale reading. */
  observedAt: string | undefined;
}

const initialState: RateLimitState = {
  core: undefined,
  search: undefined,
  observedAt: undefined,
};

export interface RateLimitObservation {
  /** GitHub's `x-ratelimit-resource`: `core`, `search`, … Unknown values are ignored. */
  resource: string | undefined;
  info?: RateLimitInfo | undefined;
  /** Set when a 403/429 proved the bucket is spent but sent no usable headers. */
  exhaustedUntil?: string | undefined;
}

const rateLimitSlice = createSlice({
  name: 'rateLimit',
  initialState,
  reducers: {
    /** One response's headers. Fired by the baseQuery on every single request. */
    rateLimitObserved(state, action: PayloadAction<RateLimitObservation>) {
      const { resource, info, exhaustedUntil } = action.payload;
      const bucket = resource === 'search' ? 'search' : 'core';

      if (info) {
        state[bucket] = info;
      } else if (exhaustedUntil) {
        // A 403 with no headers still tells us the bucket is empty until the reset.
        const previous = state[bucket];
        state[bucket] = {
          limit: previous?.limit ?? 0,
          remaining: 0,
          used: previous?.limit ?? previous?.used ?? 0,
          resetAt: exhaustedUntil,
        };
      }
      state.observedAt = new Date().toISOString();
    },

    /** The full `GET /rate_limit` payload, which covers buckets no response has touched. */
    rateLimitSnapshotReceived(state, action: PayloadAction<RateLimitSnapshot>) {
      state.core = action.payload.core;
      state.search = action.payload.search;
      state.observedAt = new Date().toISOString();
    },
  },
  selectors: {
    selectCoreRateLimit: (state) => state.core,
    selectSearchRateLimit: (state) => state.search,
    selectRateLimitObservedAt: (state) => state.observedAt,
  },
});

export const { rateLimitObserved, rateLimitSnapshotReceived } = rateLimitSlice.actions;
export const { selectCoreRateLimit, selectSearchRateLimit, selectRateLimitObservedAt } =
  rateLimitSlice.selectors;
export const rateLimitReducer = rateLimitSlice.reducer;
export const RATE_LIMIT_SLICE_NAME = rateLimitSlice.name;

/**
 * Whether a burst of `cost` requests fits in what is left, keeping a small reserve so a
 * "Refresh all" can never spend the very last request the UI needs for a retry.
 */
export function hasQuotaFor(
  state: RateLimitState,
  cost: number,
  options: { reserve?: number } = {},
): boolean {
  const reserve = options.reserve ?? 2;
  // No reading yet means no evidence of exhaustion — let the first request find out.
  if (!state.core) return true;
  return state.core.remaining >= cost + reserve;
}
