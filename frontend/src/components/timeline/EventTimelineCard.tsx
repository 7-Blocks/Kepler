import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { TimelineEvent, EventSeverity, TimelineEventCategory } from '@/types/events';
import { logEvent } from '@/store/logbookStore';

interface EventTimelineCardProps {
  event: TimelineEvent;
  onAcknowledge: (id: string) => void;
}

const severityConfig: Record<
  EventSeverity,
  { border: string; bg: string; text: string; glow: string; icon: string }
> = {
  CRITICAL: {
    border: 'border-status-emergency/70',
    bg: 'bg-status-emergency/10',
    text: 'text-status-emergency',
    glow: 'shadow-[0_0_15px_rgba(255,59,48,0.2)]',
    icon: 'error',
  },
  HIGH: {
    border: 'border-status-warning/70',
    bg: 'bg-status-warning/10',
    text: 'text-status-warning',
    glow: 'shadow-[0_0_12px_rgba(255,149,0,0.15)]',
    icon: 'warning',
  },
  MEDIUM: {
    border: 'border-amber-400/50',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_10px_rgba(245,158,11,0.1)]',
    icon: 'info',
  },
  LOW: {
    border: 'border-primary-container/40',
    bg: 'bg-primary-container/10',
    text: 'text-primary-container',
    glow: '',
    icon: 'check_circle',
  },
};

const categoryConfig: Record<
  TimelineEventCategory,
  { label: string; icon: string; color: string }
> = {
  LAUNCH: { label: 'LAUNCH', icon: 'rocket_launch', color: 'text-cyan-400' },
  CONJUNCTION: { label: 'CONJUNCTION', icon: 'warning', color: 'text-status-emergency' },
  MANEUVER: { label: 'MANEUVER', icon: 'orbit', color: 'text-emerald-400' },
  DEBRIS: { label: 'DEBRIS', icon: 'delete_sweep', color: 'text-purple-400' },
  SPACE_WEATHER: { label: 'SPACE WEATHER', icon: 'wb_sunny', color: 'text-amber-400' },
  SYSTEM: { label: 'SYSTEM', icon: 'settings', color: 'text-blue-400' },
};

