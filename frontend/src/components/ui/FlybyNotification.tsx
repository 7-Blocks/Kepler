import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNotificationStore } from '@/store/notificationStore';
import type { FlybyNotification as FlybyNotificationType } from '@/store/notificationStore';
import { useUIStore } from '@/store/uiStore';
import { MaterialIcon } from '../MaterialIcon';
import { useNavigate } from 'react-router-dom';

interface Props {
  notification: FlybyNotificationType;
}

const playBeep = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); // Drop to A4
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
};

export const FlybyNotification: React.FC<Props> = ({ notification }) => {
  const dismiss = useNotificationStore((s) => s.dismissNotification);
  const preferences = useNotificationStore((s) => s.preferences);
  const setSelectedSatelliteId = useUIStore((s) => s.setSelectedSatelliteId);
  const navigate = useNavigate();

  useEffect(() => {
    if (preferences.soundEnabled) {
      playBeep();
    }
    
    // Optional: Use browser notifications API if permitted
    if (Notification.permission === 'granted') {
      new Notification(`Flyby Alert: ${notification.satelliteName}`, {
        body: `Approaching ${notification.locationName}. ETA: ${notification.eta.toLocaleTimeString()}`,
        icon: '/vite.svg'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, [notification, preferences.soundEnabled]);

  const handleTrack = () => {
    setSelectedSatelliteId(notification.satelliteId);
    navigate('/dashboard/satellites');
    dismiss(notification.id);
  };

  const minutesAway = Math.max(0, Math.round((notification.eta.getTime() - Date.now()) / 60000));

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="bg-bg-deep-space/90 backdrop-blur-md border border-primary-container/40 p-4 w-80 shadow-[0_4px_24px_rgba(0,229,255,0.15)] relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-primary-container glow-cyan" />
      
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <MaterialIcon name="radar" className="text-primary-container animate-pulse text-sm" />
          <span className="font-label-caps text-[10px] tracking-widest text-primary-container font-bold">
            INCOMING FLYBY
          </span>
        </div>
        <button 
          onClick={() => dismiss(notification.id)}
          className="text-on-surface-variant hover:text-primary-container transition-ui"
        >
          <MaterialIcon name="close" className="text-sm" />
        </button>
      </div>

      <h3 className="font-display-lg text-lg text-on-surface leading-tight mb-1">
        {notification.satelliteName}
      </h3>
      <p className="font-technical-data text-[11px] text-on-surface-variant mb-3">
        Target: <span className="text-primary">{notification.locationName}</span>
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4 bg-surface-container/30 p-2 border border-border-panel">
        <div>
          <p className="font-label-caps text-[9px] text-on-surface-variant">ETA</p>
          <p className="font-technical-data text-xs text-status-warning font-bold">
            T-{minutesAway} MIN
          </p>
        </div>
        <div>
          <p className="font-label-caps text-[9px] text-on-surface-variant">MAX ELEVATION</p>
          <p className="font-technical-data text-xs text-primary-fixed font-bold">
            {notification.maxElevationDeg.toFixed(1)}°
          </p>
        </div>
        <div>
          <p className="font-label-caps text-[9px] text-on-surface-variant">ALTITUDE</p>
          <p className="font-technical-data text-xs text-on-surface">
            {notification.altitudeKm.toFixed(0)} KM
          </p>
        </div>
        <div>
          <p className="font-label-caps text-[9px] text-on-surface-variant">VELOCITY</p>
          <p className="font-technical-data text-xs text-on-surface">
            {notification.velocityKms.toFixed(2)} KM/S
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={handleTrack}
          className="flex-1 bg-primary-container/10 border border-primary-container text-primary-container hover:bg-primary-container hover:text-bg-deep-space transition-ui font-technical-data text-xs py-1.5 font-bold"
        >
          TRACK LIVE
        </button>
        <button 
          onClick={() => dismiss(notification.id)}
          className="flex-1 border border-border-panel text-on-surface-variant hover:text-primary transition-ui font-technical-data text-xs py-1.5"
        >
          DISMISS
        </button>
      </div>
    </motion.div>
  );
};
