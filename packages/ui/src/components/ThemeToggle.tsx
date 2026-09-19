import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import type { ReactNode } from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import type { ThemeMode } from '../types.js';

export interface ThemeToggleProps {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
  size?: 'small' | 'medium' | undefined;
}

const OPTIONS: Array<{ value: ThemeMode; label: string; icon: ReactNode }> = [
  { value: 'light', label: 'Light', icon: <LightModeIcon fontSize="small" /> },
  { value: 'system', label: 'Match system', icon: <BrightnessAutoIcon fontSize="small" /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeIcon fontSize="small" /> },
];

/** Three explicit choices rather than a two-state switch, so `system` stays reachable. */
export function ThemeToggle({ mode, onChange, size = 'small' }: ThemeToggleProps) {
  return (
    <ToggleButtonGroup
      value={mode}
      exclusive
      size={size}
      aria-label="Colour theme"
      onChange={(_event, next: ThemeMode | null) => {
        // `null` is MUI signalling a click on the already-selected button. Ignore it —
        // this group must never be empty.
        if (next) onChange(next);
      }}
    >
      {OPTIONS.map((option) => (
        <Tooltip key={option.value} title={option.label}>
          <ToggleButton value={option.value} aria-label={option.label}>
            {option.icon}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
}
