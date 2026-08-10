import { useCallback, useMemo, useState } from 'react';
import { SPOTLIGHT_SATELLITES, type SpotlightSatellite } from '@/constants/spotlightSatellites';

/**
 * Simple deterministic string hash (djb2). Used instead of Math.random()
 * so the "satellite of the day" pick is the same for every visitor and
 * only changes when the date string changes — no server state needed.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

function todayKey(): string {
  // Local calendar date, e.g. "2026-07-26" — rotates at local midnight.
  return new Date().toLocaleDateString('en-CA');
}

interface UseSatelliteOfTheDayResult {
  satellite: SpotlightSatellite;
  /** True if the current pick came from "Show Another" rather than today's rotation. */
  isManualPick: boolean;
  showAnother: () => void;
  resetToToday: () => void;
}

export function useSatelliteOfTheDay(): UseSatelliteOfTheDayResult {
  const dailyIndex = useMemo(() => {
    if (SPOTLIGHT_SATELLITES.length === 0) return 0;
    return hashString(todayKey()) % SPOTLIGHT_SATELLITES.length;
  }, []);

  const [manualIndex, setManualIndex] = useState<number | null>(null);

  const showAnother = useCallback(() => {
    setManualIndex(prev => {
      if (SPOTLIGHT_SATELLITES.length <= 1) return prev;
      let next = Math.floor(Math.random() * SPOTLIGHT_SATELLITES.length);
      // Avoid landing back on whatever's currently shown.
      const current = prev ?? dailyIndex;
      while (next === current) {
        next = Math.floor(Math.random() * SPOTLIGHT_SATELLITES.length);
      }
      return next;
    });
  }, [dailyIndex]);

  const resetToToday = useCallback(() => setManualIndex(null), []);

  const activeIndex = manualIndex ?? dailyIndex;

  return {
    satellite: SPOTLIGHT_SATELLITES[activeIndex],
    isManualPick: manualIndex !== null,
    showAnother,
    resetToToday,
  };
}