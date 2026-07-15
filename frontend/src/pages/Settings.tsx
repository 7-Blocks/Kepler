import React from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';

export const Settings: React.FC = () => {
  return (
    <div className="p-4 md:p-6 space-y-6 overflow-y-auto h-full custom-scrollbar technical-grid">
      <div className="flex justify-between items-end border-b border-border-panel pb-4">
        <div>
          <h2 className="font-headline-lg text-lg md:text-headline-lg text-primary tracking-tight font-bold">
            SYSTEM SETTINGS
          </h2>
          <p className="text-xs text-on-surface-variant font-technical-data mt-1">
            MANAGE DEVIATION THRESHOLDS & API CONNECTORS
          </p>
        </div>
      </div>

      <div className="max-w-2xl glass-panel p-6 space-y-6">
        <div>
          <h3 className="font-label-caps text-primary-container font-bold mb-4 uppercase">User Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-technical-data">
            <div>
              <p className="text-on-surface-variant mb-1">CALLSIGN</p>
              <input type="text" defaultValue="M. CONTROL" className="w-full bg-surface-container border border-border-panel p-2 min-h-[44px] text-primary focus:outline-none" />
            </div>
            <div>
              <p className="text-on-surface-variant mb-1">CLEARANCE LEVEL</p>
              <input type="text" defaultValue="LEVEL 5 ADMIN" disabled className="w-full bg-surface-container-high border border-border-panel p-2 min-h-[44px] text-on-surface-variant opacity-60" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-label-caps text-primary-container font-bold mb-4 uppercase">Avoidance Thresholds</h3>
          <div className="space-y-4 text-xs font-technical-data">
            <div>
              <p className="text-on-surface-variant mb-1">CRITICAL COLLISION PROBABILITY (&gt; X%)</p>
              <input type="text" defaultValue="1.0" className="w-full bg-surface-container border border-border-panel p-2 min-h-[44px] text-primary focus:outline-none" />
            </div>
            <div>
              <p className="text-on-surface-variant mb-1">PROXIMITY WARNING RADIUS (KM)</p>
              <input type="text" defaultValue="5.0" className="w-full bg-surface-container border border-border-panel p-2 min-h-[44px] text-primary focus:outline-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Settings;
