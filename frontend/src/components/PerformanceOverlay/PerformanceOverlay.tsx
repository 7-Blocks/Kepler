import React, { useEffect, useRef, useState } from 'react';
import { usePerformanceStore, type OverlayPosition, type DiagnosticTab } from '@/store/performanceStore';
import { MaterialIcon } from '@/components/MaterialIcon';
import { initNetworkInterceptor } from '@/utils/networkInterceptor';

export const PerformanceOverlay: React.FC = () => {
  const {
    isEnabled,
    isMinimized,
    position,
    customCoords,
    activeTab,
    fps,
    frameTimeMs,
    fpsHistory,
    renderedSatellites,
    activeEntities,
    cesiumSceneUpdateTimeMs,
    memory,
    activeRequests,
    avgResponseTimeMs,
    totalRequests,
    slowRequestsCount,
    recentCalls,
    bottlenecks,
    toggleOverlay,
    toggleMinimized,
    setPosition,
    setCustomCoords,
    setActiveTab,
    updateFrameMetrics,
    updateMemoryMetrics,
    clearBottlenecks,
  } = usePerformanceStore();

  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize network interceptor once
  useEffect(() => {
    initNetworkInterceptor();
  }, []);

  // Frame rate monitoring loop
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const measureFrame = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      frameCount++;

      const isDropped = delta > 33.3; // Dropped frame threshold (> 30fps baseline)

      if (now - lastFpsUpdate >= 500) { // Update store twice per second
        const currentFps = Math.min(60, Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        const avgFrameTime = delta;
        updateFrameMetrics(currentFps, avgFrameTime, isDropped);

        frameCount = 0;
        lastFpsUpdate = now;
      }

      frameId = requestAnimationFrame(measureFrame);
    };

    frameId = requestAnimationFrame(measureFrame);
    return () => cancelAnimationFrame(frameId);
  }, [updateFrameMetrics]);

  // Memory usage polling loop
  useEffect(() => {
    const updateMem = () => {
      const perfObj = window.performance as unknown as {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
      };

      if (perfObj.memory) {
        const usedMB = perfObj.memory.usedJSHeapSize / (1024 * 1024);
        const totalMB = perfObj.memory.totalJSHeapSize / (1024 * 1024);
        const limitMB = perfObj.memory.jsHeapSizeLimit / (1024 * 1024);
        const percent = (usedMB / limitMB) * 100;

        updateMemoryMetrics({
          usedJSHeapSizeMB: Math.round(usedMB * 10) / 10,
          totalJSHeapSizeMB: Math.round(totalMB * 10) / 10,
          jsHeapSizeLimitMB: Math.round(limitMB * 10) / 10,
          percentUsed: Math.round(percent * 10) / 10,
          isSupported: true,
        });
      } else {
        updateMemoryMetrics({ isSupported: false });
      }
    };

    updateMem();
    const interval = setInterval(updateMem, 2000);
    return () => clearInterval(interval);
  }, [updateMemoryMetrics]);

  // Keyboard shortcut Shift + P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
          return;
        }
        e.preventDefault();
        toggleOverlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleOverlay]);

  // Dragging support
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setCustomCoords({
        x: Math.max(10, Math.min(window.innerWidth - 300, e.clientX - dragOffsetRef.current.x)),
        y: Math.max(10, Math.min(window.innerHeight - 200, e.clientY - dragOffsetRef.current.y)),
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setCustomCoords]);

  if (!isEnabled) return null;

  // Positioning classes
  const getPositionStyle = (): React.CSSProperties => {
    if (position === 'custom') {
      return { position: 'fixed', left: `${customCoords.x}px`, top: `${customCoords.y}px`, zIndex: 9999 };
    }
    const styles: Record<OverlayPosition, React.CSSProperties> = {
      'top-right': { position: 'fixed', top: '70px', right: '16px', zIndex: 9999 },
      'top-left': { position: 'fixed', top: '70px', left: '16px', zIndex: 9999 },
      'bottom-right': { position: 'fixed', bottom: '16px', right: '16px', zIndex: 9999 },
      'bottom-left': { position: 'fixed', bottom: '16px', left: '16px', zIndex: 9999 },
      custom: { position: 'fixed', top: '70px', right: '16px', zIndex: 9999 },
    };
    return styles[position];
  };

  const getFpsColor = (val: number) => {
    if (val >= 55) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (val >= 30) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  // Render Minimized Pill View
  if (isMinimized) {
    return (
      <div
        ref={containerRef}
        style={getPositionStyle()}
        className="glass-panel p-2 flex items-center gap-3 border border-cyan-500/30 rounded-lg shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing font-mono text-xs select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-1.5 font-bold text-cyan-400">
          <MaterialIcon name="drag_indicator" className="text-slate-500 text-sm" />
          <MaterialIcon name="speed" className="text-sm" />
          <span>PERF</span>
        </div>

        <div className={`px-2 py-0.5 rounded border font-semibold ${getFpsColor(fps)}`}>
          {fps.toFixed(0)} FPS
        </div>

        <div className="flex items-center gap-1 text-slate-300">
          <MaterialIcon name="satellite_alt" className="text-xs text-cyan-400" />
          <span>{renderedSatellites}</span>
        </div>

        {memory.isSupported && (
          <div className="flex items-center gap-1 text-slate-300">
            <MaterialIcon name="memory" className="text-xs text-purple-400" />
            <span>{memory.usedJSHeapSizeMB} MB</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={toggleMinimized}
            title="Expand Diagnostics (Shift + P)"
            className="p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-white"
          >
            <MaterialIcon name="open_in_full" className="text-sm" />
          </button>
          <button
            onClick={toggleOverlay}
            title="Close Overlay"
            className="p-1 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-400"
          >
            <MaterialIcon name="close" className="text-sm" />
          </button>
        </div>
      </div>
    );
  }

  // Render Full Diagnostics Panel
  return (
    <div
      ref={containerRef}
      style={getPositionStyle()}
      className="w-96 glass-panel border border-cyan-500/30 rounded-xl shadow-2xl backdrop-blur-xl font-mono text-xs text-slate-200 select-none overflow-hidden flex flex-col"
    >
      {/* Header Bar */}
      <div
        className="px-3 py-2.5 bg-slate-900/80 border-b border-slate-700/50 flex items-center justify-between cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 font-bold text-cyan-400">
          <MaterialIcon name="drag_handle" className="text-slate-500 text-base" />
          <MaterialIcon name="speed" className="text-base" />
          <span className="tracking-wide">PERFORMANCE OVERLAY</span>
          <span className="text-[10px] text-slate-500 font-normal">v1.0</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Position Selector */}
          <div className="relative group">
            <button className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white" title="Change Dock Position">
              <MaterialIcon name="space_dashboard" className="text-sm" />
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-slate-900 border border-slate-700 rounded shadow-xl p-1 z-50 min-w-[110px]">
              {(['top-right', 'top-left', 'bottom-right', 'bottom-left'] as OverlayPosition[]).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosition(pos)}
                  className={`text-left px-2 py-1 text-[11px] rounded capitalize ${
                    position === pos ? 'text-cyan-400 font-bold bg-cyan-950/40' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {pos.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <button onClick={toggleMinimized} title="Minimize" className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
            <MaterialIcon name="close_fullscreen" className="text-sm" />
          </button>
          <button onClick={toggleOverlay} title="Close (Shift + P)" className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400">
            <MaterialIcon name="close" className="text-sm" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950/60 border-b border-slate-800 text-[11px]">
        {(['OVERVIEW', 'CESIUM', 'NETWORK', 'MEMORY', 'BOTTLENECKS'] as DiagnosticTab[]).map((tab) => {
          const isTabActive = activeTab === tab;
          const hasBottleneck = tab === 'BOTTLENECKS' && bottlenecks.length > 0;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-center font-medium transition-all relative ${
                isTabActive ? 'text-cyan-400 bg-slate-800/80 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              {tab === 'BOTTLENECKS' ? 'ALERTS' : tab}
              {hasBottleneck && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content Area */}
      <div className="p-3 max-h-80 overflow-y-auto space-y-3">
        {/* OVERVIEW TAB */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-3">
            {/* FPS & Sparkline */}
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Frame Rate</div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className={`text-xl font-bold font-mono ${getFpsColor(fps).split(' ')[0]}`}>
                    {fps.toFixed(0)} <span className="text-xs text-slate-400 font-normal">FPS</span>
                  </span>
                  <span className="text-[10px] text-slate-400">({frameTimeMs.toFixed(1)}ms)</span>
                </div>
              </div>

              {/* Sparkline Graph */}
              <div className="flex items-end gap-0.5 h-8 w-28 bg-slate-950/80 p-1 rounded border border-slate-800">
                {fpsHistory.map((val, idx) => {
                  const pct = Math.min(100, Math.max(10, (val / 60) * 100));
                  const barColor = val >= 55 ? 'bg-emerald-500' : val >= 30 ? 'bg-amber-500' : 'bg-rose-500';
                  return (
                    <div
                      key={idx}
                      style={{ height: `${pct}%` }}
                      className={`flex-1 rounded-t-xs transition-all ${barColor}`}
                      title={`${val} FPS`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-slate-900/40 border border-slate-800">
                <div className="text-[10px] text-slate-400">Rendered Satellites</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">{renderedSatellites.toLocaleString()}</div>
              </div>

              <div className="p-2 rounded bg-slate-900/40 border border-slate-800">
                <div className="text-[10px] text-slate-400">Active Cesium Entities</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">{activeEntities.toLocaleString()}</div>
              </div>

              <div className="p-2 rounded bg-slate-900/40 border border-slate-800">
                <div className="text-[10px] text-slate-400">Avg API Latency</div>
                <div className="text-sm font-bold text-indigo-300 mt-0.5">{avgResponseTimeMs} ms</div>
              </div>

              <div className="p-2 rounded bg-slate-900/40 border border-slate-800">
                <div className="text-[10px] text-slate-400">JS Heap Used</div>
                <div className="text-sm font-bold text-purple-300 mt-0.5">
                  {memory.isSupported ? `${memory.usedJSHeapSizeMB} MB` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CESIUM SCENE TAB */}
        {activeTab === 'CESIUM' && (
          <div className="space-y-2">
            <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Cesium Scene Update:</span>
                <span className="font-bold text-cyan-400">{cesiumSceneUpdateTimeMs.toFixed(2)} ms</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, (cesiumSceneUpdateTimeMs / 33.3) * 100)}%` }}
                  className={`h-full transition-all ${
                    cesiumSceneUpdateTimeMs < 16 ? 'bg-emerald-500' : cesiumSceneUpdateTimeMs < 33 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-slate-300 text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Satellites Plotted:</span>
                <span className="font-semibold text-cyan-300">{renderedSatellites}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Total Scene Entities:</span>
                <span className="font-semibold text-cyan-300">{activeEntities}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Target Frame Interval:</span>
                <span className="font-semibold text-slate-300">16.6 ms (60 FPS)</span>
              </div>
            </div>
          </div>
        )}

        {/* NETWORK TAB */}
        {activeTab === 'NETWORK' && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-1.5 bg-slate-900/60 border border-slate-800 rounded">
                <div className="text-[9px] text-slate-400">Active</div>
                <div className="text-xs font-bold text-cyan-400">{activeRequests}</div>
              </div>
              <div className="p-1.5 bg-slate-900/60 border border-slate-800 rounded">
                <div className="text-[9px] text-slate-400">Total</div>
                <div className="text-xs font-bold text-indigo-400">{totalRequests}</div>
              </div>
              <div className="p-1.5 bg-slate-900/60 border border-slate-800 rounded">
                <div className="text-[9px] text-slate-400">Slow (&gt;500ms)</div>
                <div className={`text-xs font-bold ${slowRequestsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {slowRequestsCount}
                </div>
              </div>
            </div>

            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1">Recent Requests</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {recentCalls.length === 0 ? (
                <div className="text-slate-500 text-center py-3 italic">No network requests logged yet.</div>
              ) : (
                recentCalls.map((call) => (
                  <div
                    key={call.id}
                    className={`p-1.5 rounded border text-[10px] flex items-center justify-between ${
                      call.isSlow
                        ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                        : 'bg-slate-900/40 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate max-w-[200px]" title={call.url}>
                      <span className="font-bold text-cyan-400">{call.method}</span>
                      <span className="truncate">{call.url.replace(/^https?:\/\/[^/]+/, '')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={call.status === 200 ? 'text-emerald-400' : 'text-rose-400'}>
                        {call.status || 'ERR'}
                      </span>
                      <span className="font-mono text-slate-400">{call.durationMs}ms</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MEMORY TAB */}
        {activeTab === 'MEMORY' && (
          <div className="space-y-3">
            {memory.isSupported ? (
              <>
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">JS Heap Usage:</span>
                    <span className="font-bold text-purple-300">{memory.usedJSHeapSizeMB} / {memory.jsHeapSizeLimitMB} MB</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${memory.percentUsed}%` }}
                      className={`h-full transition-all ${
                        memory.percentUsed > 80 ? 'bg-rose-500' : memory.percentUsed > 60 ? 'bg-amber-500' : 'bg-purple-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Total Allocated Heap:</span>
                    <span>{memory.totalJSHeapSizeMB} MB</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Heap Limit:</span>
                    <span>{memory.jsHeapSizeLimitMB} MB</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Memory Utilization:</span>
                    <span className="font-bold text-purple-300">{memory.percentUsed}%</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-900/40 rounded border border-slate-800">
                Browser memory diagnostics API is not supported in this browser (Chrome / Chromium required).
              </div>
            )}
          </div>
        )}

        {/* BOTTLENECKS TAB */}
        {activeTab === 'BOTTLENECKS' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Active Alerts</span>
              {bottlenecks.length > 0 && (
                <button
                  onClick={clearBottlenecks}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  Clear Logs
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {bottlenecks.length === 0 ? (
                <div className="text-emerald-400 text-center py-4 text-xs flex items-center justify-center gap-1.5 bg-emerald-950/20 border border-emerald-500/20 rounded">
                  <MaterialIcon name="check_circle" className="text-sm" />
                  <span>No performance bottlenecks detected!</span>
                </div>
              ) : (
                bottlenecks.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-2 rounded border text-[10px] space-y-0.5 ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                        : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1">
                        <MaterialIcon name="warning" className="text-xs" />
                        {alert.type}
                      </span>
                      <span className="text-[9px] text-slate-400 font-normal">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div>{alert.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Hotkey Notice */}
      <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
        <span>Toggle shortcut: <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">Shift + P</kbd></span>
        <span className="text-cyan-500/70">Kepler Dev Tools</span>
      </div>
    </div>
  );
};
