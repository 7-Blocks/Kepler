import React from 'react';
import { motion } from 'framer-motion';
import { EarthTwin } from '@/components/EarthTwin';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useSpaceSummary } from '@/hooks/useApi';
import { useCollisions } from '@/hooks/useApi';
import { useAgentRuns } from '@/hooks/useApi';
import { useWeatherStatus } from '@/hooks/useApi';
import type { Collision, AgentDecision } from '@/services/api';


const riskColor = (level: string) => {
  switch (level) {
    case 'CRITICAL': return 'border-l-status-emergency text-status-emergency';
    case 'HIGH':     return 'border-l-status-emergency text-status-emergency';
    case 'MEDIUM':   return 'border-l-status-warning text-status-warning';
    default:         return 'border-l-primary-container text-primary-container';
  }
};

const riskBarColor = (level: string) => {
  switch (level) {
    case 'CRITICAL': case 'HIGH': return 'bg-status-emergency';
    case 'MEDIUM':   return 'bg-status-warning';
    default:         return 'bg-primary-container';
  }
};

const riskBarWidth = (prob: number) => `${Math.min(100, prob * 100 * 10).toFixed(0)}%`;

function formatTCA(tca: string | null): string {
  if (!tca) return '—';
  const diff = (new Date(tca).getTime() - Date.now()) / 1000;
  if (diff < 0) return 'PAST TCA';
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = Math.floor(diff % 60);
  if (h > 0) return `T-MINUS ${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `T-MINUS ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}


const KPISkeleton = () => (
  <div className="glass-panel p-4 h-24 animate-pulse bg-surface-container/40" />
);

const CollisionCardSkeleton = () => (
  <div className="w-72 glass-panel p-4 animate-pulse bg-surface-container/40 h-32" />
);


