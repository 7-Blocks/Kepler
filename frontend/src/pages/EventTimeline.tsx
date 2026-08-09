import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useEventTimeline } from '@/hooks/useEventTimeline';
import { EventTimelineCard } from '@/components/timeline/EventTimelineCard';
import { EventTimelineFilterBar } from '@/components/timeline/EventTimelineFilterBar';
import { HighPriorityIncidentBanner } from '@/components/timeline/HighPriorityIncidentBanner';

export const EventTimelinePage: React.FC = () => {
  const {
    events,
    rawEventsCount,
    filters,
    streamStatus,
    stats,
    unacknowledgedCriticalEvents,
    setFilter,
    resetFilters,
    togglePauseStream,
    acknowledgeEvent,
    simulateIncident,
  } = useEventTimeline();

  const [utcClock, setUtcClock] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      setUtcClock(new Date().toUTCString().replace('GMT', 'UTC'));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-border-panel/80 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-status-success shadow-[0_0_10px_#34C759] animate-pulse" />
            <span className="font-technical-data text-xs text-primary-container uppercase font-bold tracking-wider">
              REAL-TIME MISSION STREAM
            </span>
          </div>

          <h1 className="font-display-lg text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <MaterialIcon name="timeline" className="text-primary-container text-3xl" />
            LIVE EVENT TIMELINE
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant font-technical-data mt-1">
            Continuous orbital activity stream, conjunction alerts, maneuver tracking & space weather monitoring.
          </p>
        </div>

        {/* Live Metrics Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          <div className="bg-surface-container/60 p-3 rounded-xl border border-border-panel text-center">
            <p className="text-[9px] font-label-caps text-on-surface-variant">TOTAL EVENTS</p>
            <p className="text-lg font-bold text-primary-container font-technical-data mt-0.5">
              {stats.total}
            </p>
          </div>

          <div className="bg-surface-container/60 p-3 rounded-xl border border-border-panel text-center">
            <p className="text-[9px] font-label-caps text-on-surface-variant">HIGH PRIORITY</p>
            <p
              className={`text-lg font-bold font-technical-data mt-0.5 ${
                stats.critical > 0 ? 'text-status-emergency animate-pulse' : 'text-status-warning'
              }`}
            >
              {stats.critical + stats.high}
            </p>
          </div>

          <div className="bg-surface-container/60 p-3 rounded-xl border border-border-panel text-center">
            <p className="text-[9px] font-label-caps text-on-surface-variant">STREAM STATUS</p>
            <p className="text-xs font-bold text-status-success font-technical-data mt-1 uppercase">
              {streamStatus}
            </p>
          </div>

          <div className="bg-surface-container/60 p-3 rounded-xl border border-border-panel text-center">
            <p className="text-[9px] font-label-caps text-on-surface-variant">UTC TIME</p>
            <p className="text-[10px] font-bold text-primary-container/80 font-technical-data mt-1 truncate">
              {utcClock.substring(17, 25) || '18:20:00 UTC'}
            </p>
          </div>
        </div>
      </div>

      {/* High-Priority Critical Alert Banner */}
      <HighPriorityIncidentBanner
        incidents={unacknowledgedCriticalEvents}
        onAcknowledge={acknowledgeEvent}
      />

      {/* Toolbar Filter Controls */}
      <EventTimelineFilterBar
        filters={filters}
        streamStatus={streamStatus}
        onFilterChange={setFilter}
        onResetFilters={resetFilters}
        onTogglePauseStream={togglePauseStream}
        onSimulateIncident={simulateIncident}
        filteredCount={events.length}
        totalCount={rawEventsCount}
      />

      {/* Main Timeline Events Stream List */}
      <div className="relative space-y-4 min-h-[300px]">
        {events.length === 0 ? (
          <div className="glass-panel p-12 rounded-xl border border-dashed border-border-panel text-center space-y-3">
            <MaterialIcon name="event_busy" className="text-4xl text-primary/40" />
            <h3 className="font-technical-data text-base font-bold text-white">
              NO EVENTS MATCH CURRENT FILTERS
            </h3>
            <p className="text-xs text-on-surface-variant font-technical-data max-w-md mx-auto">
              Try adjusting your category, severity, time range, or search query to display incoming orbital events.
            </p>
            <button
              onClick={resetFilters}
              className="mt-2 bg-primary-container text-bg-deep-space px-4 py-2 rounded text-xs font-technical-data font-bold hover:bg-primary-fixed-dim transition-ui cursor-pointer"
            >
              RESET ALL FILTERS
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {events.map((evt) => (
              <EventTimelineCard key={evt.id} event={evt} onAcknowledge={acknowledgeEvent} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default EventTimelinePage;
