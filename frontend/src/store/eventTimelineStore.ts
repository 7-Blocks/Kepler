import { create } from 'zustand';
import type {
  TimelineEvent,
  EventFilterParams,
  TimelineEventCategory,
  EventSeverity,
} from '@/types/events';
import { logEvent } from './logbookStore';

const INITIAL_EVENTS: TimelineEvent[] = [
  {
    id: 'evt_init_101',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    category: 'CONJUNCTION',
    severity: 'CRITICAL',
    title: 'CRITICAL CONJUNCTION RISK: ISS (ZARYA) vs DEBRIS 2021-055A',
    description: 'Close-approach predicted within key warning sphere. Collision probability exceeds emergency response threshold.',
    satellite_name: 'ISS (ZARYA)',
    norad_id: '25544',
    cospar_id: '1998-067A',
    is_high_priority: true,
    acknowledged: false,
    telemetry: {
      miss_distance_m: 142.5,
      collision_probability: 0.0342,
      relative_velocity_kms: 14.2,
      orbit_altitude_km: 418.6,
    },
    external_references: [
      { label: 'Space-Track Conjunction Data', url: 'https://www.space-track.org' },
      { label: 'CelesTrak CDM', url: 'https://celestrak.org' },
    ],
  },
  {
    id: 'evt_init_102',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    category: 'SPACE_WEATHER',
    severity: 'HIGH',
    title: 'X1.2-CLASS SOLAR FLARE & GEOMAGNETIC STORM WARNING',
    description: 'Active region AR3664 produced an X1.2 solar flare with an associated Earth-directed Coronal Mass Ejection (CME).',
    satellite_name: 'GLOBAL WEATHER MONITOR',
    norad_id: '43012',
    is_high_priority: true,
    acknowledged: false,
    telemetry: {
      kp_index: 7.3,
      solar_flux_sfu: 245.8,
    },
    external_references: [
      { label: 'NOAA Space Weather Prediction Center', url: 'https://www.swpc.noaa.gov' },
    ],
  },
  {
    id: 'evt_init_103',
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    category: 'MANEUVER',
    severity: 'MEDIUM',
    title: 'COLLISION AVOIDANCE MANEUVER EXECUTED — SENTINEL-6A',
    description: 'Thrust duration 14.2s completed successfully. Perigee raised by +420m to clear debris field path.',
    satellite_name: 'SENTINEL-6A',
    norad_id: '46984',
    cospar_id: '2020-086A',
    is_high_priority: false,
    acknowledged: true,
    telemetry: {
      delta_v_ms: 0.42,
      fuel_cost_kg: 1.84,
      orbit_altitude_km: 1336.2,
      velocity_kms: 7.21,
    },
    external_references: [
      { label: 'ESA Copernicus Operations', url: 'https://www.esa.int' },
    ],
  },
  {
    id: 'evt_init_104',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    category: 'LAUNCH',
    severity: 'LOW',
    title: 'ORBITAL INSERTION CONFIRMED — STARLINK-G8-12 BATCH',
    description: 'Falcon 9 second stage deployment nominal. 23 spacecraft inserted into 290 km initial checkout orbit.',
    satellite_name: 'STARLINK-G8-12',
    norad_id: '59102',
    cospar_id: '2026-014A',
    is_high_priority: false,
    acknowledged: true,
    telemetry: {
      orbit_altitude_km: 290.4,
      inclination_deg: 53.2,
      velocity_kms: 7.73,
    },
  },
  {
    id: 'evt_init_105',
    timestamp: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    category: 'DEBRIS',
    severity: 'HIGH',
    title: 'NEW DEBRIS FRAGMENTATION EVENT DETECTED',
    description: 'Breakup alert in LEO orbit (720 km). 48 new trackable object vectors registered by Ground Radar Network.',
    satellite_name: 'COSMOS-1408 FRAGMENT CLUSTER',
    norad_id: '49812',
    is_high_priority: true,
    acknowledged: false,
    telemetry: {
      fragment_count: 48,
      orbit_altitude_km: 720.5,
    },
    external_references: [
      { label: 'EU SST Tracking Alert', url: 'https://www.eusst.eu' },
    ],
  },
  {
    id: 'evt_init_106',
    timestamp: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    category: 'SYSTEM',
    severity: 'LOW',
    title: 'GROUND RADAR ALPHA TELEMETRY SYNCHRONIZATION',
    description: 'Radar calibration completed. Orbital element propagation accuracy increased by 14.8%.',
    is_high_priority: false,
    acknowledged: true,
  },
];

