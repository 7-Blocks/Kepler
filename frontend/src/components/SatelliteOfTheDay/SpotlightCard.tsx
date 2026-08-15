import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MagicCard } from '@/components/ui/magic-card';
import { MaterialIcon } from '@/components/MaterialIcon';
import { api, type SpaceObject } from '@/services/api';
import { useSatelliteOfTheDay } from '@/hooks/useSatelliteOfTheDay';
import type { SatelliteStatus } from '@/constants/spotlightSatellites';
import { orbitalDataService } from '@/services/orbitalDataService';
import { toSpaceObject } from '@/types/orbital';

const EARTH_RADIUS_KM = 6371;

interface OrbitSummary {
  orbitType: 'LEO' | 'MEO' | 'GEO' | 'HEO';
  altitudeKm: number;
  inclinationDeg: number;
  periodMin: number;
}

/** Classifies orbit regime from semimajor axis, mirroring common LEO/MEO/GEO/HEO bands. */
function summarizeOrbit(obj: SpaceObject): OrbitSummary | null {
  if (obj.semimajor_axis == null || obj.inclination == null || obj.period == null) return null;
  const altitudeKm = obj.semimajor_axis - EARTH_RADIUS_KM;

  let orbitType: OrbitSummary['orbitType'] = 'LEO';
  if (altitudeKm > 2000 && altitudeKm < 35000) orbitType = 'MEO';
  else if (altitudeKm >= 35000 && altitudeKm <= 36500) orbitType = 'GEO';
  else if (altitudeKm > 36500) orbitType = 'HEO';

  return {
    orbitType,
    altitudeKm: Math.round(altitudeKm),
    inclinationDeg: Math.round(obj.inclination * 10) / 10,
    periodMin: Math.round(obj.period),
  };
}

const statusColor: Record<SatelliteStatus, string> = {
  Active: 'text-status-success border-status-success',
  Inactive: 'text-status-warning border-status-warning',
  Retired: 'text-on-surface-variant border-border-panel',
};

const CardSkeleton = () => (
  <div className="p-4 space-y-3 animate-pulse">
    <div className="h-5 bg-surface-container-high rounded w-2/3" />
    <div className="h-3 bg-surface-container-high rounded w-full" />
    <div className="h-3 bg-surface-container-high rounded w-5/6" />
    <div className="grid grid-cols-2 gap-2 pt-2">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="h-10 bg-surface-container-high rounded" />
      ))}
    </div>
  </div>
);

interface SpotlightCardProps {
  /** Called with the real NORAD catalog number when "View on Globe" is clicked. */
  onViewOnGlobe: (catalogNumber: string) => void;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({ onViewOnGlobe }) => {
  const { satellite, isManualPick, showAnother, resetToToday } = useSatelliteOfTheDay();

  const liveQuery = useQuery({
    queryKey: ['catalog', 'byNorad', satellite.catalog_number],
    queryFn: () => api.getCatalogObjectByNorad(satellite.catalog_number),
    retry: false,
  });

  const orbitalFallback = orbitalDataService.getOrbitalObjectById(satellite.catalog_number);
  const liveObject = liveQuery.data?.data ?? (orbitalFallback ? toSpaceObject(orbitalFallback) : null);
  const orbit = liveObject ? summarizeOrbit(liveObject) : null;
  const canViewOnGlobe = orbit !== null || Boolean(orbitalFallback);

  return (
    <MagicCard
      className="border border-border-panel rounded-xl overflow-hidden"
      fillClassName="bg-surface-container/60"
      gradientFrom="#00e5ff"
      gradientTo="#0088ff"
    >
      <div className="p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-1.5 font-label-caps text-[10px] text-primary-container">
            <MaterialIcon name="stars" className="text-sm" />
            SATELLITE OF THE DAY
          </span>
          <button
            onClick={isManualPick ? resetToToday : showAnother}
            className="px-3 py-1 border border-border-panel font-label-caps text-[10px] hover:bg-surface-container-high/50 cursor-pointer rounded"
          >
            {isManualPick ? "TODAY'S PICK" : 'SHOW ANOTHER'}
          </button>
        </div>

        {liveQuery.isLoading ? (
          <CardSkeleton />
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-surface-container-high flex items-center justify-center">
                {satellite.image ? (
                  <img
                    src={satellite.image}
                    alt={satellite.name}
                    className="w-full h-full object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <MaterialIcon name="satellite_alt" className="text-4xl text-primary-container/40" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-display-lg text-lg text-on-surface truncate">{satellite.name}</h3>
                  <span className={`px-2 py-0.5 border rounded font-label-caps text-[9px] ${statusColor[satellite.status]}`}>
                    {satellite.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant mb-2">
                  {satellite.operator} &middot; launched {new Date(satellite.launch_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-[12px] text-on-surface-variant leading-relaxed">
                  {satellite.mission_summary}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              <div className="glass-panel p-2 rounded-md">
                <div className="font-label-caps text-[9px] text-on-surface-variant">ORBIT</div>
                <div className="font-technical-data text-[13px] text-primary-container">{orbit?.orbitType ?? '\u2014'}</div>
              </div>
              <div className="glass-panel p-2 rounded-md">
                <div className="font-label-caps text-[9px] text-on-surface-variant">ALTITUDE</div>
                <div className="font-technical-data text-[13px] text-primary-container">{orbit ? `${orbit.altitudeKm.toLocaleString()} km` : '\u2014'}</div>
              </div>
              <div className="glass-panel p-2 rounded-md">
                <div className="font-label-caps text-[9px] text-on-surface-variant">INCLINATION</div>
                <div className="font-technical-data text-[13px] text-primary-container">{orbit ? `${orbit.inclinationDeg}\u00b0` : '\u2014'}</div>
              </div>
              <div className="glass-panel p-2 rounded-md">
                <div className="font-label-caps text-[9px] text-on-surface-variant">PERIOD</div>
                <div className="font-technical-data text-[13px] text-primary-container">{orbit ? `${orbit.periodMin} min` : '\u2014'}</div>
              </div>
            </div>

            {!canViewOnGlobe && !liveQuery.isLoading && (
              <p className="text-[10px] text-status-warning mt-2">
                Live orbital data isn't currently available for this object, it may have re-entered or dropped out of the tracked catalog.
              </p>
            )}

            {satellite.facts.length > 0 && (
              <ul className="mt-3 space-y-1">
                {satellite.facts.map((fact, i) => (
                  <li key={i} className="flex gap-1.5 text-[11px] text-on-surface-variant">
                    <MaterialIcon name="auto_awesome" className="text-[12px] text-primary-container/60 mt-0.5" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={() => canViewOnGlobe && onViewOnGlobe(satellite.catalog_number)}
              disabled={!canViewOnGlobe}
              className="mt-4 w-full px-3 py-2 border border-primary-container/40 text-primary-container font-label-caps text-[11px] rounded-md hover:bg-primary-container/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
            >
              <MaterialIcon name="public" className="text-sm" />
              VIEW ON GLOBE
            </button>
          </>
        )}
      </div>
    </MagicCard>
  );
};

export default SpotlightCard;