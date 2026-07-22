import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useAgentRuns } from '@/hooks/useApi';
import type { AgentRun, AgentDecision } from '@/services/api';


const NODE_ROLES = [
  { label: 'MONITORING',   icon: 'visibility',    subLabel: 'SENSOR INPUT',  colorClass: 'text-primary-container',   border: 'border-primary-container',   shadow: 'shadow-[0_0_20px_rgba(0,229,255,0.25)]' },
  { label: 'RISK EVAL',    icon: 'psychology',    subLabel: 'AI PROCESSING', colorClass: 'text-status-warning',      border: 'border-status-warning',       shadow: 'shadow-[0_0_20px_rgba(255,149,0,0.15)]' },
  { label: 'MISSION',      icon: 'rocket_launch', subLabel: 'ACTION PLAN',   colorClass: 'text-secondary-container', border: 'border-secondary-container',   shadow: 'shadow-[0_0_20px_rgba(0,68,235,0.25)]' },
];

function agentStatusDot(status: string) {
  switch (status) {
    case 'RUNNING':   return 'bg-status-success animate-pulse';
    case 'COMPLETED': return 'bg-primary-container';
    case 'FAILED':    return 'bg-status-emergency animate-pulse';
    default:          return 'bg-white/40';
  }
}

function logColor(agentName: string) {
  const n = agentName.toLowerCase();
  if (n.includes('risk') || n.includes('collision'))   return 'text-status-emergency';
  if (n.includes('weather') || n.includes('watch'))    return 'text-status-warning';
  if (n.includes('mission') || n.includes('maneuver')) return 'text-secondary-container';
  if (n.includes('monitor') || n.includes('sensor'))   return 'text-primary-container';
  return 'text-on-surface-variant';
}

function formatLog(d: AgentDecision): { tag: string; msg: string; colorClass: string; ts: string } {
  return {
    tag:        `[${d.agent_name?.toUpperCase() ?? 'AGENT'}]`,
    msg:        d.reasoning,
    colorClass: logColor(d.agent_name ?? ''),
    ts:         new Date(d.created_at).toISOString().substring(11, 19) + 'Z',
  };
}


