import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useDebouncedValue', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('react', 400));
    expect(result.current).toBe('react');
  });

  it('holds the old value until the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 400), {
      initialProps: { value: 'r' },
    });

    rerender({ value: 're' });
    act(() => void vi.advanceTimersByTime(399));
    expect(result.current).toBe('r');

    act(() => void vi.advanceTimersByTime(1));
    expect(result.current).toBe('re');
  });

  it('emits once for a burst of keystrokes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 400), {
      initialProps: { value: '' },
    });

    for (const value of ['r', 're', 'rea', 'reac', 'react']) {
      rerender({ value });
      act(() => void vi.advanceTimersByTime(100));
    }
    // 500ms of typing, but never a 400ms pause — still the initial value.
    expect(result.current).toBe('');

    act(() => void vi.advanceTimersByTime(400));
    expect(result.current).toBe('react');
  });
});