const GENERATOR_TEMPLATES = [
  {
    category: 'CONJUNCTION' as TimelineEventCategory,
    severity: 'HIGH' as EventSeverity,
    title: (sat: string, deb: string) => `CONJUNCTION ALERT: ${sat} vs ${deb}`,
    description: 'Automated screening identified close approach within critical clearance distance.',
    getTelemetry: () => ({
      miss_distance_m: Math.floor(Math.random() * 800 + 100),
      collision_probability: Number((Math.random() * 0.02 + 0.001).toFixed(4)),
      relative_velocity_kms: Number((Math.random() * 5 + 10).toFixed(1)),
      orbit_altitude_km: Math.floor(Math.random() * 600 + 400),
    }),
  },
  {
    category: 'MANEUVER' as TimelineEventCategory,
    severity: 'MEDIUM' as EventSeverity,
    title: (sat: string) => `STATION-KEEPING BURN COMPLETED — ${sat}`,
    description: 'Electric propulsion thrusters fired for 180s to counteract atmospheric drag decay.',
    getTelemetry: () => ({
      delta_v_ms: Number((Math.random() * 0.2 + 0.05).toFixed(2)),
      fuel_cost_kg: Number((Math.random() * 0.5 + 0.1).toFixed(2)),
      orbit_altitude_km: Math.floor(Math.random() * 300 + 500),
    }),
  },
  {
    category: 'SPACE_WEATHER' as TimelineEventCategory,
    severity: 'MEDIUM' as EventSeverity,
    title: () => 'GEOMAGNETIC FLUCTUATION DETECTED (Kp 5.8)',
    description: 'Increased ionospheric drag anticipated for satellites operating below 500km altitude.',
    getTelemetry: () => ({
      kp_index: Number((Math.random() * 2 + 5).toFixed(1)),
      solar_flux_sfu: Math.floor(Math.random() * 50 + 180),
    }),
  },
  {
    category: 'DEBRIS' as TimelineEventCategory,
    severity: 'LOW' as EventSeverity,
    title: (sat: string) => `DEBRIS CATALOG RE-ENTRY UPDATED — ${sat}`,
    description: 'Radar tracking confirmed atmospheric decay trajectory within nominal re-entry corridor.',
    getTelemetry: () => ({
      orbit_altitude_km: Math.floor(Math.random() * 80 + 120),
    }),
  },
  {
    category: 'LAUNCH' as TimelineEventCategory,
    severity: 'LOW' as EventSeverity,
    title: (sat: string) => `PAYLOAD SEPARATION CONFIRMED — ${sat}`,
    description: 'Telemetry indicates solar array deployment sequence initiated successfully.',
    getTelemetry: () => ({
      orbit_altitude_km: Math.floor(Math.random() * 200 + 500),
      inclination_deg: Number((Math.random() * 40 + 45).toFixed(1)),
    }),
  },
];

const SATELLITE_POOL = [
  'HST (HUBBLE)',
  'NOAA-19',
  'TERRA (EOS AM-1)',
  'AQUA (EOS PM-1)',
  'LANDSAT-9',
  'ENVISAT',
  'CRYOSAT-2',
  'TIANGONG STATION',
];

const DEBRIS_POOL = [
  'FENGYUN 1C DEBRIS',
  'COSMOS 2251 DEBRIS',
  'IRIDIUM 33 DEBRIS',
  'SL-16 R/B DEBRIS',
  'TITAN 3C DEBRIS',
];

export interface EventTimelineState {
  events: TimelineEvent[];
  filters: EventFilterParams;
  streamStatus: 'LIVE' | 'PAUSED' | 'DISCONNECTED';
  streamSpeed: number; // 1x, 2x, 5x
  selectedEventId: string | null;
  
  // Actions
  addEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  setFilter: <K extends keyof EventFilterParams>(key: K, value: EventFilterParams[K]) => void;
  resetFilters: () => void;
  togglePauseStream: () => void;
  setStreamSpeed: (speed: number) => void;
  setSelectedEventId: (id: string | null) => void;
  acknowledgeEvent: (id: string) => void;
  simulateIncident: () => void;
  clearAllEvents: () => void;
  startLiveStreaming: () => () => void;
}

