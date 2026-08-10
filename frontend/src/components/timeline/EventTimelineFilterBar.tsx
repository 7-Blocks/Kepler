import React from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';
import type {
  EventFilterParams,
  TimelineEventCategory,
  EventSeverity,
  TimeRangeFilter,
} from '@/types/events';

interface EventTimelineFilterBarProps {
  filters: EventFilterParams;
  streamStatus: 'LIVE' | 'PAUSED' | 'DISCONNECTED';
  onFilterChange: <K extends keyof EventFilterParams>(key: K, value: EventFilterParams[K]) => void;
  onResetFilters: () => void;
  onTogglePauseStream: () => void;
  onSimulateIncident: () => void;
  filteredCount: number;
  totalCount: number;
}

const CATEGORIES: Array<{ label: string; value: TimelineEventCategory | 'ALL'; icon: string }> = [
  { label: 'ALL EVENTS', value: 'ALL', icon: 'apps' },
  { label: 'LAUNCHES', value: 'LAUNCH', icon: 'rocket_launch' },
  { label: 'CONJUNCTIONS', value: 'CONJUNCTION', icon: 'warning' },
  { label: 'MANEUVERS', value: 'MANEUVER', icon: 'orbit' },
  { label: 'DEBRIS', value: 'DEBRIS', icon: 'delete_sweep' },
  { label: 'SPACE WEATHER', value: 'SPACE_WEATHER', icon: 'wb_sunny' },
  { label: 'SYSTEM', value: 'SYSTEM', icon: 'settings' },
];

const SEVERITIES: Array<{ label: string; value: EventSeverity | 'ALL'; color: string }> = [
  { label: 'ALL SEVERITIES', value: 'ALL', color: 'text-on-surface-variant' },
  { label: 'CRITICAL', value: 'CRITICAL', color: 'text-status-emergency' },
  { label: 'HIGH', value: 'HIGH', color: 'text-status-warning' },
  { label: 'MEDIUM', value: 'MEDIUM', color: 'text-amber-400' },
  { label: 'LOW', value: 'LOW', color: 'text-primary-container' },
];

const TIME_RANGES: Array<{ label: string; value: TimeRangeFilter }> = [
  { label: 'ALL TIME', value: 'ALL' },
  { label: 'LAST 1 HOUR', value: '1H' },
  { label: 'LAST 24 HOURS', value: '24H' },
  { label: 'LAST 7 DAYS', value: '7D' },
];

