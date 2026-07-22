import { useState, useEffect, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  BackgroundThemes,
  evaluateTheme,
  isDaytime,
  type BackgroundTheme,
} from '@/utils/backgroundEngine';
import { useWeatherStatus, useCollisions } from '@/hooks/useApi';

export { BackgroundThemes };

function resolveAutoTheme(
  weatherData: ReturnType<typeof useWeatherStatus>['data'],
  collisionsData: ReturnType<typeof useCollisions>['data']
): BackgroundTheme {
  return evaluateTheme({
    weatherStatus: weatherData?.data ?? null,
    collisions: collisionsData?.data ?? null,
    isDaytime: isDaytime(),
  });
}

export function useBackgroundTheme() {
  const prefersReducedMotion = useReducedMotion();
  const weatherQuery = useWeatherStatus();
  const collisionsQuery = useCollisions({ size: 50 });

  const currentTheme = useMemo(
    () => resolveAutoTheme(weatherQuery.data, collisionsQuery.data),
    [weatherQuery.data, collisionsQuery.data]
  );

  const [isTabActive, setIsTabActive] = useState(true);
  const animating = !prefersReducedMotion && isTabActive;

  useEffect(() => {
    const handleVisibility = () => {
      setIsTabActive(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return {
    currentTheme,
    animating,
    prefersReducedMotion: !!prefersReducedMotion,
  };
}
