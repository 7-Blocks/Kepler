/**
 * Centralized keyboard shortcut definitions for Kepler (issue #83).
 *
 * Single source of truth for every shortcut in the app. To add one:
 * add an entry below and provide the matching handler in the
 * `handlers` map passed to useKeyboardShortcuts() in App.tsx.
 *
 * See hooks/useKeyboardShortcuts.ts for listener/matching logic and
 * components/ShortcutHelpModal.tsx for the cheat-sheet UI.
 */

export type ShortcutCategory =
  | 'Navigation'
  | 'Search'
  | 'Data Actions'
  | 'Table Navigation'
  | 'Globe Controls'
  | 'Dashboard Controls'
  | 'Utility';

export type ModifierKey = 'ctrl' | 'shift' | 'alt';

export interface ShortcutKeyCombo {
  /** Primary key, e.g. 'g', '/', 'Enter', 'ArrowUp', '+'. Case-insensitive for letters. */
  key: string;
  modifiers?: ModifierKey[];
}

export interface ShortcutDefinition {
  id: string;
  combo: ShortcutKeyCombo;
  description: string;
  category: ShortcutCategory;
  /** Key looked up in the handlers map passed to useKeyboardShortcuts(). */
  handlerKey: string;
  /** Allowed to fire even while typing in an input/textarea/editor (e.g. Esc). */
  allowInTypingContext?: boolean;
}

