import type { LogCategory, LogPriority } from '@/types/logbook';

export const CATEGORY_CONFIG: Record<LogCategory, { label: string; icon: string; color: string }> = {
  TRACKING: { label: 'Tracking', icon: 'satellite_alt', color: '#00e5ff' },
  CAMERA: { label: 'Camera', icon: 'videocam', color: '#7c3aed' },
  SEARCH: { label: 'Search', icon: 'search', color: '#34C759' },
  ALERTS: { label: 'Alerts', icon: 'crisis_alert', color: '#FF3B30' },
  SYSTEM: { label: 'System', icon: 'memory', color: '#8892A6' },
  MISSION: { label: 'Mission', icon: 'flag', color: '#FF9500' },
};

export const PRIORITY_CONFIG: Record<LogPriority, { label: string; color: string; pulse?: boolean }> = {
  LOW: { label: 'LOW', color: '#8892A6' },
  MEDIUM: { label: 'MEDIUM', color: '#FF9500' },
  HIGH: { label: 'HIGH', color: '#FF3B30' },
  CRITICAL: { label: 'CRITICAL', color: '#FF3B30', pulse: true },
};

export const CATEGORY_ORDER: LogCategory[] = ['TRACKING', 'CAMERA', 'SEARCH', 'ALERTS', 'SYSTEM', 'MISSION'];
export const PRIORITY_ORDER: LogPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export function formatLogTime(ts: number): string {
  return new Date(ts).toISOString().substring(11, 19) + 'Z';
}
