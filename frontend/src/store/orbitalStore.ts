/**
 * Global Orbital State Management — Zustand
 */

import { create } from 'zustand';
import type { OrbitalObject, OrbitalStatistics, OrbitalFilters } from '@/types/orbital';
import { orbitalDataService } from '@/services/orbitalDataService';
import { logEvent } from './logbookStore';

interface OrbitalState {
  objects: OrbitalObject[];
  totalCount: number;
  selectedObject: OrbitalObject | null;
  selectedNoradId: string | null;
  hoveredObject: OrbitalObject | null;
  hoveredNoradId: string | null;
  loading: boolean;
  loadingProgress: number; // 0 to 100
  error: string | null;
  statistics: OrbitalStatistics | null;
  filters: OrbitalFilters;
  searchQuery: string;

  // Actions
  loadCatalog: () => Promise<void>;
  setSelectedObject: (objectOrNorad: OrbitalObject | string | null) => void;
  setHoveredObject: (objectOrNorad: OrbitalObject | string | null) => void;
  setFilter: (filters: Partial<OrbitalFilters>) => void;
  setSearchQuery: (query: string) => void;
  clearSelection: () => void;
}

const initialFilters: OrbitalFilters = {
  objectType: 'ALL',
  category: 'ALL',
  regime: 'ALL',
  status: 'ALL',
  searchQuery: '',
};

export const useOrbitalStore = create<OrbitalState>((set, get) => ({
  objects: [],
  totalCount: 0,
  selectedObject: null,
  selectedNoradId: null,
  hoveredObject: null,
  hoveredNoradId: null,
  loading: false,
  loadingProgress: 0,
  error: null,
  statistics: null,
  filters: initialFilters,
  searchQuery: '',

  loadCatalog: async () => {
    // If already loaded or loading, skip
    if (get().objects.length > 0) return;
    if (get().loading) return;

    set({ loading: true, error: null, loadingProgress: 5 });

    try {
      const items = await orbitalDataService.loadOrbitalObjects((loaded, total) => {
        const pct = Math.min(95, Math.round((loaded / Math.max(1, total)) * 100));
        set({ loadingProgress: pct });
      });

      const stats = orbitalDataService.getObjectStatistics();

      set({
        objects: items,
        totalCount: items.length,
        statistics: stats,
        loading: false,
        loadingProgress: 100,
      });

      logEvent(
        'SYSTEM',
        'LOW',
        'Orbital Catalog Loaded',
        `Catalog active with ${items.length.toLocaleString()} space objects`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load orbital catalog';
      set({
        loading: false,
        error: msg,
        loadingProgress: 0,
      });
    }
  },

  setSelectedObject: (objectOrNorad) => {
    if (!objectOrNorad) {
      set({ selectedObject: null, selectedNoradId: null });
      return;
    }

    const noradId = typeof objectOrNorad === 'string' ? objectOrNorad : objectOrNorad.noradId;
    const obj = typeof objectOrNorad === 'string' ? (orbitalDataService.getOrbitalObjectById(noradId) ?? null) : objectOrNorad;

    if (noradId && noradId !== get().selectedNoradId) {
      logEvent('TRACKING', 'LOW', 'Orbital Object Selected', `NORAD ID ${noradId}: ${obj?.name ?? 'Unknown'}`);
    }

    set({ selectedObject: obj, selectedNoradId: noradId });
  },

  setHoveredObject: (objectOrNorad) => {
    if (!objectOrNorad) {
      if (get().hoveredNoradId !== null) {
        set({ hoveredObject: null, hoveredNoradId: null });
      }
      return;
    }

    const noradId = typeof objectOrNorad === 'string' ? objectOrNorad : objectOrNorad.noradId;
    if (get().hoveredNoradId === noradId) return;

    const obj = typeof objectOrNorad === 'string' ? (orbitalDataService.getOrbitalObjectById(noradId) ?? null) : objectOrNorad;

    set({ hoveredObject: obj, hoveredNoradId: noradId });
  },

  setFilter: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  setSearchQuery: (searchQuery) => {
    set((state) => ({
      searchQuery,
      filters: { ...state.filters, searchQuery },
    }));
  },

  clearSelection: () => {
    set({ selectedObject: null, selectedNoradId: null });
  },
}));
