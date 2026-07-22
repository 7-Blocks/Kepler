import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useCollisions, useUpdateCollisionStatus, useCollisionEvaluate, useAgentRuns } from '@/hooks/useApi';
import type { Collision } from '@/services/api';


function riskBorderColor(level: string) {
  switch (level) {
    case 'CRITICAL': case 'HIGH': return 'border-l-status-emergency';
    case 'MEDIUM':   return 'border-l-status-warning';
    default:         return 'border-l-primary-container';
  }
}

function riskTextColor(level: string) {
  switch (level) {
    case 'CRITICAL': case 'HIGH': return 'text-status-emergency';
    case 'MEDIUM':   return 'text-status-warning';
    default:         return 'text-primary-container';
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'PENDING':   return 'bg-status-emergency text-white animate-pulse';
    case 'ASSESSED':  return 'bg-status-warning text-black';
    case 'MITIGATED': return 'bg-status-success text-black';
    default:          return 'bg-surface-variant text-on-surface';
  }
}

function formatTCA(tca: string | null) {
  if (!tca) return '—';
  return new Date(tca).toUTCString().substring(0, 25);
}

function formatMissDist(m: number) {
  if (m < 1000) return `${m.toFixed(0)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}


export const CollisionCenter: React.FC = () => {
  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [riskFilter, setRiskFilter]   = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const collisionsQ  = useCollisions({
    size: 50,
    risk_level: riskFilter || undefined,
    status: statusFilter || undefined,
  });
  const updateStatus = useUpdateCollisionStatus();
  const evaluate     = useCollisionEvaluate();
  const agentRuns    = useAgentRuns({ size: 3 });

  const conjunctions: Collision[] = collisionsQ.data?.data ?? [];
  const critical = conjunctions.filter(c => c.risk_level === 'CRITICAL' || c.risk_level === 'HIGH').length;
  const warnings  = conjunctions.filter(c => c.risk_level === 'MEDIUM').length;

  const selected = conjunctions.find(c => c.id === selectedId) ?? conjunctions[0] ?? null;
  const latestRun = agentRuns.data?.data?.[0];

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-y-auto h-full custom-scrollbar technical-grid">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-headline-lg text-lg md:text-headline-lg text-primary tracking-tight font-bold">
            COLLISION CENTER
          </h2>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {collisionsQ.isLoading ? (
              <div className="h-5 w-40 bg-surface-container-high rounded animate-pulse" />
            ) : conjunctions.length === 0 ? (
              <span className="bg-status-success/10 border border-status-success text-status-success px-3 py-0.5 font-label-caps text-label-caps">
                ✓ NO ACTIVE CONJUNCTION RISKS
              </span>
            ) : (
              <>
                {critical > 0 && (
                  <span className="bg-status-emergency/10 border border-status-emergency text-status-emergency px-3 py-0.5 font-label-caps text-label-caps animate-pulse">
                    {critical} CRITICAL / HIGH
                  </span>
                )}
                {warnings > 0 && (
                  <span className="bg-status-warning/10 border border-status-warning text-status-warning px-3 py-0.5 font-label-caps text-label-caps">
                    {warnings} MEDIUM
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Filters */}
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="bg-surface-container border border-border-panel text-primary font-technical-data text-xs px-3 py-2 focus:outline-none focus:border-primary-container cursor-pointer min-h-[44px]"
          >
            <option value="">ALL RISK LEVELS</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-surface-container border border-border-panel text-primary font-technical-data text-xs px-3 py-2 focus:outline-none focus:border-primary-container cursor-pointer min-h-[44px]"
          >
            <option value="">ALL STATUSES</option>
            <option value="PENDING">PENDING</option>
            <option value="ASSESSED">ASSESSED</option>
            <option value="MITIGATED">MITIGATED</option>
            <option value="IGNORED">IGNORED</option>
          </select>
          <button
            onClick={() => evaluate.mutate()}
            disabled={evaluate.isPending}
            className="bg-primary-container text-on-primary font-label-caps text-label-caps px-4 md:px-6 py-2.5 border-b-2 border-primary hover:brightness-110 transition-ui flex items-center gap-2 font-bold cursor-pointer drop-shadow-[0_0_10px_rgba(0,229,255,0.4)] disabled:opacity-50 min-h-[44px]"
          >
            <MaterialIcon name={evaluate.isPending ? 'sync' : 'bolt'} className={`text-sm ${evaluate.isPending ? 'animate-spin' : ''}`} />
            {evaluate.isPending ? 'SCANNING…' : 'RUN CONJUNCTION SCAN'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">

        {/* Conjunction Table — 8 cols */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest/90 backdrop-blur-xl border border-border-panel p-4 min-w-0">
          <div className="flex justify-between items-center mb-4">
            <div className="font-label-caps text-label-caps text-primary-container font-bold tracking-wider">
              PROBABILITY MATRIX
            </div>
            {collisionsQ.isFetching && (
              <span className="font-technical-data text-[9px] text-primary/50 animate-pulse flex items-center gap-1">
                <MaterialIcon name="sync" className="text-xs animate-spin" /> UPDATING
              </span>
            )}
          </div>

          {collisionsQ.isError ? (
            <div className="py-8 text-center text-status-emergency font-technical-data text-sm">
              ⚠ Failed to load conjunction data. Ensure backend is running.
            </div>
          ) : collisionsQ.isLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-surface-container-high rounded animate-pulse" />
              ))}
            </div>
          ) : conjunctions.length === 0 ? (
            <div className="py-12 text-center">
              <MaterialIcon name="verified_user" className="text-status-success text-5xl mb-3" />
              <p className="font-technical-data text-status-success font-bold text-sm">
                NO ACTIVE CONJUNCTION RISKS DETECTED
              </p>
              <p className="font-technical-data text-on-surface-variant text-[11px] mt-2">
                Orbital catalog is clear. Run a conjunction scan to check for new threats.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left font-technical-data border-collapse">
                <thead className="border-b border-border-panel text-[10px] text-on-surface-variant uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Object A</th>
                    <th className="py-2.5 px-3">Object B</th>
                    <th className="py-2.5 px-3">Prob (%)</th>
                    <th className="py-2.5 px-3">TCA (UTC)</th>
                    <th className="py-2.5 px-3">Miss Dist.</th>
                    <th className="py-2.5 px-3">Rel Vel.</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3" />
                  </tr>
                </thead>
                <tbody className="text-technical-data divide-y divide-border-panel/30">
                  {conjunctions.map(conj => {
                    const isSelected = conj.id === selected?.id;
                    return (
                      <tr
                        key={conj.id}
                        onClick={() => setSelectedId(conj.id)}
                        className={`hover:bg-surface-variant/40 transition-ui cursor-pointer ${isSelected ? 'bg-status-emergency/5' : ''}`}
                      >
                        <td className="py-3 px-3 font-semibold text-on-surface text-xs">{conj.object_a?.name ?? '—'}</td>
                        <td className="py-3 px-3 text-on-surface-variant text-xs">{conj.object_b?.name ?? '—'}</td>
                        <td className={`py-3 px-3 font-bold text-xs ${riskTextColor(conj.risk_level)}`}>
                          {(conj.probability * 100).toFixed(3)}%
                        </td>
                        <td className="py-3 px-3 text-[10px] text-on-surface-variant">{formatTCA(conj.tca)}</td>
                        <td className="py-3 px-3 text-[10px] text-on-surface">{formatMissDist(conj.miss_distance_m)}</td>
                        <td className="py-3 px-3 text-[10px] text-on-surface-variant">{conj.relative_velocity_kms.toFixed(1)} km/s</td>
                        <td className="py-3 px-3">
                          <span className={`text-[9px] px-2 py-0.5 font-bold rounded-sm ${statusBadge(conj.status)}`}>
                            {conj.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex gap-1">
                            <button
                              onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: conj.id, status: 'MITIGATED' }); }}
                              disabled={conj.status === 'MITIGATED' || updateStatus.isPending}
                              title="Mark as Mitigated"
                              className="p-1 hover:bg-status-success/20 text-status-success disabled:opacity-30 cursor-pointer"
                            >
                              <MaterialIcon name="check" className="text-xs" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: conj.id, status: 'IGNORED' }); }}
                              disabled={conj.status === 'IGNORED' || updateStatus.isPending}
                              title="Ignore"
                              className="p-1 hover:bg-surface-variant/50 text-on-surface-variant disabled:opacity-30 cursor-pointer"
                            >
                              <MaterialIcon name="close" className="text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Conjunction Detail — 4 cols */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest/90 backdrop-blur-xl border border-border-panel p-4 flex flex-col justify-between">
          {selected ? (
            <>
              <div>
                <div className="font-label-caps text-label-caps text-primary-container font-bold tracking-wider mb-1">
                  CONJUNCTION ANALYSIS [ID: {selected.id}]
                </div>
                <p className="text-[10px] text-on-surface-variant font-technical-data uppercase">
                  {selected.risk_level} RISK — {selected.status}
                </p>
              </div>

              {/* Wireframe viz */}
              <div className="h-48 bg-black/60 border border-border-panel relative flex items-center justify-center overflow-hidden my-4">
                <div className="absolute top-2 left-2 text-[9px] font-technical-data text-on-surface-variant uppercase">
                  ORBITAL GEOMETRY
                </div>
                <div className="relative w-full h-full flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    className={`absolute w-32 h-32 border border-dashed ${riskBorderColor(selected.risk_level)}/30 rounded-full`}
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    className="absolute w-44 h-24 border border-dashed border-primary-container/20 rounded-full"
                  />
                  <div className="z-10 flex flex-col items-center justify-between h-28">
                    <div className="w-9 h-9 border border-primary-container bg-primary-container/10 flex items-center justify-center transform rotate-45">
                      <MaterialIcon name="satellite_alt" className="text-primary-container text-sm transform -rotate-45" />
                    </div>
                    <div className={`w-7 h-7 border ${riskTextColor(selected.risk_level).replace('text-','border-')} bg-status-emergency/10 flex items-center justify-center`}>
                      <MaterialIcon name="delete_sweep" className={`${riskTextColor(selected.risk_level)} text-xs`} />
                    </div>
                  </div>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line stroke="#FF3B30" strokeDasharray="3 3" strokeWidth="1" x1="50%" x2="50%" y1="28%" y2="72%" />
                    <text fill="#FF3B30" fontFamily="monospace" fontSize="10" x="53%" y="50%" className="animate-pulse font-bold">
                      {formatMissDist(selected.miss_distance_m)}
                    </text>
                  </svg>
                </div>
              </div>

              <div className="space-y-3 font-technical-data">
                {[
                  ['OBJECT A', selected.object_a?.name ?? '—'],
                  ['OBJECT B', selected.object_b?.name ?? '—'],
                  ['MAX PROBABILITY', `${(selected.probability * 100).toFixed(4)}%`],
                  ['MISS DISTANCE', formatMissDist(selected.miss_distance_m)],
                  ['RELATIVE VEL.', `${selected.relative_velocity_kms.toFixed(2)} km/s`],
                  ['TCA', formatTCA(selected.tca)],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center border-b border-border-panel/40 pb-2">
                    <span className="text-[10px] text-on-surface-variant font-medium">{label}</span>
                    <span className={`font-bold text-xs ${label === 'MAX PROBABILITY' ? `${riskTextColor(selected.risk_level)} animate-pulse` : 'text-primary'}`}>{val}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => updateStatus.mutate({ id: selected.id, status: 'ASSESSED' })}
                  disabled={updateStatus.isPending}
                  className="flex-1 text-[10px] font-bold text-bg-deep-space bg-primary-container px-4 py-2 hover:bg-primary-fixed-dim transition-ui cursor-pointer disabled:opacity-50"
                >
                  MARK ASSESSED
                </button>
                <button
                  onClick={() => updateStatus.mutate({ id: selected.id, status: 'MITIGATED' })}
                  disabled={updateStatus.isPending}
                  className="flex-1 text-[10px] font-bold text-primary-container border border-primary-container px-4 py-2 hover:bg-primary-container/10 transition-ui cursor-pointer disabled:opacity-50"
                >
                  MARK MITIGATED
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <MaterialIcon name="verified_user" className="text-primary/20 text-5xl" />
              <p className="font-technical-data text-on-surface-variant text-sm">
                No conjunction selected.
              </p>
            </div>
          )}
        </div>

        {/* AI Mitigation Planner — full width bottom */}
        <div className="col-span-12 bg-surface-container-lowest/90 backdrop-blur-xl border border-border-panel p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="font-label-caps text-label-caps text-primary-container font-bold tracking-wider">
              AI MITIGATION PLANNER
            </div>
            {agentRuns.isFetching && (
              <span className="font-technical-data text-[9px] text-primary/50 animate-pulse">UPDATING</span>
            )}
          </div>

          {agentRuns.isLoading ? (
            <div className="h-24 bg-surface-container-high rounded animate-pulse" />
          ) : !latestRun ? (
            <div className="p-4 bg-surface-container-high/50 border-l-2 border-border-panel font-technical-data">
              <p className="text-[11px] text-on-surface-variant">
                No AI agent runs on record. Agents activate automatically when collision risks are detected, or trigger a scan manually.
              </p>
              {selected && (
                <button
                  onClick={() => (latestRun ? null : null)}
                  className="mt-3 text-[10px] font-bold text-primary-container border border-primary-container px-4 py-1.5 hover:bg-primary-container/10 transition-ui cursor-pointer"
                >
                  TRIGGER AGENT FOR CONJUNCTION {selected.id}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {latestRun.decisions?.slice(-3).map((d, i) => (
                  <div key={i} className="p-3 bg-surface-container-high/50 border-l-2 border-primary-container">
                    <p className="font-label-caps text-[9px] text-primary-container font-bold mb-1">{d.agent_name}</p>
                    <p className="text-[11px] text-on-surface font-technical-data leading-relaxed">{d.reasoning}</p>
                    <p className="text-[9px] text-primary/40 mt-1 font-technical-data">
                      {new Date(d.created_at).toISOString().substring(11, 19)}Z
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px] font-technical-data text-on-surface-variant border-t border-border-panel/40 pt-3">
                <span>Workflow: <span className="text-primary">{latestRun.workflow_name}</span></span>
                <span>Status: <span className={latestRun.status === 'COMPLETED' ? 'text-status-success' : latestRun.status === 'RUNNING' ? 'text-primary-container animate-pulse' : 'text-status-emergency'}>{latestRun.status}</span></span>
              </div>
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes dash { to { stroke-dashoffset: -100; } }
      `}</style>
    </div>
  );
};
export default CollisionCenter;
