import React from 'react';
import type { OrbitalObject } from '@/types/orbital';
import { deriveObjectCategory, OBJECT_CATEGORY_INFO, getObjectCategoryCss } from '@/types/objectCategories';

interface OrbitalHoverPanelProps {
  object: OrbitalObject | null;
  position: { x: number; y: number };
  containerBounds?: DOMRect | null;
}

export const OrbitalHoverPanel: React.FC<OrbitalHoverPanelProps> = ({
  object,
  position,
  containerBounds,
}) => {
  if (!object) return null;

  const category = deriveObjectCategory({
    name: object.name,
    classification: object.classification,
  });
  const categoryInfo = OBJECT_CATEGORY_INFO[category] || OBJECT_CATEGORY_INFO.OTHER;

  // Viewport clamping
  const panelWidth = 240;
  const panelHeight = 160;

  const maxX = (containerBounds?.width ?? window.innerWidth) - panelWidth - 16;
  const maxY = (containerBounds?.height ?? window.innerHeight) - panelHeight - 16;

  const left = Math.min(Math.max(16, position.x + 14), Math.max(16, maxX));
  const top = Math.min(Math.max(16, position.y + 14), Math.max(16, maxY));

  const altKm = object.semimajorAxis ? Math.round(object.semimajorAxis - 6371) : null;

  return (
    <div
      className="absolute pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-150"
      style={{ left: `${left}px`, top: `${top}px` }}
    >
      <div className="bg-bg-deep-space/95 backdrop-blur-md border border-border-panel/80 shadow-[0_0_20px_rgba(0,0,0,0.8)] rounded-sm p-3 min-w-[230px]">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border-panel/40 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: getObjectCategoryCss(category),
                boxShadow: `0 0 6px ${getObjectCategoryCss(category)}80`,
              }}
            />
            <span className="font-technical-data text-xs font-bold text-primary-container truncate">
              {object.name}
            </span>
          </div>
          <span className="text-[9px] font-label-caps px-1.5 py-0.5 rounded bg-surface-container border border-border-panel/40 text-on-surface-variant font-semibold">
            {categoryInfo.label.split(' ')[0]}
          </span>
        </div>

        {/* Technical Data Grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-technical-data text-[10px]">
          <span className="text-on-surface-variant/70">NORAD ID</span>
          <span className="text-on-surface font-semibold text-right">{object.noradId}</span>

          <span className="text-on-surface-variant/70">ALTITUDE</span>
          <span className="text-on-surface font-semibold text-right">
            {altKm != null ? `${altKm.toLocaleString()} km` : '—'}
          </span>

          <span className="text-on-surface-variant/70">INCLINATION</span>
          <span className="text-on-surface font-semibold text-right">
            {object.inclination != null ? `${object.inclination.toFixed(2)}°` : '—'}
          </span>

          <span className="text-on-surface-variant/70">ECCENTRICITY</span>
          <span className="text-on-surface font-semibold text-right">
            {object.eccentricity != null ? object.eccentricity.toFixed(5) : '—'}
          </span>

          <span className="text-on-surface-variant/70">MEAN MOTION</span>
          <span className="text-on-surface font-semibold text-right">
            {object.meanMotion != null ? `${object.meanMotion.toFixed(3)} rev/d` : '—'}
          </span>

          <span className="text-on-surface-variant/70">PERIOD</span>
          <span className="text-on-surface font-semibold text-right">
            {object.orbitalPeriod != null ? `${object.orbitalPeriod.toFixed(1)} min` : '—'}
          </span>
        </div>

        {/* Footer info */}
        <div className="mt-2 pt-1.5 border-t border-border-panel/30 flex items-center justify-between text-[8px] text-primary/60 font-technical-data">
          <span>SRC: SPACE-TRACK</span>
          <span className="text-primary-container">CLICK TO LOCK</span>
        </div>
      </div>
    </div>
  );
};
