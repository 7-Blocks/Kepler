import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnimatedCounter } from '../useAnimatedCounter';

// Minimal requestAnimationFrame shim driven manually by advancing time,
// so tests stay deterministic instead of depending on real frame timing.
function mockRaf() {
  let now = 0;
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    return window.setTimeout(() => cb(now), 16) as unknown as number;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  return {
    advance(ms: number) {
      now += ms;
      vi.advanceTimersByTime(ms);
    },
  };
}

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
}

describe('useAnimatedCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('animates from 0 on first render', () => {
    const clock = mockRaf();
    const { result } = renderHook(() => useAnimatedCounter(1000, { duration: 1000 }));

    expect(result.current.displayValue).toBe(0);

    act(() => clock.advance(1000));
    expect(result.current.displayValue).toBeCloseTo(1000, 0);
    expect(result.current.isAnimating).toBe(false);
  });

  it('does not re-animate when the target value is unchanged', () => {
    const clock = mockRaf();
    const { result, rerender } = renderHook(({ value }) => useAnimatedCounter(value, { duration: 800 }), {
      initialProps: { value: 500 },
    });

    act(() => clock.advance(800));
    expect(result.current.displayValue).toBeCloseTo(500, 0);

    rerender({ value: 500 });
    expect(result.current.isAnimating).toBe(false);
  });

  it('animates from the previous value on updates, not from 0', () => {
    const clock = mockRaf();
    const { result, rerender } = renderHook(({ value }) => useAnimatedCounter(value, { duration: 800 }), {
      initialProps: { value: 100 },
    });
    act(() => clock.advance(800));
    expect(result.current.displayValue).toBeCloseTo(100, 0);

    rerender({ value: 300 });
    // Mid-animation the value should be between 100 and 300, never reset to 0.
    act(() => clock.advance(400));
    expect(result.current.displayValue).toBeGreaterThan(100);
    expect(result.current.displayValue).toBeLessThanOrEqual(300);
  });

  it('skips animation entirely when reduced motion is preferred', () => {
    mockMatchMedia(true);
    mockRaf();
    const { result } = renderHook(() => useAnimatedCounter(4200, { duration: 1000 }));
    expect(result.current.displayValue).toBe(4200);
    expect(result.current.isAnimating).toBe(false);
  });

  it('clamps duration into the 800-1500ms range from spec', () => {
    const clock = mockRaf();
    const { result } = renderHook(() => useAnimatedCounter(100, { duration: 100 }));
    // With a 100ms request clamped up to 800ms, value should not be settled yet at 100ms.
    act(() => clock.advance(100));
    expect(result.current.isAnimating).toBe(true);
  });

  it('continues from the current visual position when the target changes mid-animation, instead of jumping back to the old start point', () => {
    const clock = mockRaf();
    const { result, rerender } = renderHook(({ value }) => useAnimatedCounter(value, { duration: 1000 }), {
      initialProps: { value: 1000 },
    });

    // Interrupt partway through the first animation (0 -> 1000).
    act(() => clock.advance(500));
    const midFlightValue = result.current.displayValue;
    expect(midFlightValue).toBeGreaterThan(0);
    expect(midFlightValue).toBeLessThan(1000);

    rerender({ value: 2000 });
    // The very next frame should continue from where it was, not reset to 0.
    act(() => clock.advance(16));
    expect(result.current.displayValue).toBeGreaterThanOrEqual(midFlightValue);
  });

  it('does not throw when window.matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    const clock = mockRaf();
    expect(() => {
      const { result } = renderHook(() => useAnimatedCounter(500, { duration: 800 }));
      act(() => clock.advance(800));
      expect(result.current.displayValue).toBeCloseTo(500, 0);
    }).not.toThrow();
  });
});