export const Dashboard: React.FC = () => {
  const summary  = useSpaceSummary();
  const collisions = useCollisions({ size: 5 });
  const agents   = useAgentRuns({ size: 6 });
  const weather  = useWeatherStatus();

  const s = summary.data?.data;
  const w = weather.data?.data;

  const kpis = s
    ? [
        {
          title: 'Tracked Satellites',
          value: s.tracked_satellites.toLocaleString(),
          icon: 'satellite_alt',
          border: 'border-b-primary-container/40',
          text: 'text-on-surface',
        },
        {
          title: 'Debris Objects',
          value: s.debris_objects > 0 ? s.debris_objects.toLocaleString() : '—',
          icon: 'delete_sweep',
          border: 'border-b-on-surface-variant/40',
          text: 'text-on-surface',
        },
        {
          title: 'Active Alerts',
          value: s.active_alerts_count.toLocaleString(),
          icon: 'dangerous',
          border: s.active_alerts_count > 0 ? 'border-b-status-emergency glow-red' : 'border-b-on-surface-variant/40',
          text: s.active_alerts_count > 0 ? 'text-status-emergency' : 'text-on-surface',
        },
        {
          title: 'Pred. Collisions',
          value: s.predicted_collisions_count.toLocaleString(),
          icon: 'cognition',
          border: 'border-b-status-emergency/60',
          text: 'text-on-surface',
        },
        {
          title: 'Space Weather',
          value: s.space_weather_index,
          subValue: w?.overall_severity,
          icon: 'wb_sunny',
          border: 'border-b-status-warning/40',
          text: w?.overall_severity === 'EXTREME' ? 'text-status-emergency' : 'text-status-warning',
        },
        {
          title: 'Agent Runs',
          value: s.active_agents_load > 0 ? s.active_agents_load.toLocaleString() : 'IDLE',
          icon: 'bolt',
          border: 'border-b-status-success/40',
          text: 'text-status-success',
        },
      ]
    : null;

  const conjunctions = collisions.data?.data ?? [];
  const agentRuns    = agents.data?.data ?? [];

  
  const decisions: Array<AgentDecision & { runName: string }> = agentRuns
    .flatMap(run =>
      (run.decisions ?? []).map(d => ({ ...d, runName: run.workflow_name }))
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen">

      {/* 3D Earth Twin Digital Hero */}
      <section className="h-[250px] md:h-[409px] relative border-b border-border-panel bg-bg-deep-space">
        <EarthTwin />
      </section>

      {/* KPI Bento Grid */}
      <section className="p-3 md:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
        {summary.isLoading
          ? Array(6).fill(0).map((_, i) => <KPISkeleton key={i} />)
          : summary.isError
          ? (
            <div className="col-span-6 text-center text-status-emergency font-technical-data text-sm py-4">
              ⚠ Failed to connect to backend — ensure server is running at localhost:8000
            </div>
          )
          : kpis?.map((kpi, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -2 }}
              className={`glass-panel p-4 flex flex-col justify-between h-24 border-b-2 ${kpi.border}`}
            >
              <p className="font-label-caps text-[9px] text-primary/60 uppercase tracking-wider">
                {kpi.title}
              </p>
              <div className="flex justify-between items-end">
                <div className="flex items-baseline gap-1">
                  <span className={`font-headline-lg text-lg md:text-2xl font-bold font-technical-data ${kpi.text}`}>
                    {kpi.value}
                  </span>
                  {kpi.subValue && (
                    <span className="text-[10px] text-status-warning/60 font-technical-data">{kpi.subValue}</span>
                  )}
                </div>
                <MaterialIcon name={kpi.icon} className="text-primary-container/30 text-lg" />
              </div>
            </motion.div>
          ))
        }
      </section>

      {/* Bottom Timeline & Reasoning Stream */}
      <section className="px-3 md:px-6 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 flex-1 min-h-0">

        {/* Left (2/3): Live Collision Timeline */}
        <div className="lg:col-span-2 flex flex-col min-h-0 min-w-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-label-caps text-label-caps text-primary flex items-center gap-2 drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
              <MaterialIcon name="timeline" className="text-sm" />
              LIVE COLLISION TIMELINE
            </h3>
            <div className="flex items-center gap-2">
              {collisions.isFetching && (
                <span className="font-technical-data text-[9px] text-primary/50 animate-pulse">UPDATING…</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
            {collisions.isLoading ? (
              <div className="flex gap-4 min-w-[600px]">
                {[0, 1, 2].map(i => <CollisionCardSkeleton key={i} />)}
              </div>
            ) : conjunctions.length === 0 ? (
              <div className="flex items-center justify-center h-28 glass-panel border-dashed border-2 border-border-panel">
                <div className="text-center">
                  <MaterialIcon name="check_circle" className="text-status-success text-3xl mb-2" />
                  <p className="font-technical-data text-status-success text-sm font-bold">
                    NO ACTIVE CONJUNCTION RISKS DETECTED
                  </p>
                  <p className="font-technical-data text-[10px] text-on-surface-variant mt-1">
                    Orbital catalog is clear — next scan in 10 minutes
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-4 min-w-[600px]">
                {conjunctions.map((conj: Collision) => (
                  <div
                    key={conj.id}
                    className={`w-64 sm:w-72 shrink-0 glass-panel p-4 border-l-4 ${riskColor(conj.risk_level)} relative overflow-hidden group hover:bg-surface-variant/30 transition-all cursor-pointer`}
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <MaterialIcon name="crisis_alert" className={`text-6xl ${riskBarColor(conj.risk_level)}`} />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] text-text-muted mb-1 font-technical-data">
                          {conj.object_a?.name ?? '—'} vs {conj.object_b?.name ?? '—'}
                        </p>
                        <p className="font-bold text-sm text-on-surface font-technical-data">
                          {formatTCA(conj.tca)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold font-technical-data ${riskColor(conj.risk_level).split(' ')[1]}`}>
                          {(conj.probability * 100).toFixed(2)}% PROB
                        </p>
                        <p className="text-[9px] text-text-muted font-label-caps uppercase">{conj.risk_level}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`${riskBarColor(conj.risk_level)} h-full ${conj.risk_level === 'CRITICAL' ? 'animate-pulse' : ''}`}
                          style={{ width: riskBarWidth(conj.probability) }}
                        />
                      </div>
                      <p className="text-[10px] text-primary/80 font-technical-data">
                        MISS DISTANCE: {conj.miss_distance_m < 1000
                          ? `${conj.miss_distance_m.toFixed(0)}m`
                          : `${(conj.miss_distance_m / 1000).toFixed(2)} KM`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right (1/3): AI Agent Reasoning Stream */}
        <div className="flex flex-col min-h-0">
          <h3 className="font-label-caps text-label-caps text-primary flex items-center gap-2 mb-3 drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
            <MaterialIcon name="psychology" className="text-sm" />
            AI REASONING STREAM
          </h3>
          <div className="flex-1 glass-panel p-3.5 font-technical-data text-[11px] overflow-y-auto space-y-3.5 custom-scrollbar">
            {agents.isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="border-l-2 border-border-panel pl-3 py-2 animate-pulse">
                    <div className="h-3 bg-surface-container-high rounded w-1/3 mb-2" />
                    <div className="h-2 bg-surface-container-high rounded w-full" />
                  </div>
                ))}
              </div>
            ) : decisions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                <MaterialIcon name="smart_toy" className="text-primary/30 text-3xl" />
                <p className="text-on-surface-variant text-[11px]">
                  No agent runs active.
                </p>
                <p className="text-primary/40 text-[10px]">
                  Agents activate automatically when conjunctions are detected.
                </p>
              </div>
            ) : (
              decisions.map((d, i) => (
                <div
                  key={d.id ?? i}
                  className={`border-l-2 pl-3 py-1 ${
                    d.agent_name?.toLowerCase().includes('risk')
                      ? 'border-status-emergency bg-status-emergency/5'
                      : d.agent_name?.toLowerCase().includes('watch') || d.agent_name?.toLowerCase().includes('weather')
                      ? 'border-status-warning bg-status-warning/5'
                      : 'border-primary-container bg-primary-container/5'
                  }`}
                >
                  <span className={`font-bold uppercase block mb-1 ${
                    d.agent_name?.toLowerCase().includes('risk')
                      ? 'text-status-emergency'
                      : d.agent_name?.toLowerCase().includes('watch')
                      ? 'text-status-warning'
                      : 'text-primary-container'
                  }`}>
                    {d.agent_name}
                  </span>
                  <span className="text-on-surface-variant">{d.reasoning}</span>
                  <span className="text-primary/40 block mt-1">
                    {new Date(d.created_at).toISOString().replace('T', ' ').substring(0, 19)}Z
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </section>
    </div>
  );
};
export default Dashboard;
