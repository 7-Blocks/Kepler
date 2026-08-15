import React from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { OrbitalObject } from '@/types/orbital';
import { deriveObjectCategory, OBJECT_CATEGORY_INFO, getObjectCategoryCss } from '@/types/objectCategories';
import { deriveOrbitRegime } from '@/types/orbitLayers';
import { calculateOrbitalVelocity } from '@/services/orbitalPositionService';

interface OrbitalObjectDetailsProps {
  object: OrbitalObject | null;
  isOpen: boolean;
  onClose: () => void;
  onFlyTo?: (noradId: string) => void;
}

export const OrbitalObjectDetails: React.FC<OrbitalObjectDetailsProps> = ({
  object,
  isOpen,
  onClose,
  onFlyTo,
}) => {
  if (!isOpen || !object) return null;

  const category = deriveObjectCategory({
    name: object.name,
    classification: object.classification,
  });
  const categoryInfo = OBJECT_CATEGORY_INFO[category] || OBJECT_CATEGORY_INFO.OTHER;
  const regime = deriveOrbitRegime({
    semimajor_axis: object.semimajorAxis,
    eccentricity: object.eccentricity,
    inclination: object.inclination,
    period: object.orbitalPeriod,
  });

  const altKm = object.semimajorAxis ? Math.round(object.semimajorAxis - 6371) : 0;
  const velocity = object.semimajorAxis ? calculateOrbitalVelocity(object.semimajorAxis, altKm) : 7.5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-bg-deep-space border border-border-panel/80 shadow-[0_0_50px_rgba(0,0,0,0.9)] rounded-lg w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-on-surface">
        {/* Header */}
        <div className="p-4 border-b border-border-panel flex items-center justify-between bg-surface-container/40">
          <div className="flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{
                backgroundColor: getObjectCategoryCss(category),
                boxShadow: `0 0 10px ${getObjectCategoryCss(category)}80`,
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-base md:text-lg font-bold text-primary tracking-tight">
                  {object.name}
                </h3>
                <span className="text-[10px] font-label-caps px-2 py-0.5 rounded bg-surface-container-high border border-border-panel/60 text-on-surface-variant font-semibold">
                  {regime}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-technical-data mt-0.5">
                NORAD CATALOG ID: <span className="text-primary font-bold">{object.noradId}</span> · {categoryInfo.label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40 rounded transition-ui cursor-pointer"
            aria-label="Close details"
          >
            <MaterialIcon name="close" className="text-base" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 space-y-5 overflow-y-auto custom-scrollbar font-technical-data">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="glass-panel p-3 border-l-2 border-l-primary-container">
              <span className="text-[9px] text-on-surface-variant uppercase">ALTITUDE</span>
              <p className="text-sm font-bold text-primary mt-0.5">
                {altKm.toLocaleString()} <span className="text-[10px] font-normal">km</span>
              </p>
            </div>
            <div className="glass-panel p-3 border-l-2 border-l-status-success">
              <span className="text-[9px] text-on-surface-variant uppercase">VELOCITY</span>
              <p className="text-sm font-bold text-status-success mt-0.5">
                {velocity.toFixed(2)} <span className="text-[10px] font-normal">km/s</span>
              </p>
            </div>
            <div className="glass-panel p-3 border-l-2 border-l-secondary">
              <span className="text-[9px] text-on-surface-variant uppercase">PERIOD</span>
              <p className="text-sm font-bold text-secondary mt-0.5">
                {object.orbitalPeriod?.toFixed(1) ?? '—'} <span className="text-[10px] font-normal">min</span>
              </p>
            </div>
            <div className="glass-panel p-3 border-l-2 border-l-accent">
              <span className="text-[9px] text-on-surface-variant uppercase">INCLINATION</span>
              <p className="text-sm font-bold text-accent mt-0.5">
                {object.inclination?.toFixed(2) ?? '—'}°
              </p>
            </div>
          </div>

          {/* Keplerian Elements Table */}
          <div className="glass-panel p-4 space-y-3">
            <h4 className="font-label-caps text-xs font-bold text-primary-container tracking-wider">
              KEPLERIAN ORBITAL ELEMENTS
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border-panel/30">
                <span className="text-on-surface-variant">Semimajor Axis (a)</span>
                <span className="font-semibold text-on-surface">{object.semimajorAxis?.toFixed(2) ?? '—'} km</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-panel/30">
                <span className="text-on-surface-variant">Eccentricity (e)</span>
                <span className="font-semibold text-on-surface">{object.eccentricity?.toFixed(6) ?? '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-panel/30">
                <span className="text-on-surface-variant">RAAN (Ω)</span>
                <span className="font-semibold text-on-surface">{object.raan?.toFixed(4) ?? '—'}°</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-panel/30">
                <span className="text-on-surface-variant">Argument of Perigee (ω)</span>
                <span className="font-semibold text-on-surface">{object.argumentOfPerigee?.toFixed(4) ?? '—'}°</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-panel/30">
                <span className="text-on-surface-variant">Mean Anomaly (M)</span>
                <span className="font-semibold text-on-surface">{object.meanAnomaly?.toFixed(4) ?? '—'}°</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-panel/30">
                <span className="text-on-surface-variant">Mean Motion (n)</span>
                <span className="font-semibold text-on-surface">{object.meanMotion?.toFixed(6) ?? '—'} rev/day</span>
              </div>
            </div>
          </div>

          {/* Metadata & Origin */}
          <div className="glass-panel p-4 space-y-2 text-xs">
            <h4 className="font-label-caps text-xs font-bold text-primary-container tracking-wider">
              ORIGIN & REGISTRATION
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div>
                <span className="text-on-surface-variant text-[10px] block">COUNTRY / OPERATOR</span>
                <span className="font-semibold text-on-surface">{object.country ?? 'INTERNATIONAL'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[10px] block">OPERATIONAL STATUS</span>
                <span className={`font-semibold ${object.status === 'ACTIVE' ? 'text-status-success' : 'text-on-surface-variant'}`}>
                  {object.status}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[10px] block">DATA SOURCE</span>
                <span className="font-semibold text-on-surface">{object.source}</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[10px] block">EPOCH TIMESTAMP</span>
                <span className="font-semibold text-on-surface">{object.epoch ? new Date(object.epoch).toUTCString().substring(0, 22) : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-border-panel flex items-center justify-between bg-surface-container/40">
          <span className="text-[10px] text-on-surface-variant/60 font-technical-data">
            Synced via CelesTrak / Space-Track GP API
          </span>
          <div className="flex items-center gap-2">
            {onFlyTo && (
              <button
                onClick={() => {
                  onFlyTo(object.noradId);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-container text-on-primary font-label-caps text-xs font-bold hover:bg-primary transition-ui cursor-pointer rounded-sm"
              >
                <MaterialIcon name="gps_fixed" className="text-sm" />
                VIEW ON GLOBE
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-border-panel text-on-surface-variant hover:text-on-surface font-label-caps text-xs transition-ui cursor-pointer rounded-sm"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
