// Centralized State Management Store Index
// Sliced modules: authStore, dataStore, layerStore, logbookStore, uiStore

import { useAuthStore } from './authStore';
import { useDataStore } from './dataStore';
import { useLayerStore } from './layerStore';
import { useLogbookStore } from './logbookStore';
import { useUIStore } from './uiStore';

export { useAuthStore } from './authStore';
export { useDataStore, type DataFilters, type RiskLevel, type TimeRangeOption } from './dataStore';
export { useLayerStore, type ObjectCategory } from './layerStore';
export { useLogbookStore, logEvent } from './logbookStore';
export { useUIStore } from './uiStore';

// Fine-grained atomic selector hooks to prevent unnecessary React re-renders

// Auth Selectors
export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.isAuthenticated);
}

export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}

// UI Selectors
export function useSidebarCollapsed(): boolean {
  return useUIStore((state) => state.sidebarCollapsed);
}

export function useRightDrawerOpen(): boolean {
  return useUIStore((state) => state.rightDrawerOpen);
}

export function useSelectedSatelliteId(): string | null {
  return useUIStore((state) => state.selectedSatelliteId);
}

export function useSelectedSatelliteIds(): string[] {
  return useUIStore((state) => state.selectedSatelliteIds);
}

export function useSelectedCollisionId(): string | null {
  return useUIStore((state) => state.selectedCollisionId);
}

export function useActiveSector(): string {
  return useUIStore((state) => state.activeSector);
}

export function useGlobalSearchOpen(): boolean {
  return useUIStore((state) => state.globalSearchOpen);
}

// Layer Selectors
export function useCategoryVisibility() {
  return useLayerStore((state) => state.categoryVisibility);
}

export function useRegimeVisibility() {
  return useLayerStore((state) => state.regimeVisibility);
}

// Logbook Selectors
export function useLogEntries() {
  return useLogbookStore((state) => state.entries);
}

// Data Selectors
export function useDataFilters() {
  return useDataStore((state) => state.filters);
}

export function useActiveCollisionFilter() {
  return useDataStore((state) => state.activeCollisionFilter);
}
