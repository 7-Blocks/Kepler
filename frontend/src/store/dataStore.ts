import { create } from 'zustand';

export type RiskLevel = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TimeRangeOption = '24H' | '7D' | '30D' | 'CUSTOM';

export interface DataFilters {
  riskLevel: RiskLevel;
  timeRange: TimeRangeOption;
  searchKeyword: string;
  minAltitudeKm?: number;
  maxAltitudeKm?: number;
}

interface DataState {
  filters: DataFilters;
  activeCollisionFilter: string | null;
  autoRefreshIntervalMs: number;
  setSearchQuery: (query: string) => void;
  setRiskFilter: (level: RiskLevel) => void;
  setTimeRange: (range: TimeRangeOption) => void;
  setAltitudeRange: (min?: number, max?: number) => void;
  setActiveCollisionFilter: (collisionId: string | null) => void;
  setAutoRefreshIntervalMs: (intervalMs: number) => void;
  resetDataFilters: () => void;
}

const initialFilters: DataFilters = {
  riskLevel: 'ALL',
  timeRange: '24H',
  searchKeyword: '',
};

export const useDataStore = create<DataState>((set) => ({
  filters: initialFilters,
  activeCollisionFilter: null,
  autoRefreshIntervalMs: 30000,
  setSearchQuery: (searchKeyword) =>
    set((state) => ({
      filters: { ...state.filters, searchKeyword },
    })),
  setRiskFilter: (riskLevel) =>
    set((state) => ({
      filters: { ...state.filters, riskLevel },
    })),
  setTimeRange: (timeRange) =>
    set((state) => ({
      filters: { ...state.filters, timeRange },
    })),
  setAltitudeRange: (minAltitudeKm, maxAltitudeKm) =>
    set((state) => ({
      filters: { ...state.filters, minAltitudeKm, maxAltitudeKm },
    })),
  setActiveCollisionFilter: (activeCollisionFilter) =>
    set({ activeCollisionFilter }),
  setAutoRefreshIntervalMs: (autoRefreshIntervalMs) =>
    set({ autoRefreshIntervalMs }),
  resetDataFilters: () =>
    set({
      filters: initialFilters,
      activeCollisionFilter: null,
    }),
}));
