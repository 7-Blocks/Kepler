import type { WeatherStatus, Collision } from '@/services/api';

export const BackgroundThemes = {
  DAY: 'day',
  NIGHT: 'night',
  SOLAR_STORM: 'solar-storm',
  AURORA: 'aurora',
  METEOR_SHOWER: 'meteor-shower',
  COLLISION_ALERT: 'collision-alert',
} as const;

export type BackgroundTheme =
  (typeof BackgroundThemes)[keyof typeof BackgroundThemes];

interface ConditionInput {
  weatherStatus: WeatherStatus | null | undefined;
  collisions: Collision[] | null | undefined;
  isDaytime: boolean;
}

// Priority: higher number = more critical, overrides lower
const THEME_PRIORITY: Record<BackgroundTheme, number> = {
  [BackgroundThemes.COLLISION_ALERT]: 100,
  [BackgroundThemes.SOLAR_STORM]: 80,
  [BackgroundThemes.AURORA]: 60,
  [BackgroundThemes.METEOR_SHOWER]: 40,
  [BackgroundThemes.NIGHT]: 20,
  [BackgroundThemes.DAY]: 10,
};

export function evaluateTheme(conditions: ConditionInput): BackgroundTheme {
  const candidates: { theme: BackgroundTheme; priority: number }[] = [];

  // Day/Night is always a candidate
  candidates.push({
    theme: conditions.isDaytime
      ? BackgroundThemes.DAY
      : BackgroundThemes.NIGHT,
    priority: conditions.isDaytime
      ? THEME_PRIORITY[BackgroundThemes.DAY]
      : THEME_PRIORITY[BackgroundThemes.NIGHT],
  });

  // Check weather status for solar storm / aurora / meteor
  if (conditions.weatherStatus) {
    const ws = conditions.weatherStatus;

    // Solar storm: elevated active storm or flare count
    if (ws.active_storm_count > 0 || ws.active_flare_count >= 2) {
      candidates.push({
        theme: BackgroundThemes.SOLAR_STORM,
        priority: THEME_PRIORITY[BackgroundThemes.SOLAR_STORM],
      });
    }

    // Aurora: high Kp index (>= 5 is geomagnetic storm territory)
    if (ws.kp_index >= 5) {
      candidates.push({
        theme: BackgroundThemes.AURORA,
        priority: THEME_PRIORITY[BackgroundThemes.AURORA],
      });
    }
  }

  // Check collisions for high-risk conjunctions
  if (conditions.collisions && conditions.collisions.length > 0) {
    const highRisk = conditions.collisions.some(
      (c) =>
        c.risk_level === 'CRITICAL' ||
        (c.risk_level === 'HIGH' && c.status === 'PENDING')
    );
    if (highRisk) {
      candidates.push({
        theme: BackgroundThemes.COLLISION_ALERT,
        priority: THEME_PRIORITY[BackgroundThemes.COLLISION_ALERT],
      });
    }
  }

  // Pick the highest priority candidate
  candidates.sort((a, b) => b.priority - a.priority);
  return candidates[0]?.theme ?? BackgroundThemes.DAY;
}

export function isDaytime(): boolean {
  const hour = new Date().getUTCHours();
  return hour >= 6 && hour < 18;
}
