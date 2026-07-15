import React from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';

export const SpaceTraffic: React.FC = () => {
  return (
    <div className="p-4 md:p-6 space-y-6 overflow-y-auto h-full custom-scrollbar technical-grid">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-border-panel pb-4">
        <div>
          <h2 className="font-headline-lg text-lg md:text-headline-lg text-primary tracking-tight font-bold">
            SPACE TRAFFIC MONITOR
          </h2>
          <p className="text-xs text-on-surface-variant font-technical-data mt-1">
            REAL-TIME SATELLITE & DEBRIS DENSITY SECTORS
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center px-4 py-2 bg-primary-container text-on-primary font-label-caps text-label-caps hover:bg-primary transition-all cursor-pointer min-h-[44px]">
            <MaterialIcon name="filter_alt" className="text-sm mr-2" />
            REGISTRY FILTER
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="font-label-caps text-primary-container font-bold mb-4">ACTIVE ORBITAL SECTORS</h3>
          <div className="space-y-3 font-technical-data">
            <div className="flex justify-between p-2 border-b border-border-panel/40">
              <span>LEO Sector Alpha</span>
              <span className="text-status-emergency font-bold">4 CONJUNCTIONS</span>
            </div>
            <div className="flex justify-between p-2 border-b border-border-panel/40">
              <span>MEO Sector Beta</span>
              <span className="text-status-success">NOMINAL</span>
            </div>
            <div className="flex justify-between p-2 border-b border-border-panel/40">
              <span>GEO Sector Gamma</span>
              <span className="text-status-warning">1 WARNING</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-center items-center text-center">
          <MaterialIcon name="radar" className="text-6xl text-primary-container/20 mb-4 animate-[spin_8s_linear_infinite]" />
          <p className="font-label-caps text-sm text-primary-container font-bold">RADAR SWEEP ONLINE</p>
          <p className="text-xs text-on-surface-variant max-w-xs mt-2 leading-relaxed">
            Continuously polling ground radar arrays and military TLE assets. Latency nominal (14ms).
          </p>
        </div>
      </div>
    </div>
  );
};
export default SpaceTraffic;
