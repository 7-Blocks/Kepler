import { create } from 'zustand';

export interface FlybyNotification {
  id: string;
  satelliteId: string;
  satelliteName: string;
  locationName: string; // E.g., 'Current Location' or 'London'
  eta: Date;
  altitudeKm: number;
  velocityKms: number;
  maxElevationDeg: number;
  durationSec: number;
  dismissed: boolean;
  createdAt: Date;
}

export interface NotificationPreferences {
  soundEnabled: boolean;
  warningMinutes: number; // 5, 10, or 15
}

interface NotificationState {
  notifications: FlybyNotification[];
  preferences: NotificationPreferences;
  addNotification: (notification: Omit<FlybyNotification, 'id' | 'dismissed' | 'createdAt'>) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  preferences: {
    soundEnabled: true,
    warningMinutes: 10,
  },
  addNotification: (notificationData) => set((state) => {
    // Avoid duplicate active notifications for the same satellite and location within a short timeframe
    const isDuplicate = state.notifications.some(
      (n) => n.satelliteId === notificationData.satelliteId && 
             n.locationName === notificationData.locationName &&
             !n.dismissed &&
             Math.abs(n.eta.getTime() - notificationData.eta.getTime()) < 5 * 60 * 1000 // 5 min window
    );

    if (isDuplicate) return state;

    const newNotification: FlybyNotification = {
      ...notificationData,
      id: crypto.randomUUID(),
      dismissed: false,
      createdAt: new Date(),
    };

    return { notifications: [newNotification, ...state.notifications] };
  }),
  dismissNotification: (id) => set((state) => ({
    notifications: state.notifications.map((n) => 
      n.id === id ? { ...n, dismissed: true } : n
    ),
  })),
  clearAll: () => set({ notifications: [] }),
  updatePreferences: (prefs) => set((state) => ({
    preferences: { ...state.preferences, ...prefs },
  })),
}));
