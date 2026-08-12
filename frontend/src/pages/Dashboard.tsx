import React, { useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EarthTwin, type EarthTwinHandle } from '@/components/EarthTwin';
import { MaterialIcon } from '@/components/MaterialIcon';
import { MagicCard } from '@/components/ui/magic-card';
import { SpotlightCard } from '@/components/SatelliteOfTheDay/SpotlightCard';
import { useSpaceSummary } from '@/hooks/useApi';
import RocketLaunchCountdown from "@/components/RocketLaunchCountdown/RocketLaunchCountdown";
import { useCollisions } from '@/hooks/useApi';
import { useAgentRuns } from '@/hooks/useApi';
import { useWeatherStatus } from '@/hooks/useApi';
import type { Collision, AgentDecision } from '@/services/api';
import { logEvent } from '@/store/logbookStore';

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
  if (!tca) return '\u2014';
  const diff = (new Date(tca).getTime() - Date.now()) / 1000;
  if (diff < 0) return 'PAST TCA';
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = Math.floor(diff % 60);
  if (h > 0) return `T-MINUS ${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `T-MINUS ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const KPISkeleton = () => (
  <div className="glass-panel p-4 h-24 animate-pulse bg-surface-container/40 rounded-xl" />
);

const CollisionCardSkeleton = () => (
  <div className="w-72 glass-panel p-4 animate-pulse bg-surface-container/40 h-32 rounded-xl" />
);