/** Human-readable label for a combo, adapted for the user's platform (⌘ on Mac, Ctrl elsewhere). */
export function formatShortcut(combo: ShortcutKeyCombo, isMac: boolean): string {
  const parts: string[] = [];
  if (combo.modifiers?.includes('ctrl')) parts.push(isMac ? '⌘' : 'Ctrl');
  if (combo.modifiers?.includes('shift')) parts.push(isMac ? '⇧' : 'Shift');
  if (combo.modifiers?.includes('alt')) parts.push(isMac ? '⌥' : 'Alt');

  const keyLabelMap: Record<string, string> = {
    ' ': 'Space',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Escape: 'Esc',
    Enter: '↵ Enter',
    Delete: 'Delete',
    Home: 'Home',
    End: 'End',
    PageUp: 'Page Up',
    PageDown: 'Page Down',
  };

  const keyLabel = keyLabelMap[combo.key] ?? (combo.key.length === 1 ? combo.key.toUpperCase() : combo.key);
  parts.push(keyLabel);
  return parts.join(isMac ? '' : ' + ');
}

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  // Navigation — mapped to Kepler's actual dashboard routes.
  // NOTE: Telemetry, Space Weather, Risk Assessment and Prediction Analytics
  // don't have dedicated pages yet, so those handlerKeys are intentionally
  // left unwired in App.tsx (safe no-ops) until those routes exist.
  { id: 'nav-globe', combo: { key: 'g' }, description: 'Open Globe View', category: 'Navigation', handlerKey: 'openGlobeView' },
  { id: 'nav-dashboard', combo: { key: 'd' }, description: 'Go to Dashboard', category: 'Navigation', handlerKey: 'goToDashboard' },
  { id: 'nav-satellite', combo: { key: 's' }, description: 'Open Satellite Management', category: 'Navigation', handlerKey: 'openSatelliteManagement' },
  { id: 'nav-collision', combo: { key: 'c' }, description: 'Open Collision Prediction', category: 'Navigation', handlerKey: 'openCollisionPrediction' },
  { id: 'nav-ai-agent', combo: { key: 'a' }, description: 'Open AI Agent Dashboard', category: 'Navigation', handlerKey: 'openAiAgentDashboard' },
  { id: 'nav-telemetry', combo: { key: 't' }, description: 'Open Telemetry', category: 'Navigation', handlerKey: 'openTelemetry' },
  { id: 'nav-maneuver', combo: { key: 'm' }, description: 'Open Maneuver Planning', category: 'Navigation', handlerKey: 'openManeuverPlanning' },
  { id: 'nav-weather', combo: { key: 'w' }, description: 'Open Space Weather', category: 'Navigation', handlerKey: 'openSpaceWeather' },
  { id: 'nav-risk', combo: { key: 'r' }, description: 'Open Risk Assessment', category: 'Navigation', handlerKey: 'openRiskAssessment' },
  { id: 'nav-prediction', combo: { key: 'p' }, description: 'Open Prediction Analytics', category: 'Navigation', handlerKey: 'openPredictionAnalytics' },
  { id: 'nav-home', combo: { key: 'h' }, description: 'Return to Home/Dashboard', category: 'Navigation', handlerKey: 'goHome' },
  { id: 'nav-close-modal', combo: { key: 'Escape' }, description: 'Close open modal or dialog', category: 'Navigation', handlerKey: 'closeModal', allowInTypingContext: true },

  // Search
  { id: 'search-global', combo: { key: 'k', modifiers: ['ctrl'] }, description: 'Open global search', category: 'Search', handlerKey: 'openGlobalSearch' },
  { id: 'search-focus', combo: { key: '/' }, description: 'Focus search bar', category: 'Search', handlerKey: 'focusSearchBar' },
  { id: 'search-advanced', combo: { key: 'f', modifiers: ['ctrl', 'shift'] }, description: 'Advanced search', category: 'Search', handlerKey: 'openAdvancedSearch' },

  // Data Actions — refresh wired via React Query cache invalidation at App level.
  { id: 'data-refresh', combo: { key: 'r', modifiers: ['ctrl'] }, description: 'Refresh current data', category: 'Data Actions', handlerKey: 'refreshCurrentData' },
  { id: 'data-force-refresh', combo: { key: 'r', modifiers: ['ctrl', 'shift'] }, description: 'Force refresh all live data', category: 'Data Actions', handlerKey: 'forceRefreshAllData' },
  { id: 'data-export', combo: { key: 'e', modifiers: ['ctrl'] }, description: 'Export current table', category: 'Data Actions', handlerKey: 'exportCurrentTable' },
  { id: 'data-export-all', combo: { key: 'e', modifiers: ['ctrl', 'shift'] }, description: 'Export all records', category: 'Data Actions', handlerKey: 'exportAllRecords' },
  { id: 'data-save', combo: { key: 's', modifiers: ['ctrl'] }, description: 'Save settings where applicable', category: 'Data Actions', handlerKey: 'saveSettings' },

  // Table Navigation — no-ops unless a page registers its own handlers via `definitions` scoping.
  { id: 'table-up', combo: { key: 'ArrowUp' }, description: 'Move up a row', category: 'Table Navigation', handlerKey: 'tableMoveUp' },
  { id: 'table-down', combo: { key: 'ArrowDown' }, description: 'Move down a row', category: 'Table Navigation', handlerKey: 'tableMoveDown' },
  { id: 'table-left', combo: { key: 'ArrowLeft' }, description: 'Move left a column', category: 'Table Navigation', handlerKey: 'tableMoveLeft' },
  { id: 'table-right', combo: { key: 'ArrowRight' }, description: 'Move right a column', category: 'Table Navigation', handlerKey: 'tableMoveRight' },
  { id: 'table-open', combo: { key: 'Enter' }, description: 'Open selected item', category: 'Table Navigation', handlerKey: 'tableOpenSelected' },
  { id: 'table-clear-filters', combo: { key: 'Delete' }, description: 'Clear filters', category: 'Table Navigation', handlerKey: 'tableClearFilters' },
  { id: 'table-first-row', combo: { key: 'Home' }, description: 'Jump to first row', category: 'Table Navigation', handlerKey: 'tableJumpToFirstRow' },
  { id: 'table-last-row', combo: { key: 'End' }, description: 'Jump to last row', category: 'Table Navigation', handlerKey: 'tableJumpToLastRow' },
  { id: 'table-page-up', combo: { key: 'PageUp' }, description: 'Previous page', category: 'Table Navigation', handlerKey: 'tablePageUp' },
  { id: 'table-page-down', combo: { key: 'PageDown' }, description: 'Next page', category: 'Table Navigation', handlerKey: 'tablePageDown' },

  // Globe Controls — wired inside Dashboard/EarthTwin, not globally.
  { id: 'globe-zoom-in', combo: { key: '+' }, description: 'Zoom in', category: 'Globe Controls', handlerKey: 'globeZoomIn' },
  { id: 'globe-zoom-out', combo: { key: '-' }, description: 'Zoom out', category: 'Globe Controls', handlerKey: 'globeZoomOut' },
  { id: 'globe-reset-camera', combo: { key: '0' }, description: 'Reset camera', category: 'Globe Controls', handlerKey: 'globeResetCamera' },
  { id: 'globe-toggle-labels', combo: { key: 'l' }, description: 'Toggle labels', category: 'Globe Controls', handlerKey: 'globeToggleLabels' },
  { id: 'globe-toggle-debris', combo: { key: 'b' }, description: 'Toggle debris visibility', category: 'Globe Controls', handlerKey: 'globeToggleDebris' },
  { id: 'globe-toggle-orbits', combo: { key: 'o' }, description: 'Toggle orbit paths', category: 'Globe Controls', handlerKey: 'globeToggleOrbits' },
  { id: 'globe-focus-satellite', combo: { key: 'f' }, description: 'Focus selected satellite', category: 'Globe Controls', handlerKey: 'globeFocusSatellite' },

  // Dashboard Controls — sidebar toggle wired to the existing uiStore.
  { id: 'dash-toggle-sidebar', combo: { key: 'd', modifiers: ['ctrl'] }, description: 'Toggle sidebar', category: 'Dashboard Controls', handlerKey: 'toggleSidebar' },
  { id: 'dash-collapse-sidebar', combo: { key: 'b', modifiers: ['ctrl'] }, description: 'Collapse or expand sidebar', category: 'Dashboard Controls', handlerKey: 'toggleSidebar' },
  { id: 'dash-toggle-fullscreen', combo: { key: 'd', modifiers: ['ctrl', 'shift'] }, description: 'Toggle fullscreen dashboard', category: 'Dashboard Controls', handlerKey: 'toggleFullscreenDashboard' },
  { id: 'dash-toggle-theme', combo: { key: 't', modifiers: ['ctrl'] }, description: 'Toggle theme', category: 'Dashboard Controls', handlerKey: 'toggleTheme' },
  { id: 'dash-toggle-live', combo: { key: 'l', modifiers: ['ctrl'] }, description: 'Toggle live updates', category: 'Dashboard Controls', handlerKey: 'toggleLiveUpdates' },

  // Utility
  { id: 'util-help-slash', combo: { key: '/', modifiers: ['ctrl'] }, description: 'Open shortcut help', category: 'Utility', handlerKey: 'openShortcutHelp' },
  { id: 'util-help-question', combo: { key: '?' }, description: 'Show shortcut cheat sheet', category: 'Utility', handlerKey: 'openShortcutHelp' },
  { id: 'util-settings', combo: { key: 's', modifiers: ['ctrl', 'shift'] }, description: 'Open settings', category: 'Utility', handlerKey: 'openSettings' },
  { id: 'util-recent-activity', combo: { key: 'h', modifiers: ['ctrl', 'shift'] }, description: 'View recent activity', category: 'Utility', handlerKey: 'openRecentActivity' },
];

export const SHORTCUT_CATEGORIES_ORDER: ShortcutCategory[] = [
  'Navigation',
  'Search',
  'Data Actions',
  'Table Navigation',
  'Globe Controls',
  'Dashboard Controls',
  'Utility',
];

export function groupShortcutsByCategory(
  defs: ShortcutDefinition[] = SHORTCUT_DEFINITIONS
): Record<ShortcutCategory, ShortcutDefinition[]> {
  const grouped = {} as Record<ShortcutCategory, ShortcutDefinition[]>;
  for (const category of SHORTCUT_CATEGORIES_ORDER) {
    grouped[category] = [];
  }
  for (const def of defs) {
    grouped[def.category].push(def);
  }
  return grouped;
}
