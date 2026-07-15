import React from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';

export const MissionPlanner: React.FC = () => {
  return (
    <div className="p-4 md:p-6 space-y-6 overflow-y-auto h-full custom-scrollbar technical-grid">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-border-panel pb-4">
        <div>
          <h2 className="font-headline-lg text-lg md:text-headline-lg text-primary tracking-tight font-bold">
            MISSION PLANNER
          </h2>
          <p className="text-xs text-on-surface-variant font-technical-data mt-1">
            OPTIMIZE FUEL EXPENDITURE & TRAJECTORY WINDOWS
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-primary-container text-on-primary font-label-caps text-label-caps hover:bg-primary cursor-pointer min-h-[44px]">
          <MaterialIcon name="play_arrow" className="text-sm mr-2" />
          RUN SIMULATION
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6">
          <h3 className="font-label-caps text-primary-container font-bold mb-4">TIMELINE BUILDER</h3>
          <div className="h-48 border border-dashed border-border-panel/80 flex items-center justify-center text-on-surface-variant text-xs font-technical-data">
            DRAG & DROP MANEUVER KEYFRAMES
          </div>
        </div>

        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-label-caps text-primary-container font-bold">OPTIMIZATION CRITERIA</h3>
          <div className="space-y-3 text-xs font-technical-data">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded border-border-panel text-primary-container focus:ring-0 focus:ring-offset-0 bg-surface-container-low" />
              <span>Prioritize Fuel Economy</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded border-border-panel text-primary-container focus:ring-0 focus:ring-offset-0 bg-surface-container-low" />
              <span>Avoid Geo-Syn Congestion</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-border-panel text-primary-container focus:ring-0 focus:ring-offset-0 bg-surface-container-low" />
              <span>Request Human Clearance</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MissionPlanner;
