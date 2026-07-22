import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  rightDrawerOpen: boolean;
  selectedSatelliteId: string | null;
  selectedSatelliteIds: string[];
  selectedCollisionId: string | null;
  activeSector: string;
  globalSearchOpen: boolean;
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
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  rightDrawerOpen: false,
  selectedSatelliteId: null,   
  selectedSatelliteIds: [],
  selectedCollisionId: null,   
  activeSector: '',
  globalSearchOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleRightDrawer: () => set((state) => ({ rightDrawerOpen: !state.rightDrawerOpen })),
  setRightDrawerOpen: (open) => set({ rightDrawerOpen: open }),
  setSelectedSatelliteId: (id) => set({ selectedSatelliteId: id }),
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
}));
