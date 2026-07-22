import React, { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackgroundTheme } from '@/hooks/useBackgroundTheme';
import { BackgroundThemes } from '@/utils/backgroundEngine';

const DayBackground = lazy(() =>
  import('./DayBackground').then((m) => ({ default: m.DayBackground }))
);
const NightBackground = lazy(() =>
  import('./NightBackground').then((m) => ({ default: m.NightBackground }))
);
const SolarStormBackground = lazy(() =>
  import('./SolarStormBackground').then((m) => ({
    default: m.SolarStormBackground,
  }))
);
const AuroraBackground = lazy(() =>
  import('./AuroraBackground').then((m) => ({ default: m.AuroraBackground }))
);
const MeteorBackground = lazy(() =>
  import('./MeteorBackground').then((m) => ({ default: m.MeteorBackground }))
);
const CollisionAlertBackground = lazy(() =>
  import('./CollisionAlertBackground').then((m) => ({
    default: m.CollisionAlertBackground,
  }))
);

function FallbackLoader() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, #05070A 0%, #0C1220 100%)',
      }}
    />
  );
}

const themeComponents: Record<
  string,
  React.LazyExoticComponent<React.FC<{ animating: boolean }>>
> = {
  [BackgroundThemes.DAY]: DayBackground,
  [BackgroundThemes.NIGHT]: NightBackground,
  [BackgroundThemes.SOLAR_STORM]: SolarStormBackground,
  [BackgroundThemes.AURORA]: AuroraBackground,
  [BackgroundThemes.METEOR_SHOWER]: MeteorBackground,
  [BackgroundThemes.COLLISION_ALERT]: CollisionAlertBackground,
};

export const DynamicBackground: React.FC = () => {
  const { currentTheme, animating } = useBackgroundTheme();
  const ThemeComponent = themeComponents[currentTheme];

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTheme}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          <Suspense fallback={<FallbackLoader />}>
            {ThemeComponent && <ThemeComponent animating={animating} />}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
