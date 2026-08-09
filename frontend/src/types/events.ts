/**
 * Types for the Live Mission Control Event Timeline.
 * 
 * Tracks real-time mission & orbital activities including launches,
 * conjunction predictions, maneuver executions, debris tracking,
 * and space weather alerts.
 */

export type TimelineEventCategory =
  | 'LAUNCH'
  | 'CONJUNCTION'
  | 'MANEUVER'
  | 'DEBRIS'
  | 'SPACE_WEATHER'
  | 'SYSTEM';

export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ExternalReference {
  label: string;
  url: string;
}

export interface EventTelemetry {
  miss_distance_m?: number;
  collision_probability?: number;
  relative_velocity_kms?: number;
  orbit_altitude_km?: number;
  velocity_kms?: number;
  delta_v_ms?: number;
  fuel_cost_kg?: number;
  kp_index?: number;
  solar_flux_sfu?: number;
  fragment_count?: number;
  inclination_deg?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO UTC string
  category: TimelineEventCategory;
  severity: EventSeverity;
  title: string;
  description: string;
  satellite_name?: string;
  norad_id?: string;
  cospar_id?: string;
  telemetry?: EventTelemetry;
  external_references?: ExternalReference[];
  is_high_priority?: boolean;
  acknowledged?: boolean;
}

export type TimeRangeFilter = '1H' | '24H' | '7D' | 'ALL';

export interface EventFilterParams {
  category: TimelineEventCategory | 'ALL';
  severity: EventSeverity | 'ALL';
  timeRange: TimeRangeFilter;
  searchQuery: string;
  noradId?: string;
  sortOrder: 'NEWEST_FIRST' | 'OLDEST_FIRST';
  highPriorityOnly?: boolean;
}
