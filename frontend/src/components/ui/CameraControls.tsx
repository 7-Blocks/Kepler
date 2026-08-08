import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import type { CameraMode } from '@/store/uiStore';
import { MaterialIcon } from '../MaterialIcon';

export const CameraControls: React.FC = () => {
  const { selectedSatelliteId, cameraMode, setCameraMode } = useUIStore();

  const modes: { id: CameraMode; icon: string; label: string }[] = [
    { id: 'FREE', icon: 'pan_tool', label: 'FREE' },
    { id: 'CHASE', icon: 'flight_takeoff', label: 'CHASE' },
    { id: 'COCKPIT', icon: 'visibility', label: 'COCKPIT' },
    { id: 'EARTH_OBSERVER', icon: 'public', label: 'EARTH' },
    { id: 'ORBITAL', icon: 'satellite_alt', label: 'ORBITAL' },
  ];

  return (
    <AnimatePresence>
      {selectedSatelliteId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 bg-bg-deep-space/90 backdrop-blur-md border border-primary-container/30 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.8)] pointer-events-auto"
        >
          {modes.map((mode) => {
            const isActive = cameraMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setCameraMode(mode.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-ui font-label-caps text-[9px] sm:text-[10px] tracking-widest ${
                  isActive
                    ? 'bg-primary-container text-bg-deep-space font-bold'
                    : 'text-on-surface-variant hover:text-primary-container hover:bg-surface-container-high'
                }`}
                title={mode.label}
              >
                <MaterialIcon name={mode.icon} className="text-sm" />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
