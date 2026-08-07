/**
 * Types for the Mission Intelligence & Operations Logbook.
 *
 * The logbook is the operational audit trail of the mission: every
 * significant user interaction or system event (satellite tracking,
 * camera movement, searches, alerts, etc.) is recorded here so it can be
 * reviewed chronologically, filtered, and inspected after the fact.
 */

/** High-level grouping used for filtering and iconography in the UI. */
export type LogCategory =
  | 'TRACKING'
  | 'CAMERA'
  | 'SEARCH'
  | 'ALERTS'
  | 'SYSTEM'
  | 'MISSION';

/** Severity of a log entry, used for color coding and sorting. */
export type LogPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface LogEntry {
  /** Unique, monotonically-creatable id (not guaranteed sortable). */
  id: string;
  /** Unix ms timestamp, set when the entry is recorded. */
  timestamp: number;
  category: LogCategory;
  priority: LogPriority;
  /** Short, human-readable summary shown in the collapsed row. */
  title: string;
  /** Optional one-line elaboration shown under the title. */
  description?: string;
  /** Optional key/value pairs shown when the entry is expanded. */
  details?: Record<string, string | number>;
}

/** Payload accepted when recording a new entry — id/timestamp are assigned by the store. */
export type LogEntryInput = Omit<LogEntry, 'id' | 'timestamp'>;
