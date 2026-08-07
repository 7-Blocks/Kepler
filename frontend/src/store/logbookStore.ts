import { create } from 'zustand';
import type { LogEntry, LogEntryInput, LogCategory, LogPriority } from '@/types/logbook';

/** Hard cap on retained entries so a long mission session doesn't grow memory unbounded. */
const MAX_ENTRIES = 300;

let counter = 0;
/** Collision-resistant id: timestamp isn't unique enough when events fire in the same tick. */
function nextId(): string {
  counter += 1;
  return `log_${Date.now()}_${counter}`;
}

interface LogbookState {
  entries: LogEntry[];
  addEntry: (entry: LogEntryInput) => void;
  clearAll: () => void;
}

export const useLogbookStore = create<LogbookState>((set) => ({
  entries: [],
  addEntry: (entry) =>
    set((state) => {
      const newEntry: LogEntry = {
        ...entry,
        id: nextId(),
        timestamp: Date.now(),
      };
      const entries = [newEntry, ...state.entries];
      return {
        entries: entries.length > MAX_ENTRIES ? entries.slice(0, MAX_ENTRIES) : entries,
      };
    }),
  clearAll: () => set({ entries: [] }),
}));

/**
 * Record a mission event from anywhere — components, hooks, Cesium event
 * handlers, or other stores — without needing to subscribe to the logbook
 * store. This is the primary entry point the rest of the app should use.
 *
 * @example
 * logEvent('TRACKING', 'MEDIUM', 'Satellite locked', 'ISS (ZARYA) — NORAD 25544');
 */
export function logEvent(
  category: LogCategory,
  priority: LogPriority,
  title: string,
  description?: string,
  details?: Record<string, string | number>
): void {
  useLogbookStore.getState().addEntry({ category, priority, title, description, details });
}
