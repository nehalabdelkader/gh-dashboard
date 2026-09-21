/**
 * User preferences. Small, persisted, and entirely client-side.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface SettingsState {
  themeMode: ThemeMode;
}

export const initialSettingsState: SettingsState = {
  themeMode: 'system',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: initialSettingsState,
  reducers: {
    themeModeChanged(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
    settingsReplaced(_state, action: PayloadAction<SettingsState>) {
      return action.payload;
    },
  },
  selectors: {
    selectThemeMode: (state) => state.themeMode,
  },
});

export const { themeModeChanged, settingsReplaced } = settingsSlice.actions;
export const { selectThemeMode } = settingsSlice.selectors;
export const settingsReducer = settingsSlice.reducer;
export const SETTINGS_SLICE_NAME = settingsSlice.name;