export const EventTimelineFilterBar: React.FC<EventTimelineFilterBarProps> = ({
  filters,
  streamStatus,
  onFilterChange,
  onResetFilters,
  onTogglePauseStream,
  onSimulateIncident,
  filteredCount,
  totalCount,
}) => {
  const isLive = streamStatus === 'LIVE';

  return (
    <div className="glass-panel p-4 md:p-5 rounded-xl border border-border-panel/80 mb-6 space-y-4 shadow-lg backdrop-blur-xl">
      {/* Top Controller Row: Stream Status & Global Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-panel/50 pb-4">
        {/* Stream Status indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePauseStream}
            className={`px-3 py-1.5 rounded flex items-center gap-2 text-xs font-technical-data font-bold transition-ui cursor-pointer border ${
              isLive
                ? 'bg-status-success/20 border-status-success/60 text-status-success hover:bg-status-success/30'
                : 'bg-amber-500/20 border-amber-500/60 text-amber-400 hover:bg-amber-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLive ? 'bg-status-success animate-pulse glow-green' : 'bg-amber-400'
              }`}
            />
            {isLive ? 'LIVE STREAMING' : 'STREAM PAUSED'}
            <MaterialIcon name={isLive ? 'pause' : 'play_arrow'} className="text-sm ml-1" />
          </button>

          <span className="text-xs font-technical-data text-primary/60 hidden sm:inline">
            SHOWING <strong className="text-primary-container">{filteredCount}</strong> OF{' '}
            <strong className="text-on-surface">{totalCount}</strong> EVENTS
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onSimulateIncident}
            className="bg-status-emergency/20 border border-status-emergency/50 text-status-emergency hover:bg-status-emergency hover:text-white px-3 py-1.5 rounded text-xs font-technical-data font-bold transition-ui cursor-pointer flex items-center gap-1.5"
          >
            <MaterialIcon name="bolt" className="text-sm" />
            SIMULATE INCIDENT
          </button>

          <button
            onClick={onResetFilters}
            className="bg-surface-container-high border border-border-panel text-on-surface-variant hover:text-primary hover:border-primary px-3 py-1.5 rounded text-xs font-technical-data transition-ui cursor-pointer flex items-center gap-1"
          >
            <MaterialIcon name="restart_alt" className="text-sm" />
            RESET FILTERS
          </button>

          {/* Sort order toggle */}
          <button
            onClick={() =>
              onFilterChange(
                'sortOrder',
                filters.sortOrder === 'NEWEST_FIRST' ? 'OLDEST_FIRST' : 'NEWEST_FIRST'
              )
            }
            className="bg-surface-container-high border border-border-panel text-primary-container hover:bg-primary-container/20 px-3 py-1.5 rounded text-xs font-technical-data font-bold transition-ui cursor-pointer flex items-center gap-1.5"
          >
            <MaterialIcon
              name={filters.sortOrder === 'NEWEST_FIRST' ? 'south' : 'north'}
              className="text-sm"
            />
            {filters.sortOrder === 'NEWEST_FIRST' ? 'NEWEST FIRST' : 'OLDEST FIRST'}
          </button>
        </div>
      </div>

      {/* Category Pills Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = filters.category === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => onFilterChange('category', cat.value)}
              className={`shrink-0 px-3 py-1.5 rounded text-xs font-technical-data font-medium transition-ui flex items-center gap-1.5 border cursor-pointer ${
                isActive
                  ? 'bg-primary-container text-bg-deep-space border-primary-container font-bold shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                  : 'bg-surface-container-low text-on-surface-variant border-border-panel/60 hover:text-primary hover:border-primary-container/40'
              }`}
            >
              <MaterialIcon name={cat.icon} className="text-sm" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input & Secondary Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        {/* Real-time Search Input */}
        <div className="relative sm:col-span-2">
          <MaterialIcon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50 text-base"
          />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            placeholder="SEARCH TITLE, NORAD ID, SATELLITE..."
            className="w-full bg-surface-container-low border border-border-panel/80 rounded px-3 py-2 pl-9 text-xs font-technical-data text-on-surface placeholder:text-primary/30 focus:outline-none focus:border-primary-container transition-ui"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange('searchQuery', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary/50 hover:text-primary transition-ui"
            >
              <MaterialIcon name="cancel" className="text-sm" />
            </button>
          )}
        </div>

        {/* Severity Selector Dropdown */}
        <div className="relative">
          <select
            value={filters.severity}
            onChange={(e) => onFilterChange('severity', e.target.value as EventSeverity | 'ALL')}
            className="w-full bg-surface-container-low border border-border-panel/80 rounded px-3 py-2 text-xs font-technical-data text-on-surface focus:outline-none focus:border-primary-container transition-ui cursor-pointer"
          >
            {SEVERITIES.map((sev) => (
              <option key={sev.value} value={sev.value} className="bg-bg-deep-space text-white">
                {sev.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time Range Selector Dropdown */}
        <div className="relative">
          <select
            value={filters.timeRange}
            onChange={(e) => onFilterChange('timeRange', e.target.value as TimeRangeFilter)}
            className="w-full bg-surface-container-low border border-border-panel/80 rounded px-3 py-2 text-xs font-technical-data text-on-surface focus:outline-none focus:border-primary-container transition-ui cursor-pointer"
          >
            {TIME_RANGES.map((tr) => (
              <option key={tr.value} value={tr.value} className="bg-bg-deep-space text-white">
                {tr.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
