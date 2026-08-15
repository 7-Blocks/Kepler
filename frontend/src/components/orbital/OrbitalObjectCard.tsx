import React from 'react';
import type { OrbitalObject } from '@/types/orbital';
import { deriveObjectCategory, getObjectCategoryCss } from '@/types/objectCategories';
import { deriveOrbitRegime } from '@/types/orbitLayers';
import { MaterialIcon } from '@/components/MaterialIcon';

interface OrbitalObjectCardProps {
  object: OrbitalObject;
  isSelected?: boolean;
  onSelect?: (object: OrbitalObject) => void;
  onFlyTo?: (noradId: string) => void;
}

export const OrbitalObjectCard: React.FC<OrbitalObjectCardProps> = ({
  object,
  isSelected = false,
  onSelect,
  onFlyTo,
}) => {
  const category = deriveObjectCategory({
    name: object.name,
    classification: object.classification,
  });
  const regime = deriveOrbitRegime({
    semimajor_axis: object.semimajorAxis,
    eccentricity: object.eccentricity,
    inclination: object.inclination,
    period: object.orbitalPeriod,
  });

  const altKm = object.semimajorAxis ? Math.round(object.semimajorAxis - 6371) : null;

  return (
    <div
      onClick={() => onSelect?.(object)}
      className={`p-3 rounded border transition-ui cursor-pointer ${
        isSelected
          ? 'bg-surface-container border-primary-container shadow-[0_0_15px_rgba(0,229,255,0.2)]'
          : 'bg-surface-container-low/80 border-border-panel/60 hover:bg-surface-container/60 hover:border-border-panel'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 truncate">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: getObjectCategoryCss(category),
              boxShadow: `0 0 6px ${getObjectCategoryCss(category)}60`,
            }}
          />
          <span className="font-technical-data text-xs font-bold text-on-surface truncate">
            {object.name}
          </span>
        </div>
        <span className="text-[9px] font-label-caps px-1.5 py-0.5 rounded bg-surface-container-high border border-border-panel/40 text-on-surface-variant font-semibold">
          {regime}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-border-panel/30 text-[10px] font-technical-data">
        <div>
          <span className="text-on-surface-variant/70 block">NORAD</span>
          <span className="text-on-surface font-semibold">{object.noradId}</span>
        </div>
        <div>
          <span className="text-on-surface-variant/70 block">ALTITUDE</span>
          <span className="text-on-surface font-semibold">{altKm != null ? `${altKm.toLocaleString()} km` : '—'}</span>
        </div>
        <div>
          <span className="text-on-surface-variant/70 block">INCLINATION</span>
          <span className="text-on-surface font-semibold">{object.inclination != null ? `${object.inclination.toFixed(1)}°` : '—'}</span>
        </div>
      </div>

      {onFlyTo && (
        <div className="mt-2 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFlyTo(object.noradId);
            }}
            className="flex items-center gap-1 text-[9px] font-label-caps text-primary hover:text-primary-container transition-ui"
          >
            <MaterialIcon name="gps_fixed" className="text-xs" />
            TRACK
          </button>
        </div>
      )}
    </div>
  );
};
