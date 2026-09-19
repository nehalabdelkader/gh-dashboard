/**
 * User preferences. Small, persisted, and entirely client-side.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface SettingsState {
  themeMode: ThemeMode;
  /**
   * How many refreshes run at once during "Refresh all".
   *
   * Four is a deliberate ceiling, not a tuning knob left at a default: browsers cap
   * concurrent connections per host at around six, so a wider burst only queues, and a
   * narrower one makes fifteen repos feel slow.
   */
  refreshConcurrency: number;
}

export const MIN_CONCURRENCY = 1;
export const MAX_CONCURRENCY = 6;

export const initialSettingsState: SettingsState = {
  themeMode: 'system',
  refreshConcurrency: 4,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: initialSettingsState,
  reducers: {
    themeModeChanged(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
    refreshConcurrencyChanged(state, action: PayloadAction<number>) {
      const value = Math.round(action.payload);
      if (!Number.isFinite(value)) return;
      state.refreshConcurrency = Math.min(MAX_CONCURRENCY, Math.max(MIN_CONCURRENCY, value));
    },
    settingsReplaced(_state, action: PayloadAction<SettingsState>) {
      return action.payload;
    },
  },
  selectors: {
    selectThemeMode: (state) => state.themeMode,
    selectRefreshConcurrency: (state) => state.refreshConcurrency,
  },
});

export const { themeModeChanged, refreshConcurrencyChanged, settingsReplaced } =
  settingsSlice.actions;
export const { selectThemeMode, selectRefreshConcurrency } = settingsSlice.selectors;
export const settingsReducer = settingsSlice.reducer;
export const SETTINGS_SLICE_NAME = settingsSlice.name;
