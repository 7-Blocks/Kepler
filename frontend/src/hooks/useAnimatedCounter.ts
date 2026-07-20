import { useEffect, useRef, useState } from 'react';

/**
 * useAnimatedCounter.ts
 *
 * All animation logic lives here, isolated from rendering and formatting.
 * AnimatedCounter.tsx is a thin presentational wrapper around this hook.
 */

export interface UseAnimatedCounterOptions {
  /** Animation duration in ms. Clamped to the 800–1500ms range from spec. Default: 1200. */
  duration?: number;
  /** Skip animation entirely (used for prefers-reduced-motion or tests). */
  disableAnimation?: boolean;
}

// easeOutExpo — fast start, gentle settle. Feels natural for counters.
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);

  return reduced;
}

/**
 * Animates a numeric value from its previous value to a new target whenever
 * `target` changes. Returns the current in-progress display value plus an
 * `isAnimating` flag.
 *
 * - First render: animates from 0 (unless reduced motion / disabled).
 * - Subsequent renders: animates from whatever the previous target was.
 * - No-op if the new target equals the current target (spec: don't
 *   re-animate on an unchanged value).
 */
export function useAnimatedCounter(
  target: number,
  options: UseAnimatedCounterOptions = {}
) {
  const { duration = 1200, disableAnimation = false } = options;
  const clampedDuration = Math.min(Math.max(duration, 800), 1500);

  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldSkipAnimation = disableAnimation || prefersReducedMotion;

  const [animatedValue, setAnimatedValue] = useState(shouldSkipAnimation ? target : 0);
  const [isAnimating, setIsAnimating] = useState(false);

  // fromRef / rafRef / isFirstRun are only ever read or written inside the
  // effect below (never during render), so they stay refs — the ref rule
  // only forbids touching .current synchronously in the render body.
  const fromRef = useRef(shouldSkipAnimation ? target : 0);
  const rafRef = useRef<number | null>(null);
  const isFirstRun = useRef(true);

  // Render-time sync for the "skip animation" path (reduced motion /
  // disabled): React's documented pattern for adjusting state when a prop
  // changes — a *state* guard (not a ref) so it stays render-safe.
  const [syncedTarget, setSyncedTarget] = useState<number | null>(shouldSkipAnimation ? target : null);

  if (shouldSkipAnimation && syncedTarget !== target) {
    setSyncedTarget(target);
    setAnimatedValue(target);
    if (isAnimating) setIsAnimating(false);
  }

  useEffect(() => {
    if (shouldSkipAnimation) {
      // Keep the refs in sync so a later switch back to animated mode
      // starts from the right value instead of replaying from 0.
      fromRef.current = target;
      isFirstRun.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    // Nothing changed — spec explicitly says don't re-animate.
    if (!isFirstRun.current && fromRef.current === target) {
      return;
    }

    const from = isFirstRun.current ? 0 : fromRef.current;
    const startTime = performance.now();

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    let hasStarted = false;

    const tick = (now: number) => {
      if (!hasStarted) {
        hasStarted = true;
        setIsAnimating(true);
      }
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / clampedDuration, 1);
      const eased = easeOutExpo(progress);
      setAnimatedValue(from + (target - from) * eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setAnimatedValue(target);
        fromRef.current = target;
        isFirstRun.current = false;
        setIsAnimating(false);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, clampedDuration, shouldSkipAnimation]);

  // shouldSkipAnimation always reflects `target` immediately (no lag),
  // since the render-time sync above keeps animatedValue caught up too.
  const displayValue = shouldSkipAnimation ? target : animatedValue;

  return { displayValue, isAnimating };
}