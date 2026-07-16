import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useUIStore } from '@/store/uiStore';
import { useCatalogObjects, useCatalogStats, useCatalogSync, useSatelliteTelemetry } from '@/hooks/useApi';
import type { SpaceObject } from '@/services/api';



function orbitTypeFromSMA(sma: number | null): 'LEO' | 'MEO' | 'GEO' | 'HEO' {
  if (!sma) return 'LEO';
  const alt = sma - 6371; 
  if (alt < 2000)  return 'LEO';
  if (alt < 35000) return 'MEO';
  if (alt < 36000) return 'GEO';
  return 'HEO';
}

function altFromSMA(sma: number | null): number {
  if (!sma) return 0;
  return Math.round(sma - 6371);
}



const TableSkeleton = () => (
  <tbody>
    {Array(8).fill(0).map((_, i) => (
      <tr key={i} className="border-b border-border-panel/30">
        {Array(6).fill(0).map((_, j) => (
          <td key={j} className="p-4">
            <div className="h-3 bg-surface-container-high rounded animate-pulse w-3/4" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);



export const Satellites: React.FC = () => {
  const { selectedSatelliteId, setSelectedSatelliteId } = useUIStore();
  const [searchQuery, setSearchQuery]   = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [activeTab, setActiveTab]       = useState<'STATUS' | 'ORBITAL' | 'TLE'>('STATUS');
  const [page, setPage]                 = useState(1);
  const PAGE_SIZE = 20;

  
  const onSearchChange = (val: string) => {
    setSearchQuery(val);
    clearTimeout((window as any)._satSearchTimer);
    (window as any)._satSearchTimer = setTimeout(() => {
      setDebounced(val);
      setPage(1);
    }, 400);
  };

  const catalogQ = useCatalogObjects({
    page,
    size: PAGE_SIZE,
    classification: 'PAYLOAD',
    search: debouncedSearch || undefined,
  });

  const statsQ   = useCatalogStats();
  const syncM    = useCatalogSync();

  const objects: SpaceObject[] = catalogQ.data?.data ?? [];
  const pagination = catalogQ.data?.pagination;
  const stats = statsQ.data?.data;

  
  const selectedObj = objects.find(o => o.catalog_number === selectedSatelliteId) ?? objects[0] ?? null;
  const selectedId  = selectedObj?.id ?? null;

  
  const telemetryQ  = useSatelliteTelemetry(selectedId);
  const telemetry   = telemetryQ.data?.data ?? [];

  return (
    <div className="flex h-full min-w-0 relative">

      {/* ── Table Section ──────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar min-w-0 ${selectedObj ? 'xl:mr-[420px]' : ''}`}>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-headline-lg text-lg md:text-headline-lg text-on-surface">SATELLITE FLEET</h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {statsQ.isLoading ? (
                <div className="h-5 w-32 bg-surface-container-high rounded animate-pulse" />
              ) : stats ? (
                <>
                  <span className="font-label-caps text-label-caps text-primary bg-primary/10 px-2 py-0.5">
                    TOTAL PAYLOADS: {stats.payloads.toLocaleString()}
                  </span>
                  <span className="font-label-caps text-label-caps text-status-success bg-status-success/10 px-2 py-0.5 border border-status-success/20">
                    DEBRIS: {stats.debris.toLocaleString()}
                  </span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant bg-surface-variant/20 px-2 py-0.5 border border-border-panel">
                    ROCKET BODIES: {stats.rocket_bodies.toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="font-label-caps text-label-caps text-on-surface-variant">Loading catalog…</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => syncM.mutate(undefined)}
              disabled={syncM.isPending}
              className="flex items-center px-4 py-2 border border-border-panel bg-surface-container hover:bg-surface-variant/50 transition-ui cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              <MaterialIcon name={syncM.isPending ? 'sync' : 'cloud_download'} className={`text-sm mr-2 ${syncM.isPending ? 'animate-spin' : ''}`} />
              <span className="font-label-caps text-label-caps">
                {syncM.isPending ? 'SYNCING…' : 'SYNC SPACE-TRACK'}
              </span>
            </button>
            <button className="flex items-center px-4 py-2 bg-primary-container text-on-primary font-label-caps text-label-caps hover:bg-primary transition-ui glow-cyan cursor-pointer min-h-[44px]">
              <MaterialIcon name="filter_alt" className="text-sm mr-2" />
              FILTERS
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="SEARCH BY NAME OR NORAD ID…"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-surface-container border border-border-panel p-2.5 pl-9 text-xs text-primary font-technical-data focus:outline-none focus:border-primary-container placeholder:text-primary/30"
          />
          <MaterialIcon name="search" className="absolute left-3 top-3.5 text-xs text-primary/50" />
          {catalogQ.isFetching && (
            <div className="absolute right-3 top-3">
              <MaterialIcon name="sync" className="text-xs text-primary/40 animate-spin" />
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="glass-panel overflow-hidden min-w-0">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-high border-b border-border-panel">
                <tr>
                  <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">NAME / NORAD ID</th>
                  <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">ORBIT / ALT</th>
                  <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">INCLINATION</th>
                  <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">ECCENTRICITY</th>
                  <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">MEAN MOTION</th>
                  <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">PERIOD</th>
                  <th className="p-4" />
                </tr>
              </thead>
              {catalogQ.isLoading ? (
                <TableSkeleton />
              ) : catalogQ.isError ? (
                <tbody>
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-status-emergency font-technical-data text-sm">
                      ⚠ Failed to load satellite catalog. Ensure the backend is running.
                    </td>
                  </tr>
                </tbody>
              ) : objects.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <MaterialIcon name="satellite_alt" className="text-primary/20 text-4xl" />
                        <p className="font-technical-data text-on-surface-variant text-sm">
                          {debouncedSearch ? `No satellites match "${debouncedSearch}"` : 'No satellites in catalog yet.'}
                        </p>
                        {!debouncedSearch && (
                          <button
                            onClick={() => syncM.mutate(undefined)}
                            disabled={syncM.isPending}
                            className="font-label-caps text-label-caps text-primary-container border border-primary-container px-4 py-1.5 hover:bg-primary-container/10 transition-ui cursor-pointer disabled:opacity-50"
                          >
                            {syncM.isPending ? 'SYNCING FROM SPACE-TRACK…' : 'SYNC FROM SPACE-TRACK NOW'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-border-panel">
                  {objects.map(obj => {
                    const isSelected = obj.catalog_number === selectedSatelliteId;
                    const orbit = orbitTypeFromSMA(obj.semimajor_axis);
                    const alt   = altFromSMA(obj.semimajor_axis);
                    return (
                      <tr
                        key={obj.id}
                        onClick={() => setSelectedSatelliteId(obj.catalog_number)}
                        className={`hover:bg-primary-container/5 transition-ui group cursor-pointer ${
                          isSelected ? 'bg-primary-fixed-dim/5 border-l-2 border-primary-container' : 'opacity-85'
                        }`}
                      >
                        <td className="table-data">
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full mr-3 bg-status-success" />
                            <div>
                              <div className={`font-technical-data text-technical-data font-semibold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                                {obj.name}
                              </div>
                              <div className="text-[10px] text-on-surface-variant">NORAD: {obj.catalog_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="table-data">
                          <span className="font-label-caps text-[10px] px-1.5 py-0.5 border border-border-panel text-on-surface-variant bg-surface-container-low">
                            {orbit}
                          </span>
                          <span className="text-[12px] text-on-surface-variant ml-2">
                            {alt > 0 ? `${alt.toLocaleString()} km` : '—'}
                          </span>
                        </td>
                        <td className="table-data-technical">
                          {obj.inclination != null ? `${obj.inclination.toFixed(2)}°` : '—'}
                        </td>
                        <td className="table-data-technical">
                          {obj.eccentricity != null ? obj.eccentricity.toFixed(6) : '—'}
                        </td>
                        <td className="table-data-technical">
                          {obj.mean_motion != null ? `${obj.mean_motion.toFixed(4)} rev/day` : '—'}
                        </td>
                        <td className="table-data-technical">
                          {obj.period != null ? `${obj.period.toFixed(1)} min` : '—'}
                        </td>
                        <td className="table-data text-right">
                          <MaterialIcon
                            name="arrow_forward_ios"
                            className={`text-on-surface-variant group-hover:text-primary-container transition-ui ${isSelected ? 'text-primary-container translate-x-1' : ''}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-border-panel px-4 py-3">
              <span className="font-technical-data text-[10px] text-on-surface-variant">
                {pagination.total.toLocaleString()} objects · Page {pagination.page} of {pagination.pages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-border-panel font-label-caps text-[10px] hover:bg-surface-variant/50 disabled:opacity-40 cursor-pointer"
                >
                  ← PREV
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-3 py-1 border border-border-panel font-label-caps text-[10px] hover:bg-surface-variant/50 disabled:opacity-40 cursor-pointer"
                >
                  NEXT →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Catalog Stats Bento */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-4">
              <p className="font-label-caps text-label-caps text-on-surface-variant">TOTAL CATALOG OBJECTS</p>
              <h3 className="text-3xl font-headline-lg text-primary mt-2 font-bold font-technical-data">
                {stats.total.toLocaleString()}
              </h3>
              <p className="text-[10px] text-on-surface-variant mt-2 font-technical-data">
                Last synced: {stats.last_sync ? new Date(stats.last_sync).toLocaleTimeString() : '—'}
              </p>
            </div>
            <div className="glass-panel p-4">
              <p className="font-label-caps text-label-caps text-on-surface-variant">DEBRIS + ROCKET BODIES</p>
              <h3 className="text-3xl font-headline-lg text-status-warning mt-2 font-bold font-technical-data">
                {(stats.debris + stats.rocket_bodies).toLocaleString()}
              </h3>
              <div className="mt-2 flex gap-2 flex-wrap">
                <span className="text-[10px] bg-status-warning/20 text-status-warning px-2.5 py-1 border border-status-warning/30">
                  DEBRIS ({stats.debris.toLocaleString()})
                </span>
                <span className="text-[10px] bg-surface-variant px-2.5 py-1 text-on-surface">
                  R/B ({stats.rocket_bodies.toLocaleString()})
                </span>
              </div>
            </div>
            <div className="glass-panel p-4 bg-primary-container text-bg-deep-space">
              <p className="font-label-caps text-label-caps opacity-80 font-bold">SPACE-TRACK LIVE FEED</p>
              <h3 className="text-xl font-headline-lg font-bold mt-2">
                {stats.payloads.toLocaleString()} Active Payloads
              </h3>
              <p className="text-[11px] mt-2 leading-snug opacity-90">
                Source: Space-Track GP API — syncing every 5 minutes.
              </p>
              <button
                onClick={() => syncM.mutate('active')}
                disabled={syncM.isPending}
                className="mt-4 w-full py-1.5 bg-bg-deep-space/10 hover:bg-bg-deep-space/20 transition-ui font-label-caps text-[10px] border border-bg-deep-space/20 font-bold cursor-pointer disabled:opacity-50"
              >
                {syncM.isPending ? 'SYNCING…' : 'FORCE SYNC NOW'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Slide-out Detail Drawer ─────────────────────────────── */}
      <AnimatePresence>
        {selectedObj && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full md:w-[420px] border-l border-border-panel bg-surface-container-lowest/95 backdrop-blur-xl h-full flex flex-col fixed right-0 top-12 bottom-0 z-40 shadow-[-10px_0_30px_rgba(0,0,0,0.6)]"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-border-panel flex justify-between items-center">
              <div>
                <h3 className="font-headline-lg text-xl text-primary-container font-bold tracking-tight">
                  {selectedObj.name}
                </h3>
                <p className="font-label-caps text-[10px] text-on-surface-variant mt-1">
                  NORAD {selectedObj.catalog_number} · {selectedObj.classification}
                </p>
              </div>
              <button
                onClick={() => setSelectedSatelliteId(null)}
                className="text-on-surface-variant hover:text-primary transition-ui cursor-pointer"
              >
                <MaterialIcon name="close" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

              {/* Tabs */}
              <div className="flex border-b border-border-panel">
                {(['STATUS', 'ORBITAL', 'TLE'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-[10px] font-label-caps font-bold transition-ui text-center border-b ${
                      activeTab === tab
                        ? 'text-primary-container border-primary-container'
                        : 'text-on-surface-variant hover:text-on-surface border-transparent'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* STATUS tab */}
              {activeTab === 'STATUS' && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['ORBIT TYPE', orbitTypeFromSMA(selectedObj.semimajor_axis)],
                    ['ALTITUDE', `${altFromSMA(selectedObj.semimajor_axis).toLocaleString()} km`],
                    ['INCLINATION', selectedObj.inclination != null ? `${selectedObj.inclination.toFixed(4)}°` : '—'],
                    ['ECCENTRICITY', selectedObj.eccentricity != null ? selectedObj.eccentricity.toFixed(7) : '—'],
                    ['MEAN MOTION', selectedObj.mean_motion != null ? `${selectedObj.mean_motion.toFixed(4)} rev/day` : '—'],
                    ['PERIOD', selectedObj.period != null ? `${selectedObj.period.toFixed(2)} min` : '—'],
                    ['RAAN', selectedObj.raan != null ? `${selectedObj.raan.toFixed(4)}°` : '—'],
                    ['ARG. OF PERIGEE', selectedObj.arg_of_perigee != null ? `${selectedObj.arg_of_perigee.toFixed(4)}°` : '—'],
                    ['MEAN ANOMALY', selectedObj.mean_anomaly != null ? `${selectedObj.mean_anomaly.toFixed(4)}°` : '—'],
                    ['EPOCH', selectedObj.epoch ? new Date(selectedObj.epoch).toUTCString().substring(0, 22) : '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-surface-container p-2.5 border border-border-panel">
                      <p className="text-[9px] text-on-surface-variant font-label-caps">{label}</p>
                      <p className="text-xs font-bold text-primary-container font-technical-data mt-1">{val}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ORBITAL tab — telemetry */}
              {activeTab === 'ORBITAL' && (
                <div className="space-y-4">
                  {telemetryQ.isLoading ? (
                    <div className="h-32 flex items-center justify-center animate-pulse text-on-surface-variant font-technical-data text-xs">
                      Loading telemetry…
                    </div>
                  ) : telemetry.length === 0 ? (
                    <div className="text-center py-8 text-on-surface-variant font-technical-data text-[11px]">
                      No telemetry records yet for this object.
                    </div>
                  ) : (
                    <>
                      <p className="font-label-caps text-label-caps text-on-surface-variant">TELEMETRY LOG (LAST {telemetry.length} RECORDS)</p>
                      <div className="space-y-2">
                        {telemetry.map((t, i) => (
                          <div key={i} className="flex justify-between items-center border-b border-border-panel/30 pb-2 font-technical-data text-[11px]">
                            <span className="text-on-surface-variant font-mono">
                              {new Date(t.timestamp).toISOString().substring(11, 19)}Z
                            </span>
                            <span className="text-primary">{t.altitude_km.toFixed(1)} km</span>
                            <span className="text-on-surface">{t.velocity_kms.toFixed(2)} km/s</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TLE tab */}
              {activeTab === 'TLE' && (
                <div className="space-y-3">
                  <p className="font-label-caps text-label-caps text-on-surface-variant">TWO-LINE ELEMENT SET</p>
                  {selectedObj.has_tle ? (
                    <div className="bg-black/60 border border-border-panel p-3 font-mono text-[11px] text-status-success space-y-1">
                      <p className="text-on-surface-variant">&gt; TLE available in database</p>
                      <p className="text-primary/40 text-[9px] mt-2">
                        Source: Space-Track GP API · NORAD {selectedObj.catalog_number}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-black/60 border border-border-panel p-3 font-mono text-[11px] text-on-surface-variant">
                      <p>No TLE data in this record.</p>
                      <p className="text-[9px] text-primary/40 mt-1">
                        TLE may not be included in JSON GP format for this object.
                      </p>
                    </div>
                  )}
                  <div className="text-[10px] text-on-surface-variant font-technical-data space-y-1">
                    <p>COSPAR ID: {selectedObj.cospar_id || '—'}</p>
                    <p>Last updated: {selectedObj.updated_at ? new Date(selectedObj.updated_at).toLocaleString() : '—'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-6 border-t border-border-panel bg-surface-container-low grid grid-cols-2 gap-3 mt-auto">
              <button
                onClick={() => window.open('https://www.space-track.org', '_blank')}
                className="py-3 border border-border-panel font-label-caps text-[10px] font-bold hover:bg-surface-variant transition-ui cursor-pointer"
              >
                VIEW ON SPACE-TRACK ↗
              </button>
              <button
                onClick={() => syncM.mutate(undefined)}
                disabled={syncM.isPending}
                className="py-3 bg-primary-container text-on-primary font-label-caps text-[10px] font-bold hover:bg-primary transition-ui glow-cyan cursor-pointer disabled:opacity-50"
              >
                {syncM.isPending ? 'SYNCING…' : 'REFRESH ORBIT DATA'}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

    </div>
  );
};
export default Satellites;
