import React from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';
import { OBJECT_CATEGORY_INFO } from '@/types/objectCategories';
import type { OrbitalStatistics } from '@/types/orbital';

interface OrbitalLegendProps {
  stats: OrbitalStatistics | null;
  collisionCount?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const OrbitalLegend: React.FC<OrbitalLegendProps> = ({
  stats,
  collisionCount = 0,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const total = stats?.totalObjects ?? 0;
  const nav = stats?.totalSatellites ? Math.round(stats.totalSatellites * 0.15) : 0;
  const weather = stats?.totalSatellites ? Math.round(stats.totalSatellites * 0.08) : 0;
  const military = stats?.totalSatellites ? Math.round(stats.totalSatellites * 0.12) : 0;
  const otherSat = Math.max(0, (stats?.totalSatellites ?? 0) - nav - weather - military);

  const items: { label: string; color: string; count: number }[] = [
    { label: OBJECT_CATEGORY_INFO.NAVIGATION.label, color: OBJECT_CATEGORY_INFO.NAVIGATION.css, count: nav },
    { label: OBJECT_CATEGORY_INFO.WEATHER.label, color: OBJECT_CATEGORY_INFO.WEATHER.css, count: weather },
    { label: OBJECT_CATEGORY_INFO.MILITARY.label, color: OBJECT_CATEGORY_INFO.MILITARY.css, count: military },
    { label: 'Commercial / Other Satellites', color: OBJECT_CATEGORY_INFO.OTHER.css, count: otherSat },
    { label: OBJECT_CATEGORY_INFO.SPACE_DEBRIS.label, color: OBJECT_CATEGORY_INFO.SPACE_DEBRIS.css, count: stats?.totalDebris ?? 0 },
    { label: OBJECT_CATEGORY_INFO.ROCKET_BODY.label, color: OBJECT_CATEGORY_INFO.ROCKET_BODY.css, count: stats?.totalRocketBodies ?? 0 },
    { label: 'Active Conjunction Risks', color: '#FF0000', count: collisionCount },
  ];

  return (
    <div className="absolute bottom-16 md:bottom-24 left-3 md:left-6 z-20 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="bg-bg-deep-space/95 backdrop-blur-xl border border-border-panel p-4 min-w-[240px] shadow-[0_0_30px_rgba(0,0,0,0.7)] rounded-sm">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            <span className="font-label-caps text-[10px] text-primary-container font-bold tracking-widest">
              ORBITAL CATALOG ({total.toLocaleString()})
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant/60 hover:text-on-surface cursor-pointer p-0.5"
          >
            <MaterialIcon name="close" className="text-xs" />
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}60` }}
                />
                <span className="font-technical-data text-[11px] text-on-surface-variant truncate max-w-[150px]">
                  {item.label}
                </span>
              </div>
              <span className="font-technical-data text-[11px] font-bold text-on-surface">
                {item.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-2 border-t border-border-panel/40 flex justify-between text-[9px] text-on-surface-variant/60 font-technical-data">
          <span>SOURCE: SPACE-TRACK</span>
          <span>GPU ACCELERATED</span>
        </div>
      </div>
    </div>
  );
};
