import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { TimelineEvent } from '@/types/events';

interface HighPriorityIncidentBannerProps {
  incidents: TimelineEvent[];
  onAcknowledge: (id: string) => void;
}

export const HighPriorityIncidentBanner: React.FC<HighPriorityIncidentBannerProps> = ({
  incidents,
  onAcknowledge,
}) => {
  const navigate = useNavigate();

  if (incidents.length === 0) return null;

  const currentIncident = incidents[0]; // Show top urgent incident
  const isCritical = currentIncident.severity === 'CRITICAL';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIncident.id}
        initial={{ opacity: 0, y: -15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -15, scale: 0.98 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`relative w-full rounded-xl p-4 md:p-5 mb-6 overflow-hidden border backdrop-blur-xl transition-all shadow-xl ${
          isCritical
            ? 'bg-status-emergency/15 border-status-emergency/60 shadow-[0_0_30px_rgba(255,59,48,0.25)]'
            : 'bg-status-warning/15 border-status-warning/60 shadow-[0_0_25px_rgba(255,149,0,0.2)]'
        }`}
      >
        {/* Background CRT pulse scan line effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            {/* Pulsing hazard icon badge */}
            <div
              className={`p-3 rounded-lg shrink-0 flex items-center justify-center ${
                isCritical
                  ? 'bg-status-emergency/30 text-status-emergency border border-status-emergency/50 animate-pulse'
                  : 'bg-status-warning/30 text-status-warning border border-status-warning/50'
              }`}
            >
              <MaterialIcon
                name={isCritical ? 'error' : 'warning'}
                className="text-2xl"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`text-[10px] font-technical-data font-bold px-2 py-0.5 rounded tracking-wider uppercase ${
                    isCritical
                      ? 'bg-status-emergency text-white glow-red'
                      : 'bg-status-warning text-black font-bold'
                  }`}
                >
                  HIGH PRIORITY {currentIncident.severity} INCIDENT
                </span>

                {incidents.length > 1 && (
                  <span className="text-[10px] font-technical-data text-primary-container bg-primary-container/20 px-2 py-0.5 rounded border border-primary-container/40">
                    +{incidents.length - 1} MORE ACTIVE ALERTS
                  </span>
                )}

                <span className="text-[11px] font-technical-data text-on-surface-variant/80">
                  {new Date(currentIncident.timestamp).toUTCString().replace('GMT', 'UTC')}
                </span>
              </div>

              <h4 className="font-technical-data font-bold text-sm md:text-base text-white tracking-wide truncate">
                {currentIncident.title}
              </h4>
              <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 font-body-ui">
                {currentIncident.description}
              </p>

              {/* Telemetry highlights */}
              {currentIncident.telemetry && (
                <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] font-technical-data">
                  {currentIncident.telemetry.miss_distance_m !== undefined && (
                    <span className="text-primary-container bg-surface-container/60 px-2 py-0.5 rounded border border-border-panel">
                      MISS DISTANCE:{' '}
                      <strong className="text-white">
                        {currentIncident.telemetry.miss_distance_m < 1000
                          ? `${currentIncident.telemetry.miss_distance_m}m`
                          : `${(currentIncident.telemetry.miss_distance_m / 1000).toFixed(2)}km`}
                      </strong>
                    </span>
                  )}
                  {currentIncident.telemetry.collision_probability !== undefined && (
                    <span className="text-status-emergency bg-surface-container/60 px-2 py-0.5 rounded border border-border-panel">
                      PROBABILITY:{' '}
                      <strong className="text-status-emergency">
                        {(currentIncident.telemetry.collision_probability * 100).toFixed(2)}%
                      </strong>
                    </span>
                  )}
                  {currentIncident.telemetry.kp_index !== undefined && (
                    <span className="text-status-warning bg-surface-container/60 px-2 py-0.5 rounded border border-border-panel">
                      KP INDEX: <strong className="text-white">{currentIncident.telemetry.kp_index}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Direct Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap md:flex-nowrap">
            {currentIncident.category === 'CONJUNCTION' && (
              <button
                onClick={() => navigate('/dashboard/mission-planner')}
                className="bg-primary-container/20 border border-primary-container text-primary-container text-xs px-3.5 py-2 font-technical-data font-bold hover:bg-primary-container hover:text-bg-deep-space transition-ui rounded cursor-pointer flex items-center gap-1.5"
              >
                <MaterialIcon name="event_note" className="text-sm" />
                PLAN MANEUVER
              </button>
            )}

            {currentIncident.category === 'CONJUNCTION' && (
              <button
                onClick={() => navigate('/dashboard/collision-center')}
                className="bg-surface-container-high border border-border-panel text-on-surface text-xs px-3 py-2 font-technical-data hover:border-primary transition-ui rounded cursor-pointer"
              >
                RISK CENTER
              </button>
            )}

            <button
              onClick={() => onAcknowledge(currentIncident.id)}
              className={`text-xs px-4 py-2 font-technical-data font-bold rounded cursor-pointer transition-ui flex items-center gap-1.5 shadow-md ${
                isCritical
                  ? 'bg-status-emergency text-white hover:bg-red-600'
                  : 'bg-status-warning text-black hover:bg-amber-500'
              }`}
            >
              <MaterialIcon name="check_circle" className="text-sm" />
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
