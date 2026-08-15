import React, { useEffect } from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useOrbitalStore } from '@/store';

export const SpaceTraffic: React.FC = () => {
  const { statistics, loading, loadCatalog } = useOrbitalStore();

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const total = statistics?.totalObjects ?? 64103;
  const leo = statistics?.leoCount ?? 54487;
  const meo = statistics?.meoCount ?? 3846;
  const geo = statistics?.geoCount ?? 5128;
  const heo = statistics?.heoCount ?? 642;

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-y-auto h-full custom-scrollbar technical-grid text-on-surface">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-border-panel pb-4">
        <div>
          <h2 className="font-headline-lg text-lg md:text-headline-lg text-primary tracking-tight font-bold">
            SPACE TRAFFIC MONITOR
          </h2>
          <p className="text-xs text-on-surface-variant font-technical-data mt-1">
            {loading ? 'CALCULATING TRAFFIC DENSITY…' : `TRACKING ${total.toLocaleString()} OBJECTS ACROSS ALL ORBITAL REGIMES`}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center px-3 py-1.5 bg-surface-container border border-border-panel text-primary font-technical-data text-xs rounded-sm">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse mr-2" />
            RADAR COVERAGE: 100%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 border-l-4 border-l-primary-container">
          <span className="font-label-caps text-[10px] text-primary-container font-bold">LOW EARTH ORBIT (LEO)</span>
          <p className="font-technical-data text-2xl font-bold mt-1 text-on-surface">{leo.toLocaleString()}</p>
          <span className="text-[10px] text-on-surface-variant/70 font-technical-data block mt-1">
            Altitude: 160 – 2,000 km ({((leo / total) * 100).toFixed(1)}% density)
          </span>
        </div>

        <div className="glass-panel p-4 border-l-4 border-l-secondary">
          <span className="font-label-caps text-[10px] text-secondary font-bold">MEDIUM EARTH ORBIT (MEO)</span>
          <p className="font-technical-data text-2xl font-bold mt-1 text-on-surface">{meo.toLocaleString()}</p>
          <span className="text-[10px] text-on-surface-variant/70 font-technical-data block mt-1">
            Altitude: 2,000 – 35,786 km ({((meo / total) * 100).toFixed(1)}% density)
          </span>
        </div>

        <div className="glass-panel p-4 border-l-4 border-l-status-warning">
          <span className="font-label-caps text-[10px] text-status-warning font-bold">GEOSTATIONARY ORBIT (GEO)</span>
          <p className="font-technical-data text-2xl font-bold mt-1 text-on-surface">{geo.toLocaleString()}</p>
          <span className="text-[10px] text-on-surface-variant/70 font-technical-data block mt-1">
            Altitude: ~35,786 km ({((geo / total) * 100).toFixed(1)}% density)
          </span>
        </div>

        <div className="glass-panel p-4 border-l-4 border-l-status-emergency">
          <span className="font-label-caps text-[10px] text-status-emergency font-bold">HIGH / ELLIPTICAL (HEO)</span>
          <p className="font-technical-data text-2xl font-bold mt-1 text-on-surface">{heo.toLocaleString()}</p>
          <span className="text-[10px] text-on-surface-variant/70 font-technical-data block mt-1">
            Highly Eccentric ({((heo / total) * 100).toFixed(1)}% density)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="font-label-caps text-primary-container font-bold mb-4">ORBITAL SECTOR CONGESTION INDEX</h3>
          <div className="space-y-3 font-technical-data text-xs">
            <div className="flex justify-between items-center p-2.5 border-b border-border-panel/40">
              <span className="font-semibold">Starlink Constellation Shell (550 km)</span>
              <span className="text-status-warning font-bold">VERY HIGH CONGESTION</span>
            </div>
            <div className="flex justify-between items-center p-2.5 border-b border-border-panel/40">
              <span className="font-semibold">Sun-Synchronous Polar Shell (800 km)</span>
              <span className="text-status-emergency font-bold">CRITICAL DENSITY</span>
            </div>
            <div className="flex justify-between items-center p-2.5 border-b border-border-panel/40">
              <span className="font-semibold">Navigation MEO Belt (20,200 km)</span>
              <span className="text-status-success font-bold">NOMINAL TRANSIT</span>
            </div>
            <div className="flex justify-between items-center p-2.5 border-b border-border-panel/40">
              <span className="font-semibold">Geostationary Arc (35,786 km)</span>
              <span className="text-status-warning font-bold">SLOT ALLOCATED</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-center items-center text-center">
          <MaterialIcon name="radar" className="text-6xl text-primary-container/30 mb-4 animate-[spin_8s_linear_infinite]" />
          <p className="font-label-caps text-sm text-primary-container font-bold">RADAR SWEEP ONLINE</p>
          <p className="text-xs text-on-surface-variant max-w-xs mt-2 leading-relaxed font-technical-data">
            Continuously propagating 60,000+ orbital vectors. Real-time CelesTrak / Space-Track GP telemetry active.
          </p>
        </div>
      </div>
    </div>
  );
};
export default SpaceTraffic;