function formatUtc(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

function formatRelativeTime(timestamp: string): string {
  const diffSec = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s AGO`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m AGO`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h AGO`;
  const days = Math.floor(hr / 24);
  return `${days}d AGO`;
}

export const EventTimelineCard: React.FC<EventTimelineCardProps> = ({ event, onAcknowledge }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const sev = severityConfig[event.severity];
  const cat = categoryConfig[event.category];

  const handleManualLog = (e: React.MouseEvent) => {
    e.stopPropagation();
    logEvent('MISSION', event.severity, event.title, event.description, {
      NORAD_ID: event.norad_id || 'N/A',
      CATEGORY: event.category,
      SOURCE: 'User Timeline Card',
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`glass-panel rounded-xl border ${sev.border} ${sev.glow} transition-all duration-300 overflow-hidden relative group hover:border-primary-container/80`}
    >
      {/* Left severity color bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          event.severity === 'CRITICAL'
            ? 'bg-status-emergency animate-pulse'
            : event.severity === 'HIGH'
            ? 'bg-status-warning'
            : event.severity === 'MEDIUM'
            ? 'bg-amber-400'
            : 'bg-primary-container'
        }`}
      />

      {/* Main Collapsed Header Content */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 md:p-5 pl-5 md:pl-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
      >
        <div className="flex items-start gap-3.5 min-w-0">
          {/* Category Icon */}
          <div
            className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center border border-border-panel/80 bg-surface-container/60 ${cat.color}`}
          >
            <MaterialIcon name={cat.icon} className="text-xl" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {/* Category Badge */}
              <span className="text-[10px] font-technical-data font-bold px-2 py-0.5 rounded bg-surface-container-high text-primary-container border border-primary-container/30 uppercase">
                {cat.label}
              </span>

              {/* Severity Badge */}
              <span
                className={`text-[10px] font-technical-data font-bold px-2 py-0.5 rounded uppercase ${sev.bg} ${sev.text} border ${sev.border}`}
              >
                {event.severity}
              </span>

              {/* Satellite / NORAD Badge */}
              {event.satellite_name && (
                <span className="text-[10px] font-technical-data text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded border border-border-panel">
                  {event.satellite_name}{' '}
                  {event.norad_id ? `(#${event.norad_id})` : ''}
                </span>
              )}

              {/* Timestamp */}
              <span className="text-[11px] font-technical-data text-primary/50 ml-auto md:ml-0">
                {formatUtc(event.timestamp)}
              </span>

              <span className="text-[10px] font-technical-data text-primary-container/80 bg-primary-container/10 px-1.5 py-0.5 rounded">
                {formatRelativeTime(event.timestamp)}
              </span>
            </div>

            <h3 className="font-technical-data font-bold text-sm md:text-base text-white tracking-wide group-hover:text-primary-container transition-ui">
              {event.title}
            </h3>
            <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5 font-body-ui">
              {event.description}
            </p>
          </div>
        </div>

        {/* Right Status Badges & Chevron toggle */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          {event.acknowledged ? (
            <span className="text-[10px] font-technical-data text-status-success bg-status-success/15 px-2.5 py-1 rounded border border-status-success/30 flex items-center gap-1">
              <MaterialIcon name="check_circle" className="text-xs" />
              ACKNOWLEDGED
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAcknowledge(event.id);
              }}
              className="text-[10px] font-technical-data font-bold text-status-warning hover:bg-status-warning/20 bg-status-warning/10 px-2.5 py-1 rounded border border-status-warning/40 transition-ui cursor-pointer"
            >
              ACKNOWLEDGE
            </button>
          )}

          <div className="p-1 rounded text-primary-container group-hover:bg-surface-container-high transition-ui">
            <MaterialIcon
              name={expanded ? 'expand_less' : 'expand_more'}
              className="text-xl"
            />
          </div>
        </div>
      </div>

      {/* Expanded Details Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border-panel/60 bg-surface-container-lowest/40 p-4 md:p-5 pl-5 md:pl-6 space-y-4"
          >
            {/* Full description */}
            <div>
              <h4 className="text-[10px] font-label-caps text-primary/60 font-bold uppercase tracking-wider mb-1">
                EVENT SUMMARY & ANALYTICS
              </h4>
              <p className="text-xs text-on-surface leading-relaxed font-technical-data">
                {event.description}
              </p>
            </div>

            {/* Telemetry Metrics Grid */}
            {event.telemetry && Object.keys(event.telemetry).length > 0 && (
              <div>
                <h4 className="text-[10px] font-label-caps text-primary/60 font-bold uppercase tracking-wider mb-2">
                  TELEMETRY PARAMETERS
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {event.telemetry.miss_distance_m !== undefined && (
                    <div className="bg-surface-container/80 p-2.5 rounded border border-border-panel">
                      <p className="text-[9px] font-label-caps text-on-surface-variant">MISS DISTANCE</p>
                      <p className="text-xs font-bold text-primary-container font-technical-data mt-0.5">
                        {event.telemetry.miss_distance_m < 1000
                          ? `${event.telemetry.miss_distance_m} m`
                          : `${(event.telemetry.miss_distance_m / 1000).toFixed(2)} km`}
                      </p>
                    </div>
                  )}

                  {event.telemetry.collision_probability !== undefined && (
                    <div className="bg-surface-container/80 p-2.5 rounded border border-border-panel">
                      <p className="text-[9px] font-label-caps text-on-surface-variant">PROBABILITY</p>
                      <p className="text-xs font-bold text-status-emergency font-technical-data mt-0.5">
                        {(event.telemetry.collision_probability * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}

                  {event.telemetry.orbit_altitude_km !== undefined && (
                    <div className="bg-surface-container/80 p-2.5 rounded border border-border-panel">
                      <p className="text-[9px] font-label-caps text-on-surface-variant font-technical-data">ALTITUDE</p>
                      <p className="text-xs font-bold text-white font-technical-data mt-0.5">
                        {event.telemetry.orbit_altitude_km} km
                      </p>
                    </div>
                  )}

                  {event.telemetry.velocity_kms !== undefined && (
                    <div className="bg-surface-container/80 p-2.5 rounded border border-border-panel">
                      <p className="text-[9px] font-label-caps text-on-surface-variant">VELOCITY</p>
                      <p className="text-xs font-bold text-status-success font-technical-data mt-0.5">
                        {event.telemetry.velocity_kms} km/s
                      </p>
                    </div>
                  )}

                  {event.telemetry.delta_v_ms !== undefined && (
                    <div className="bg-surface-container/80 p-2.5 rounded border border-border-panel">
                      <p className="text-[9px] font-label-caps text-on-surface-variant">DELTA-V BURNT</p>
                      <p className="text-xs font-bold text-emerald-400 font-technical-data mt-0.5">
                        {event.telemetry.delta_v_ms} m/s
                      </p>
                    </div>
                  )}

                  {event.telemetry.kp_index !== undefined && (
                    <div className="bg-surface-container/80 p-2.5 rounded border border-border-panel">
                      <p className="text-[9px] font-label-caps text-on-surface-variant">KP INDEX</p>
                      <p className="text-xs font-bold text-amber-400 font-technical-data mt-0.5">
                        {event.telemetry.kp_index}
                      </p>
                    </div>
                  )}

                  {event.telemetry.fragment_count !== undefined && (
                    <div className="bg-surface-container/80 p-2.5 rounded border border-border-panel">
                      <p className="text-[9px] font-label-caps text-on-surface-variant">TRACKED FRAGMENTS</p>
                      <p className="text-xs font-bold text-purple-400 font-technical-data mt-0.5">
                        {event.telemetry.fragment_count}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* External References links */}
            {event.external_references && event.external_references.length > 0 && (
              <div>
                <h4 className="text-[10px] font-label-caps text-primary/60 font-bold uppercase tracking-wider mb-2">
                  EXTERNAL TELEMETRY SOURCES
                </h4>
                <div className="flex flex-wrap gap-2">
                  {event.external_references.map((ref, i) => (
                    <a
                      key={i}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-technical-data text-primary-container bg-primary-container/10 border border-primary-container/30 px-2.5 py-1 rounded hover:bg-primary-container hover:text-bg-deep-space transition-ui flex items-center gap-1"
                    >
                      <MaterialIcon name="open_in_new" className="text-xs" />
                      {ref.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border-panel/40">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-primary-container/20 border border-primary-container text-primary-container hover:bg-primary-container hover:text-bg-deep-space px-3 py-1.5 rounded text-xs font-technical-data font-bold transition-ui cursor-pointer flex items-center gap-1.5"
              >
                <MaterialIcon name="public" className="text-sm" />
                TRACK ON 3D GLOBE
              </button>

              {event.category === 'CONJUNCTION' && (
                <button
                  onClick={() => navigate('/dashboard/mission-planner')}
                  className="bg-surface-container-high border border-border-panel text-on-surface hover:border-primary px-3 py-1.5 rounded text-xs font-technical-data transition-ui cursor-pointer flex items-center gap-1"
                >
                  <MaterialIcon name="event_note" className="text-sm" />
                  PLAN MANEUVER
                </button>
              )}

              {event.category === 'SPACE_WEATHER' && (
                <button
                  onClick={() => navigate('/dashboard/space-weather')}
                  className="bg-surface-container-high border border-border-panel text-on-surface hover:border-primary px-3 py-1.5 rounded text-xs font-technical-data transition-ui cursor-pointer flex items-center gap-1"
                >
                  <MaterialIcon name="wb_sunny" className="text-sm" />
                  WEATHER MONITOR
                </button>
              )}

              <button
                onClick={handleManualLog}
                className="bg-surface-container-high border border-border-panel text-on-surface-variant hover:text-primary px-3 py-1.5 rounded text-xs font-technical-data transition-ui cursor-pointer flex items-center gap-1"
              >
                <MaterialIcon name="bookmark_add" className="text-sm" />
                LOG TO LOGBOOK
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
