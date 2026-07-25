import React from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { CatalogObject } from '@/types/satellite';
import { CATEGORY_COLORS } from '@/lib/satelliteVisuals';

interface SpotlightInfoCardProps {
  object: CatalogObject;
  isCollisionRisk: boolean;
  onClose: () => void;
}

function orbitTypeFromAltitude(altitudeKm: number | null): string {
  if (altitudeKm == null) return '—';
  if (altitudeKm < 2000) return 'LEO';
  if (altitudeKm < 35786) return 'MEO';
  if (altitudeKm < 35886) return 'GEO';
  return 'HEO';
}

/**
 * Small "selected satellite" card: name, NORAD ID, orbit type, altitude,
 * and health/risk status. Rendered while a satellite is locked in via
 * click or keyboard Enter.
 */
export const SpotlightInfoCard: React.FC<SpotlightInfoCardProps> = ({ object, isCollisionRisk, onClose }) => {
  const altitudeKm = object.semimajor_axis != null ? object.semimajor_axis - 6371 : null;
  const colorConfig = isCollisionRisk ? CATEGORY_COLORS.COLLISION : CATEGORY_COLORS[object.classification] ?? CATEGORY_COLORS.UNKNOWN;

  return (
    <div
      role="dialog"
      aria-label={`Selected satellite: ${object.name}`}
      className={`spotlight-info-card ${isCollisionRisk ? 'spotlight-info-card--risk' : ''} bg-bg-deep-space/90 backdrop-blur-xl border p-4 min-w-[240px] max-w-[280px]`}
      style={{
        borderColor: isCollisionRisk ? 'rgba(255,59,48,0.6)' : `${colorConfig.css}4d`,
        boxShadow: `0 0 30px ${isCollisionRisk ? 'rgba(255,59,48,0.25)' : `${colorConfig.css}26`}`,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: colorConfig.css, boxShadow: `0 0 8px ${colorConfig.css}` }}
          />
          <span className="font-technical-data text-xs font-bold text-primary-container truncate">{object.name}</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Clear selection"
          className="text-on-surface-variant/60 hover:text-on-surface cursor-pointer shrink-0"
        >
          <MaterialIcon name="close" className="text-xs" />
        </button>
      </div>

      {isCollisionRisk && (
        <div className="flex items-center gap-1.5 mb-3 bg-status-emergency/15 border border-status-emergency/50 px-2 py-1">
          <MaterialIcon name="warning" className="text-status-emergency text-xs" />
          <span className="font-technical-data text-status-emergency text-[10px] font-bold">CONJUNCTION RISK</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-technical-data text-[10px]">
        <span className="text-on-surface-variant/60">NORAD ID</span>
        <span className="text-on-surface font-semibold">{object.catalog_number}</span>

        <span className="text-on-surface-variant/60">ORBIT TYPE</span>
        <span className="text-on-surface font-semibold">{orbitTypeFromAltitude(altitudeKm)}</span>

        <span className="text-on-surface-variant/60">ALTITUDE</span>
        <span className="text-on-surface font-semibold">{altitudeKm != null ? `${Math.round(altitudeKm).toLocaleString()} km` : '—'}</span>

        <span className="text-on-surface-variant/60">HEALTH / RISK</span>
        <span className={`font-semibold ${isCollisionRisk ? 'text-status-emergency' : 'text-status-success'}`}>
          {isCollisionRisk ? 'AT RISK' : 'NOMINAL'}
        </span>
      </div>

      <div className="mt-3 pt-2 border-t border-primary-container/20 text-[9px] text-primary/50 font-technical-data">
        Double-click to focus camera · Esc to clear
      </div>
    </div>
  );
};

export default SpotlightInfoCard;
