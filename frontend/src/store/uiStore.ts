import { create } from 'zustand';
import { logEvent } from './logbookStore';

interface UIState {
  sidebarCollapsed: boolean;
  rightDrawerOpen: boolean;
  selectedSatelliteId: string | null;
  selectedSatelliteIds: string[];
  selectedCollisionId: string | null;
  activeSector: string;
  globalSearchOpen: boolean;
  isFlybyHistoryOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleRightDrawer: () => void;
  setRightDrawerOpen: (open: boolean) => void;
  setSelectedSatelliteId: (id: string | null) => void;
  setSelectedSatelliteIds: (ids: string[]) => void;
  toggleSatelliteSelection: (id: string) => void;
  setSelectedCollisionId: (id: string | null) => void;
  setActiveSector: (sector: string) => void;
  setGlobalSearchOpen: (open: boolean) => void;
  toggleFlybyHistory: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  rightDrawerOpen: false,
  selectedSatelliteId: null,   
  selectedSatelliteIds: [],
  selectedCollisionId: null,   
  activeSector: '',
  globalSearchOpen: false,
  isFlybyHistoryOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleRightDrawer: () => set((state) => ({ rightDrawerOpen: !state.rightDrawerOpen })),
  setRightDrawerOpen: (open) => set({ rightDrawerOpen: open }),
  setSelectedSatelliteId: (id) =>
    set((state) => {
      // Single source of truth for satellite selection — both the 3D globe
      // and the satellite list page funnel here, so log it once, here,
      // rather than at every call site (which would double-log the globe
      // path, since it also updates this same field).
      if (id && id !== state.selectedSatelliteId) {
        logEvent('TRACKING', 'LOW', 'Satellite locked', `NORAD ${id}`, { CATALOG_NUMBER: id });
      }
      return { selectedSatelliteId: id };
    }),
  setSelectedSatelliteIds: (ids) => set({ selectedSatelliteIds: ids }),
  toggleSatelliteSelection: (id) => set((state) => {
    const isSelected = state.selectedSatelliteIds.includes(id);
    if (isSelected) {
      return { selectedSatelliteIds: state.selectedSatelliteIds.filter(sid => sid !== id) };
    }
    if (state.selectedSatelliteIds.length >= 4) {
      return { selectedSatelliteIds: state.selectedSatelliteIds };
    }
    return { selectedSatelliteIds: [...state.selectedSatelliteIds, id] };
  }),
  setSelectedCollisionId: (id) => set({ selectedCollisionId: id }),
  setActiveSector: (sector) => set({ activeSector: sector }),
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
  toggleFlybyHistory: () => set((state) => ({ isFlybyHistoryOpen: !state.isFlybyHistoryOpen })),
}));