export const AIAgents: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const agentRunsQ  = useAgentRuns({ size: 10 });

  const runs: AgentRun[] = agentRunsQ.data?.data ?? [];

  
  const allDecisions = runs
    .flatMap(run => (run.decisions ?? []).map(d => ({ ...d, runName: run.workflow_name, runStatus: run.status })))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  
  const activeRun = runs.find(r => r.status === 'RUNNING') ?? runs[0] ?? null;
  const activeDecisions = activeRun?.decisions ?? [];

  
  const exportLogs = () => {
    const lines = allDecisions.map(d =>
      `[${new Date(d.created_at).toISOString()}] [${d.agent_name}] ${d.reasoning}`
    ).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'agent_logs.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const clearTerminal = () => {
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)._clearedAt = Date.now();
  };

  
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [allDecisions.length]);

  return (
    <div className="flex flex-col xl:flex-row h-full min-w-0 overflow-y-auto xl:overflow-hidden relative custom-scrollbar">

      {/* ── Left: Agent Status Cards ─────────────────────────── */}
      <section className="w-full xl:w-80 border-b xl:border-b-0 xl:border-r border-border-panel flex flex-col bg-surface-container-lowest/50 h-[300px] xl:h-full overflow-hidden shrink-0">
        <div className="p-4 border-b border-border-panel">
          <h2 className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider">
            Autonomous Fleet
          </h2>
          <p className="text-[10px] text-on-surface-variant mt-1 font-technical-data font-semibold">
            {agentRunsQ.isLoading
              ? 'Loading agent runs…'
              : `${runs.length} WORKFLOW RUNS · ${runs.filter(r => r.status === 'RUNNING').length} ACTIVE`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {agentRunsQ.isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="glass-panel p-3 h-20 animate-pulse bg-surface-container/40" />
            ))
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
              <MaterialIcon name="smart_toy" className="text-primary/20 text-4xl" />
              <p className="font-technical-data text-on-surface-variant text-[11px]">
                No agent runs recorded yet.
              </p>
              <p className="text-[10px] text-primary/40 font-technical-data">
                Agents activate when collision risks are detected.
              </p>
            </div>
          ) : (
            runs.slice(0, 8).map(run => {
              const lastDecision = run.decisions?.[run.decisions.length - 1];
              return (
                <div
                  key={run.id}
                  className={`glass-panel p-3 border-l-2 hover:bg-surface-variant/20 transition-ui cursor-pointer ${
                    run.status === 'RUNNING'   ? 'border-l-primary-container' :
                    run.status === 'COMPLETED' ? 'border-l-status-success' :
                    'border-l-status-emergency'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-label-caps text-[10px] font-bold text-on-surface-variant">
                      RUN #{run.id}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${agentStatusDot(run.status)}`} />
                  </div>
                  <h3 className="font-technical-data text-sm font-bold text-on-surface uppercase mb-1">
                    {run.workflow_name}
                  </h3>
                  <div className="flex gap-2 items-center mb-2">
                    <span className={`text-[9px] px-2 py-0.5 font-bold rounded-sm ${
                      run.status === 'RUNNING'   ? 'bg-primary-container/20 text-primary-container' :
                      run.status === 'COMPLETED' ? 'bg-status-success/20 text-status-success' :
                      'bg-status-emergency/20 text-status-emergency'
                    }`}>
                      {run.status}
                    </span>
                    <span className="text-[9px] text-on-surface-variant font-technical-data">
                      {(run.decisions?.length ?? 0)} decisions
                    </span>
                  </div>
                  {lastDecision && (
                    <div className="bg-black/40 p-2 rounded text-[10px] font-mono text-on-surface-variant leading-relaxed">
                      <span className={`${logColor(lastDecision.agent_name ?? '')} font-bold`}>
                        {lastDecision.agent_name}:{' '}
                      </span>
                      {lastDecision.reasoning.substring(0, 80)}
                      {lastDecision.reasoning.length > 80 ? '…' : ''}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── Center: Workflow Node Visualizer ─────────────────── */}
      <section className="flex-1 min-h-[500px] xl:min-h-0 relative bg-[radial-gradient(circle_at_center,_#111827_0%,_#000000_100%)] overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none technical-grid" />

        <svg className="hidden xl:block absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <path className="flow-line" d="M 170 300 Q 290 300, 410 300" fill="none" opacity="0.6" stroke="#00e5ff" strokeWidth="2" />
          <path className="flow-line" d="M 570 300 Q 690 300, 810 300" fill="none" opacity="0.6" stroke="#FF9500" strokeWidth="2" style={{ animationDelay: '0.5s' }} />
        </svg>

        <div className="absolute inset-0 flex flex-col xl:flex-row items-center justify-around px-4 xl:px-12 pt-12 pb-40 xl:py-0 gap-6 xl:gap-0 overflow-y-auto custom-scrollbar">
          {NODE_ROLES.map((node, i) => {
            
            const roleDecision = activeDecisions.find(d =>
              d.agent_name?.toLowerCase().includes(node.label.toLowerCase().split(' ')[0])
            );
            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className={`w-48 glass-panel rounded-lg p-4 border-2 ${node.border} ${node.shadow} cursor-pointer`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <MaterialIcon name={node.icon} className={node.colorClass} />
                  <span className={`font-label-caps text-[10px] ${node.colorClass} font-bold`}>{node.subLabel}</span>
                </div>
                <div className="font-headline-lg text-lg text-on-surface font-bold">{node.label}</div>
                {roleDecision && (
                  <p className="mt-2 text-[9px] text-on-surface-variant font-mono leading-relaxed line-clamp-2">
                    {roleDecision.reasoning.substring(0, 60)}…
                  </p>
                )}
                <div className="mt-3 flex gap-1 h-1">
                  <div className={`flex-1 ${node.colorClass.replace('text-','bg-')}`} />
                  <div className={`flex-1 ${node.colorClass.replace('text-','bg-')}/40`} />
                  <div className={`flex-1 ${node.colorClass.replace('text-','bg-')}`} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Status bar */}
        <div className="absolute bottom-4 xl:bottom-10 left-1/2 -translate-x-1/2 glass-panel px-4 xl:px-6 py-3 rounded-xl xl:rounded-full flex flex-col xl:flex-row items-center gap-2 xl:gap-6 border-primary-container/30 w-[90%] xl:w-auto max-w-xl text-center z-10">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${runs.some(r => r.status === 'RUNNING') ? 'bg-primary-container animate-ping' : 'bg-white/30'}`} />
            <span className="font-label-caps text-[10px] font-bold text-on-surface">
              {runs.some(r => r.status === 'RUNNING') ? 'AGENTS ACTIVE' : 'AGENTS IDLE'}
            </span>
          </div>
          <div className="hidden xl:block h-4 w-[1px] bg-border-panel" />
          <div className="flex items-center gap-2">
            <span className="font-label-caps text-[10px] font-bold text-on-surface">
              {activeRun ? `WORKFLOW: ${activeRun.workflow_name}` : 'NO ACTIVE WORKFLOW'}
            </span>
          </div>
          <div className="hidden xl:block h-4 w-[1px] bg-border-panel" />
          <div className="flex items-center gap-2">
            <span className="font-label-caps text-[10px] font-bold text-on-surface">
              {allDecisions.length} TOTAL DECISIONS
            </span>
          </div>
        </div>
      </section>

      {/* ── Right: Execution Log Terminal ─────────────────────── */}
      <section className="w-full xl:w-80 border-t xl:border-t-0 xl:border-l border-border-panel flex flex-col bg-bg-deep-space h-[400px] xl:h-full overflow-hidden shrink-0">
        <div className="p-4 border-b border-border-panel flex justify-between items-center bg-bg-deep-space">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant font-bold">
            Live Execution Log
          </h2>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
            agentRunsQ.isFetching ? 'bg-primary-container/20 text-primary-container animate-pulse' :
            'bg-status-success/15 text-status-success'
          }`}>
            {agentRunsQ.isFetching ? 'SYNC' : 'LIVE'}
          </span>
        </div>

        <div ref={terminalRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 font-mono text-[11px] leading-relaxed select-text">
          {allDecisions.length === 0 ? (
            <div className="text-on-surface-variant/50 text-center py-8">
              <p>[SYSTEM] No agent decisions recorded.</p>
              <p className="mt-2 text-[10px]">Awaiting agent activation…</p>
            </div>
          ) : (
            allDecisions.map((d, idx) => {
              const log = formatLog(d);
              return (
                <div key={`${d.id ?? idx}`} className="text-on-surface-variant mb-2">
                  <span className="text-on-surface-variant/40 mr-1 text-[9px]">{log.ts}</span>
                  <span className={`font-bold mr-1.5 ${log.colorClass}`}>{log.tag}</span>
                  <span className="text-on-surface">{log.msg}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-border-panel bg-surface-container-low">
          <div className="flex gap-2">
            <button
              onClick={exportLogs}
              disabled={allDecisions.length === 0}
              className="flex-1 py-2 bg-primary-container text-bg-deep-space text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-ui cursor-pointer disabled:opacity-50"
            >
              Export Logs
            </button>
            <button
              onClick={clearTerminal}
              className="px-3 py-2 border border-border-panel text-on-surface-variant hover:bg-white/5 cursor-pointer transition-ui"
            >
              <MaterialIcon name="delete" className="text-sm" />
            </button>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes flowPulse {
          0% { stroke-dashoffset: 100; opacity: 0.2; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.2; }
        }
        .flow-line {
          stroke-dasharray: 10, 5;
          animation: flowPulse 2s linear infinite;
        }
      `}</style>
    </div>
  );
};
export default AIAgents;
