import React from 'react';
import { usePerformanceStore } from '@/store/performanceStore';
import { MaterialIcon } from '@/components/MaterialIcon';

export const PerformanceToggleButton: React.FC = () => {
  const { isEnabled, toggleOverlay, fps, bottlenecks } = usePerformanceStore();
  const warningCount = bottlenecks.filter((b) => b.severity === 'WARNING' || b.severity === 'CRITICAL').length;

  return (
    <button
      onClick={toggleOverlay}
      title={`Developer Performance Overlay (Shift + P) - ${fps.toFixed(0)} FPS`}
      className={`relative p-2 rounded-lg flex items-center gap-1.5 transition-all text-xs font-mono border ${
        isEnabled
          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_12px_rgba(0,229,255,0.3)]'
          : 'bg-surface-container-high/60 text-slate-400 border-surface-container-highest hover:text-slate-200 hover:border-slate-600'
      }`}
    >
      <MaterialIcon name="speed" className="text-base" />
      <span className="hidden sm:inline font-semibold">{fps.toFixed(0)} FPS</span>

      {warningCount > 0 && (
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title={`${warningCount} active bottleneck alerts`} />
      )}
    </button>
  );
};