export const Dashboard: React.FC = () => {
  const earthTwinRef = useRef<EarthTwinHandle>(null);
  const summary  = useSpaceSummary();
  const collisions = useCollisions({ size: 5 });
  const agents   = useAgentRuns({ size: 6 });
  const weather  = useWeatherStatus();

  const s = summary.data?.data;
  const w = weather.data?.data;

  const kpis = s
    ? [
        {
          title: 'Active Alerts',
          value: s.active_alerts_count.toLocaleString(),
          icon: 'dangerous',
          gradientFrom: s.active_alerts_count > 0 ? '#FF3B30' : '#8892A6',
          gradientTo: s.active_alerts_count > 0 ? '#FF3B30' : '#8892A6',
        },
        {
          title: 'Space Weather',
          value: s.space_weather_index,
          subValue: w?.overall_severity,
          icon: 'wb_sunny',
          gradientFrom: w?.overall_severity === 'EXTREME' ? '#FF3B30' : '#FF9500',
          gradientTo: w?.overall_severity === 'EXTREME' ? '#FF3B30' : '#FF9500',
        },
        {
          title: 'Agent Runs',
          value: s.active_agents_load > 0 ? s.active_agents_load.toLocaleString() : 'IDLE',
          icon: 'bolt',
          gradientFrom: '#34C759',
          gradientTo: '#34C759',
        },
      ]
    : null;

  const conjunctions = useMemo(() => collisions.data?.data ?? [], [collisions.data]);
  const agentRuns    = agents.data?.data ?? [];

  // Log newly-detected CRITICAL/HIGH risk conjunctions as Alert events —
  // guarded by a ref of already-seen ids so repeated polling doesn't spam
  // the logbook with the same conjunction on every refetch.
  const loggedCollisionIdsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    for (const conj of conjunctions) {
      if (
        (conj.risk_level === 'CRITICAL' || conj.risk_level === 'HIGH') &&
        !loggedCollisionIdsRef.current.has(conj.id)
      ) {
        loggedCollisionIdsRef.current.add(conj.id);
        logEvent(
          'ALERTS',
          conj.risk_level === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          'Conjunction risk detected',
          `${conj.object_a?.name ?? 'Unknown'} vs ${conj.object_b?.name ?? 'Unknown'} — ${(conj.probability * 100).toFixed(2)}% probability`,
          { RISK_LEVEL: conj.risk_level, MISS_DISTANCE_M: conj.miss_distance_m.toFixed(0) }
        );
      }
    }
  }, [conjunctions]);

  const decisions: Array<AgentDecision & { runName: string }> = agentRuns
    .flatMap(run =>
      (run.decisions ?? []).map(d => ({ ...d, runName: run.workflow_name }))
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 3D Earth Twin Digital Hero */}
      <section className="h-[250px] md:h-[409px] relative border-b border-border-panel/60">
        <EarthTwin ref={earthTwinRef} />
      </section>

      {/* Satellite of the Day */}
      <section className="px-3 md:px-6 pt-3 md:pt-6">
        <SpotlightCard onViewOnGlobe={(catalogNumber) => earthTwinRef.current?.flyToSatellite(catalogNumber)} />
      </section>

      {/* KPI Bento Grid with Magic Cards */}
      <section className="p-3 md:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 md:gap-3">
        {summary.isLoading
          ? Array(3).fill(0).map((_, i) => <KPISkeleton key={i} />)
          : summary.isError
          ? (
            <div className="col-span-full lg:col-span-3 text-center text-status-emergency font-technical-data text-sm py-4">
              {'\u26A0'} Failed to connect to backend \u2014 please refresh or contact support if the issue persists.
            </div>
          )
          : kpis?.map((kpi, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -3, scale: 1.02 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="group h-full"
            >
              <MagicCard
                mode="orb"
                glowFrom={kpi.gradientFrom}
                glowTo={kpi.gradientTo}
                glowOpacity={0.3}
                glowSize={250}
                glowBlur={50}
                className="h-full rounded-xl border border-white/10 hover:border-white/20 transition-colors duration-300 shadow-md hover:shadow-lg"
                fillClassName="bg-[#0A0F1A]"
              >
                <div className="p-4 flex flex-col justify-between h-24">
                  <p className="font-label-caps text-[9px] text-primary/60 uppercase tracking-wider">
                    {kpi.title}
                  </p>
                  <div className="flex justify-between items-end">
                    <div className="flex items-baseline gap-1">
                      <span className="font-headline-lg text-lg md:text-2xl font-bold font-technical-data text-white">
                        {kpi.value}
                      </span>
                      {kpi.subValue && (
                        <span className="text-[10px] text-status-warning/60 font-technical-data">{kpi.subValue}</span>
                      )}
                    </div>
                    <MaterialIcon name={kpi.icon} className="text-primary-container/30 text-lg group-hover:scale-110 group-hover:text-primary-container/60 transition-all duration-200" />
                  </div>
                </div>
              </MagicCard>
            </motion.div>
          ))
        }
      </section>

      <section className="px-3 md:px-6 pb-6">
        <RocketLaunchCountdown />
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
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard/timeline"
                className="text-[10px] font-technical-data font-bold text-primary-container hover:underline flex items-center gap-1"
              >
                FULL EVENT STREAM <MaterialIcon name="arrow_forward" className="text-xs" />
              </Link>
              {collisions.isFetching && (
                <span className="font-technical-data text-[9px] text-primary/50 animate-pulse">UPDATING\u2026</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
            {collisions.isLoading ? (
              <div className="flex gap-4 min-w-[600px]">
                {[0, 1, 2].map(i => <CollisionCardSkeleton key={i} />)}
              </div>
            ) : conjunctions.length === 0 ? (
              <div className="flex items-center justify-center h-28 glass-panel border-dashed border-2 border-border-panel rounded-xl">
                <div className="text-center">
                  <MaterialIcon name="check_circle" className="text-status-success text-3xl mb-2" />
                  <p className="font-technical-data text-status-success text-sm font-bold">
                    NO ACTIVE CONJUNCTION RISKS DETECTED
                  </p>
                  <p className="font-technical-data text-[10px] text-on-surface-variant mt-1">
                    Orbital catalog is clear \u2014 next scan in 10 minutes
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-4 min-w-[600px]">
                {conjunctions.map((conj: Collision) => (
                  <motion.div
                    key={conj.id}
                    whileHover={{ y: -3, scale: 1.02 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="shrink-0"
                  >
                    <MagicCard
                      gradientColor={
                        conj.risk_level === 'CRITICAL' || conj.risk_level === 'HIGH'
                          ? '#FF3B30'
                          : conj.risk_level === 'MEDIUM'
                          ? '#FF9500'
                          : '#00e5ff'
                      }
                      gradientSize={200}
                      gradientOpacity={0.3}
                      className="w-64 sm:w-72 rounded-xl border border-white/10 hover:border-white/20 transition-colors duration-300 shadow-md hover:shadow-lg"
                      fillClassName="bg-[#0A0F1A]"
                    >
                      <div className={`p-4 border-l-4 ${riskColor(conj.risk_level)} relative overflow-hidden rounded-l`}>
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                          <MaterialIcon name="crisis_alert" className={`text-6xl ${riskBarColor(conj.risk_level)}`} />
                        </div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div>
                            <p className="text-[10px] text-text-muted mb-1 font-technical-data">
                              {conj.object_a?.name ?? '\u2014'} vs {conj.object_b?.name ?? '\u2014'}
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
                        <div className="space-y-2 relative z-10">
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
                    </MagicCard>
                  </motion.div>
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
          <MagicCard
            gradientColor="#7c3aed"
            gradientSize={200}
            gradientOpacity={0.15}
            className="flex-1 rounded-xl border border-white/10 hover:border-white/20 transition-colors duration-300"
            fillClassName="bg-[#0A0F1A]"
          >
            <div className="p-3.5 font-technical-data text-[11px] overflow-y-auto space-y-3.5 custom-scrollbar h-full">
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
                  <motion.div
                    key={d.id ?? i}
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className={`border-l-2 pl-3 py-1 transition-colors duration-200 ${
                      d.agent_name?.toLowerCase().includes('risk')
                        ? 'border-status-emergency bg-status-emergency/5 hover:bg-status-emergency/10'
                        : d.agent_name?.toLowerCase().includes('watch') || d.agent_name?.toLowerCase().includes('weather')
                        ? 'border-status-warning bg-status-warning/5 hover:bg-status-warning/10'
                        : 'border-primary-container bg-primary-container/5 hover:bg-primary-container/10'
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
                  </motion.div>
                ))
              )}
            </div>
          </MagicCard>
        </div>

      </section>
    </div>
  );
};

export default Dashboard;