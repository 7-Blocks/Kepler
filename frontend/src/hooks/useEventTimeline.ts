import { useEffect, useMemo, useState } from 'react';
import { useEventTimelineStore } from '@/store/eventTimelineStore';

export function useEventTimeline() {
  const events = useEventTimelineStore((s) => s.events);
  const filters = useEventTimelineStore((s) => s.filters);
  const streamStatus = useEventTimelineStore((s) => s.streamStatus);
  const streamSpeed = useEventTimelineStore((s) => s.streamSpeed);
  const selectedEventId = useEventTimelineStore((s) => s.selectedEventId);

  const addEvent = useEventTimelineStore((s) => s.addEvent);
  const setFilter = useEventTimelineStore((s) => s.setFilter);
  const resetFilters = useEventTimelineStore((s) => s.resetFilters);
  const togglePauseStream = useEventTimelineStore((s) => s.togglePauseStream);
  const setStreamSpeed = useEventTimelineStore((s) => s.setStreamSpeed);
  const setSelectedEventId = useEventTimelineStore((s) => s.setSelectedEventId);
  const acknowledgeEvent = useEventTimelineStore((s) => s.acknowledgeEvent);
  const simulateIncident = useEventTimelineStore((s) => s.simulateIncident);
  const clearAllEvents = useEventTimelineStore((s) => s.clearAllEvents);
  const startLiveStreaming = useEventTimelineStore((s) => s.startLiveStreaming);

  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Automatically start real-time event generator when hook is mounted
  useEffect(() => {
    const cleanup = startLiveStreaming();
    return () => cleanup();
  }, [startLiveStreaming]);

  // Compute filtered & sorted events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Category filter
      if (filters.category !== 'ALL' && evt.category !== filters.category) {
        return false;
      }

      // Severity filter
      if (filters.severity !== 'ALL' && evt.severity !== filters.severity) {
        return false;
      }

      // High priority filter
      if (filters.highPriorityOnly && !evt.is_high_priority) {
        return false;
      }

      // NORAD ID filter
      if (filters.noradId && evt.norad_id !== filters.noradId) {
        return false;
      }

      // Time Range filter
      if (filters.timeRange !== 'ALL') {
        const evtTime = new Date(evt.timestamp).getTime();
        const diffMs = currentTime - evtTime;
        if (filters.timeRange === '1H' && diffMs > 60 * 60 * 1000) return false;
        if (filters.timeRange === '24H' && diffMs > 24 * 60 * 60 * 1000) return false;
        if (filters.timeRange === '7D' && diffMs > 7 * 24 * 60 * 60 * 1000) return false;
      }

      // Search Query filter (matches title, description, satellite name, NORAD ID, category)
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const textToSearch = [
          evt.title,
          evt.description,
          evt.satellite_name,
          evt.norad_id,
          evt.cospar_id,
          evt.category,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!textToSearch.includes(q)) return false;
      }

      return true;
    }).sort((a, b) => {
      const tA = new Date(a.timestamp).getTime();
      const tB = new Date(b.timestamp).getTime();
      return filters.sortOrder === 'NEWEST_FIRST' ? tB - tA : tA - tB;
    });
  }, [events, filters, currentTime]);

  // Compute stats
  const stats = useMemo(() => {
    const total = events.length;
    const unacknowledged = events.filter((e) => !e.acknowledged).length;
    const critical = events.filter((e) => e.severity === 'CRITICAL' && !e.acknowledged).length;
    const high = events.filter((e) => e.severity === 'HIGH' && !e.acknowledged).length;

    const byCategory: Record<string, number> = {
      LAUNCH: 0,
      CONJUNCTION: 0,
      MANEUVER: 0,
      DEBRIS: 0,
      SPACE_WEATHER: 0,
      SYSTEM: 0,
    };

    events.forEach((evt) => {
      if (byCategory[evt.category] !== undefined) {
        byCategory[evt.category] += 1;
      }
    });

    return {
      total,
      unacknowledged,
      critical,
      high,
      byCategory,
    };
  }, [events]);

  const unacknowledgedCriticalEvents = useMemo(() => {
    return events.filter((evt) => (evt.severity === 'CRITICAL' || evt.severity === 'HIGH') && !evt.acknowledged);
  }, [events]);

  return {
    events: filteredEvents,
    rawEventsCount: events.length,
    filters,
    streamStatus,
    streamSpeed,
    selectedEventId,
    stats,
    unacknowledgedCriticalEvents,

    // Actions
    addEvent,
    setFilter,
    resetFilters,
    togglePauseStream,
    setStreamSpeed,
    setSelectedEventId,
    acknowledgeEvent,
    simulateIncident,
    clearAllEvents,
  };
}
