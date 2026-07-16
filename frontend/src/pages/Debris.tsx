import React, { useState } from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useCatalogObjects, useCatalogStats, useCatalogSync } from '@/hooks/useApi';
import type { SpaceObject } from '@/services/api';

type Classification = 'DEBRIS' | 'ROCKET_BODY';

const CLASSIFICATION_OPTIONS: { value: Classification | ''; label: string }[] = [
  { value: '',            label: 'ALL DEBRIS' },
  { value: 'DEBRIS',      label: 'DEBRIS FRAGMENTS' },
  { value: 'ROCKET_BODY', label: 'ROCKET BODIES' },
];

function altFromSMA(sma: number | null): number {
  if (!sma) return 0;
  return Math.round(sma - 6371);
}

function sizeCategory(alt: number, inc: number | null): string {
  
  if (alt < 500)  return 'SMALL';
  if (alt < 1000) return 'MEDIUM';
  return 'LARGE';
}

function riskFromOrbit(obj: SpaceObject): 'HIGH' | 'MEDIUM' | 'LOW' {
  const alt = altFromSMA(obj.semimajor_axis);
  if (alt < 600)  return 'HIGH';
  if (alt < 1200) return 'MEDIUM';
  return 'LOW';
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

export const Debris: React.FC = () => {
  const [classFilter, setClassFilter] = useState<Classification | ''>('');
  const [searchQuery, setSearchQuery]  = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [page, setPage]                = useState(1);
  const PAGE_SIZE = 30;

  const onSearch = (val: string) => {
    setSearchQuery(val);
    clearTimeout((window as any)._debrisSearchTimer);
    (window as any)._debrisSearchTimer = setTimeout(() => {
      setDebounced(val);
      setPage(1);
    }, 400);
  };

  const catalogQ = useCatalogObjects({
    page,
    size: PAGE_SIZE,
    classification: classFilter || undefined,
    search: debouncedSearch || undefined,
  });

  const statsQ = useCatalogStats();
  const syncM  = useCatalogSync();

  const objects: SpaceObject[] = catalogQ.data?.data ?? [];
  const pagination = catalogQ.data?.pagination;
  const stats = statsQ.data?.data;

  const totalDebris = (stats?.debris ?? 0) + (stats?.rocket_bodies ?? 0);

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-y-auto h-full custom-scrollbar technical-grid">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border-panel pb-4">
        <div>
          <h2 className="font-headline-lg text-lg md:text-headline-lg text-primary tracking-tight font-bold">
            DEBRIS CATALOG
          </h2>
          <p className="text-xs text-on-surface-variant font-technical-data mt-1">
            {statsQ.isLoading
              ? 'Loading catalog statistics…'
              : `TRACKING ${totalDebris.toLocaleString()} DEBRIS & ROCKET BODY OBJECTS — SOURCE: SPACE-TRACK GP API`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => syncM.mutate('analyst')}
            disabled={syncM.isPending}
            className="flex items-center px-4 py-2 border border-border-panel bg-surface-container hover:bg-surface-variant/50 cursor-pointer transition-ui disabled:opacity-50 min-h-[44px]"
          >
            <MaterialIcon name={syncM.isPending ? 'sync' : 'cloud_download'} className={`text-sm mr-2 ${syncM.isPending ? 'animate-spin' : ''}`} />
            <span className="font-label-caps text-label-caps">
              {syncM.isPending ? 'SYNCING…' : 'SYNC ANALYST DEBRIS'}
            </span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'DEBRIS FRAGMENTS', value: stats.debris.toLocaleString(), color: 'text-status-emergency' },
            { label: 'ROCKET BODIES',    value: stats.rocket_bodies.toLocaleString(), color: 'text-status-warning' },
            { label: 'TOTAL OBJECTS',    value: stats.total.toLocaleString(), color: 'text-on-surface' },
            { label: 'LAST SYNC',        value: stats.last_sync ? new Date(stats.last_sync).toLocaleTimeString() : '—', color: 'text-primary-container' },
          ].map(s => (
            <div key={s.label} className="glass-panel p-3">
              <p className="font-label-caps text-[9px] text-on-surface-variant">{s.label}</p>
              <p className={`font-technical-data text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="SEARCH BY NAME OR NORAD ID…"
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            className="w-full bg-surface-container border border-border-panel p-2.5 pl-9 text-xs text-primary font-technical-data focus:outline-none focus:border-primary-container placeholder:text-primary/30"
          />
          <MaterialIcon name="search" className="absolute left-3 top-3.5 text-xs text-primary/50" />
        </div>
        {CLASSIFICATION_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => { setClassFilter(opt.value as Classification | ''); setPage(1); }}
            className={`px-4 py-2 font-label-caps text-label-caps transition-ui cursor-pointer ${
              classFilter === opt.value
                ? 'bg-primary-container text-on-primary'
                : 'border border-border-panel hover:bg-surface-variant/50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden min-w-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-high border-b border-border-panel">
              <tr>
                <th className="table-head">NAME / NORAD ID</th>
                <th className="table-head">TYPE</th>
                <th className="table-head">ALTITUDE</th>
                <th className="table-head">INCLINATION</th>
                <th className="table-head">MEAN MOTION</th>
                <th className="table-head">RISK</th>
                <th className="table-head">EPOCH</th>
              </tr>
            </thead>
            {catalogQ.isLoading ? (
              <TableSkeleton />
            ) : catalogQ.isError ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="p-8 text-center text-status-emergency font-technical-data text-sm">
                    ⚠ Failed to load debris catalog. Ensure the backend is running.
                  </td>
                </tr>
              </tbody>
            ) : objects.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <MaterialIcon name="delete_sweep" className="text-primary/20 text-4xl" />
                      <p className="font-technical-data text-on-surface-variant text-sm">
                        {debouncedSearch ? `No debris matches "${debouncedSearch}"` : 'No debris objects in catalog yet.'}
                      </p>
                      {!debouncedSearch && (
                        <button
                          onClick={() => syncM.mutate('analyst')}
                          disabled={syncM.isPending}
                          className="font-label-caps text-label-caps text-primary-container border border-primary-container px-4 py-1.5 hover:bg-primary-container/10 transition-ui cursor-pointer disabled:opacity-50"
                        >
                          {syncM.isPending ? 'SYNCING FROM SPACE-TRACK…' : 'SYNC ANALYST DEBRIS FROM SPACE-TRACK'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-border-panel">
                {objects.map(obj => {
                  const alt  = altFromSMA(obj.semimajor_axis);
                  const risk = riskFromOrbit(obj);
                  return (
                    <tr key={obj.id} className="hover:bg-primary-container/5 transition-ui">
                      <td>
                        <div className="table-data-technical font-semibold text-on-surface text-sm">{obj.name}</div>
                        <div className="text-[10px] text-on-surface-variant">NORAD: {obj.catalog_number}</div>
                      </td>
                      <td>
                        <span className={`font-label-caps text-[9px] px-2 py-0.5 border ${
                          obj.classification === 'DEBRIS'
                            ? 'border-status-emergency/40 text-status-emergency bg-status-emergency/10'
                            : 'border-status-warning/40 text-status-warning bg-status-warning/10'
                        }`}>
                          {obj.classification === 'ROCKET_BODY' ? 'ROCKET BODY' : obj.classification}
                        </span>
                      </td>
                      <td className="table-data-technical">
                        {alt > 0 ? `${alt.toLocaleString()} km` : '—'}
                      </td>
                      <td className="table-data-technical">
                        {obj.inclination != null ? `${obj.inclination.toFixed(2)}°` : '—'}
                      </td>
                      <td className="table-data-technical">
                        {obj.mean_motion != null ? `${obj.mean_motion.toFixed(4)} rev/day` : '—'}
                      </td>
                      <td>
                        <span className={`text-[9px] px-2 py-0.5 font-bold ${
                          risk === 'HIGH'   ? 'bg-status-emergency text-white' :
                          risk === 'MEDIUM' ? 'bg-status-warning text-black' :
                          'bg-status-success text-black'
                        }`}>
                          {risk}
                        </span>
                      </td>
                      <td className="table-data-technical">
                        {obj.epoch ? new Date(obj.epoch).toISOString().substring(0, 10) : '—'}
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
                className="pn-btn"
              >
                ← PREV
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="pn-btn"
              >
                NEXT →
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
export default Debris;