export const DEFAULT_FILTERS: EventFilterParams = {
  category: 'ALL',
  severity: 'ALL',
  timeRange: 'ALL',
  searchQuery: '',
  sortOrder: 'NEWEST_FIRST',
};

let eventCounter = 1000;

export const useEventTimelineStore = create<EventTimelineState>((set, get) => ({
  events: INITIAL_EVENTS,
  filters: DEFAULT_FILTERS,
  streamStatus: 'LIVE',
  streamSpeed: 1,
  selectedEventId: null,

  addEvent: (eventInput) => {
    eventCounter += 1;
    const newEvent: TimelineEvent = {
      ...eventInput,
      id: `evt_live_${Date.now()}_${eventCounter}`,
      timestamp: eventInput.timestamp || new Date().toISOString(),
      acknowledged: eventInput.acknowledged ?? false,
    };

    set((state) => {
      const updated = [newEvent, ...state.events];
      // Keep up to 200 events in memory
      return { events: updated.slice(0, 200) };
    });

    // Record in central operational logbook if HIGH or CRITICAL
    if (newEvent.severity === 'HIGH' || newEvent.severity === 'CRITICAL') {
      logEvent(
        'ALERTS',
        newEvent.severity,
        newEvent.title,
        newEvent.description,
        {
          CATEGORY: newEvent.category,
          NORAD_ID: newEvent.norad_id || 'N/A',
          SATELLITE: newEvent.satellite_name || 'N/A',
        }
      );
    }
  },

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  togglePauseStream: () =>
    set((state) => ({
      streamStatus: state.streamStatus === 'LIVE' ? 'PAUSED' : 'LIVE',
    })),

  setStreamSpeed: (speed) => set({ streamSpeed: speed }),

  setSelectedEventId: (id) => set({ selectedEventId: id }),

  acknowledgeEvent: (id) =>
    set((state) => ({
      events: state.events.map((evt) =>
        evt.id === id ? { ...evt, acknowledged: true } : evt
      ),
    })),

  simulateIncident: () => {
    const sat = SATELLITE_POOL[Math.floor(Math.random() * SATELLITE_POOL.length)];
    const deb = DEBRIS_POOL[Math.floor(Math.random() * DEBRIS_POOL.length)];
    get().addEvent({
      category: 'CONJUNCTION',
      severity: 'CRITICAL',
      title: `EMERGENCY CONJUNCTION WARNING: ${sat} vs ${deb}`,
      description: 'HIGH COLLISION PROBABILITY DETECTED! TCA estimated in less than 90 minutes. Immediate evasion calculation required.',
      satellite_name: sat,
      norad_id: String(Math.floor(Math.random() * 30000 + 20000)),
      is_high_priority: true,
      acknowledged: false,
      telemetry: {
        miss_distance_m: Math.floor(Math.random() * 80 + 20),
        collision_probability: Number((Math.random() * 0.08 + 0.02).toFixed(4)),
        relative_velocity_kms: 14.8,
        orbit_altitude_km: 512,
      },
      external_references: [
        { label: 'Space-Track Urgent CDM', url: 'https://www.space-track.org' },
      ],
    });
  },

  clearAllEvents: () => set({ events: [] }),

  startLiveStreaming: () => {
    const intervalTime = 12000; // Generate event every 12 seconds when streaming
    const timer = setInterval(() => {
      const { streamStatus, addEvent } = get();
      if (streamStatus !== 'LIVE') return;

      const template = GENERATOR_TEMPLATES[Math.floor(Math.random() * GENERATOR_TEMPLATES.length)];
      const sat = SATELLITE_POOL[Math.floor(Math.random() * SATELLITE_POOL.length)];
      const deb = DEBRIS_POOL[Math.floor(Math.random() * DEBRIS_POOL.length)];

      addEvent({
        category: template.category,
        severity: template.severity,
        title: template.title(sat, deb),
        description: template.description,
        satellite_name: sat,
        norad_id: String(Math.floor(Math.random() * 40000 + 10000)),
        is_high_priority: template.severity === 'HIGH' || template.severity === 'CRITICAL',
        acknowledged: false,
        telemetry: template.getTelemetry(),
      });
    }, intervalTime);

    return () => clearInterval(timer);
  },
}));
