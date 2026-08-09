import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotificationStore } from '@/store/notificationStore';
import { useUIStore } from '@/store/uiStore';
import { useFlybyEngine } from '@/hooks/useFlybyEngine';
import { FlybyNotification } from './FlybyNotification';
import { MaterialIcon } from '../MaterialIcon';

export const NotificationCenter: React.FC = () => {
  // Mount engine here so it runs globally
  useFlybyEngine();

  const notifications = useNotificationStore((s) => s.notifications);
  const preferences = useNotificationStore((s) => s.preferences);
  const updatePreferences = useNotificationStore((s) => s.updatePreferences);
  const clearAll = useNotificationStore((s) => s.clearAll);
  
  const isHistoryOpen = useUIStore((s) => s.isFlybyHistoryOpen);
  const toggleHistory = useUIStore((s) => s.toggleFlybyHistory);

  const activeNotifications = notifications.filter(n => !n.dismissed);

  return (
    <>
      {/* Active Toasts - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-4 items-end pointer-events-none">
        <AnimatePresence>
          {activeNotifications.slice(0, 3).map((notification) => (
            <div key={notification.id} className="pointer-events-auto">
              <FlybyNotification notification={notification} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* History & Settings Panel */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-16 right-16 sm:right-72 z-50 w-80 max-h-[80vh] flex flex-col bg-bg-deep-space/95 backdrop-blur-xl border border-primary-container/40 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div className="p-4 border-b border-border-panel/70 flex justify-between items-center bg-surface-container/30">
              <div>
                <h2 className="font-display-lg text-base font-bold text-on-surface">FLYBY ALERTS</h2>
                <p className="font-label-caps text-[9px] tracking-widest text-primary-container/70">HISTORY & SETTINGS</p>
              </div>
              <button 
                onClick={toggleHistory}
                className="text-on-surface-variant hover:text-primary-container transition-ui"
              >
                <MaterialIcon name="close" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
              {/* Settings Section */}
              <div className="bg-surface-container/20 border border-border-panel p-3">
                <h3 className="font-label-caps text-[10px] tracking-widest text-on-surface-variant mb-3">PREFERENCES</h3>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="font-technical-data text-xs text-on-surface">Audio Alerts</span>
                  <button 
                    onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
                    className={`text-lg transition-ui ${preferences.soundEnabled ? 'text-primary-container' : 'text-on-surface-variant'}`}
                  >
                    <MaterialIcon name={preferences.soundEnabled ? 'volume_up' : 'volume_off'} />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-technical-data text-xs text-on-surface">Warning Window</span>
                  <div className="flex gap-2">
                    {[5, 10, 15].map(min => (
                      <button
                        key={min}
                        onClick={() => updatePreferences({ warningMinutes: min })}
                        className={`flex-1 py-1 font-technical-data text-[10px] font-bold border transition-ui ${
                          preferences.warningMinutes === min 
                            ? 'bg-primary-container/20 border-primary-container text-primary-container' 
                            : 'border-border-panel text-on-surface-variant hover:text-primary'
                        }`}
                      >
                        {min} MIN
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* History Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                   <h3 className="font-label-caps text-[10px] tracking-widest text-on-surface-variant">LOG</h3>
                   {notifications.length > 0 && (
                     <button onClick={clearAll} className="font-technical-data text-[9px] text-primary-fixed hover:text-primary-container transition-ui">
                       CLEAR ALL
                     </button>
                   )}
                </div>
                
                {notifications.length === 0 ? (
                  <p className="font-technical-data text-xs text-on-surface-variant text-center py-4 italic">
                    No flyby alerts recorded.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-2 border ${n.dismissed ? 'border-border-panel bg-surface-container-low/50' : 'border-primary-container/40 bg-primary-container/10'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-technical-data text-xs font-bold text-on-surface">{n.satelliteName}</span>
                          <span className="font-technical-data text-[9px] text-on-surface-variant">
                            {n.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="font-technical-data text-[10px] text-primary">Over {n.locationName}</p>
                        <p className="font-technical-data text-[10px] text-on-surface-variant mt-1">
                          Max El: {n.maxElevationDeg.toFixed(1)}° | Alt: {n.altitudeKm.toFixed(0)}km
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
