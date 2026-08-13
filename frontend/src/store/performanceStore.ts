import { create } from 'zustand';

export interface NetworkCallMetric {
  id: string;
  url: string;
  method: string;
  status: number;
  durationMs: number;
  timestamp: number;
  isSlow: boolean;
}

export interface BottleneckAlert {
  id: string;
  type: 'LOW_FPS' | 'HIGH_MEMORY' | 'SLOW_API' | 'HIGH_ENTITY_COUNT' | 'SLOW_SCENE_UPDATE';
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: number;
  details?: string;
}

export interface MemoryMetrics {
  usedJSHeapSizeMB: number;
  totalJSHeapSizeMB: number;
  jsHeapSizeLimitMB: number;
  percentUsed: number;
  isSupported: boolean;
}

export type OverlayPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'custom';
export type DiagnosticTab = 'OVERVIEW' | 'CESIUM' | 'NETWORK' | 'MEMORY' | 'BOTTLENECKS';

interface PerformanceState {
  // Config & UI State
  isEnabled: boolean;
  isMinimized: boolean;
  position: OverlayPosition;
  customCoords: { x: number; y: number };
  activeTab: DiagnosticTab;

  // FPS & Frame Metrics
  fps: number;
  frameTimeMs: number;
  droppedFrames: number;
  fpsHistory: number[];

  // Cesium & Scene Metrics
  renderedSatellites: number;
  activeEntities: number;
  cesiumSceneUpdateTimeMs: number;

  // Memory Metrics
  memory: MemoryMetrics;

  // Network Metrics
  activeRequests: number;
  avgResponseTimeMs: number;
  totalRequests: number;
  slowRequestsCount: number;
  recentCalls: NetworkCallMetric[];

  // Bottleneck Alerts
  bottlenecks: BottleneckAlert[];

  // Actions
  toggleOverlay: () => void;
  setIsEnabled: (enabled: boolean) => void;
  toggleMinimized: () => void;
  setMinimized: (minimized: boolean) => void;
  setPosition: (pos: OverlayPosition) => void;
  setCustomCoords: (coords: { x: number; y: number }) => void;
  setActiveTab: (tab: DiagnosticTab) => void;

  updateFrameMetrics: (fps: number, frameTimeMs: number, isDroppedFrame: boolean) => void;
  updateCesiumMetrics: (sceneTimeMs: number, entityCount: number, satelliteCount: number) => void;
  updateMemoryMetrics: (memory: Partial<MemoryMetrics>) => void;
  addNetworkCall: (call: Omit<NetworkCallMetric, 'id'>) => void;
  incrementActiveRequests: () => void;
  decrementActiveRequests: () => void;
  addBottleneck: (alert: Omit<BottleneckAlert, 'id' | 'timestamp'>) => void;
  clearBottlenecks: () => void;
}

const MAX_HISTORY_LENGTH = 30;
const MAX_NETWORK_LOGS = 20;
const MAX_BOTTLENECK_LOGS = 15;

export const usePerformanceStore = create<PerformanceState>((set) => ({
  isEnabled: false,
  isMinimized: false,
  position: 'top-right',
  customCoords: { x: 20, y: 80 },
  activeTab: 'OVERVIEW',

  fps: 60,
  frameTimeMs: 16.6,
  droppedFrames: 0,
  fpsHistory: Array(20).fill(60),

  renderedSatellites: 0,
  activeEntities: 0,
  cesiumSceneUpdateTimeMs: 0,

  memory: {
    usedJSHeapSizeMB: 0,
    totalJSHeapSizeMB: 0,
    jsHeapSizeLimitMB: 0,
    percentUsed: 0,
    isSupported: false,
  },

  activeRequests: 0,
  avgResponseTimeMs: 0,
  totalRequests: 0,
  slowRequestsCount: 0,
  recentCalls: [],

  bottlenecks: [],

  toggleOverlay: () => set((state) => ({ isEnabled: !state.isEnabled })),
  setIsEnabled: (enabled) => set({ isEnabled: enabled }),
  toggleMinimized: () => set((state) => ({ isMinimized: !state.isMinimized })),
  setMinimized: (minimized) => set({ isMinimized: minimized }),
  setPosition: (position) => set({ position }),
  setCustomCoords: (customCoords) => set({ customCoords, position: 'custom' }),
  setActiveTab: (activeTab) => set({ activeTab }),

  updateFrameMetrics: (fps, frameTimeMs, isDroppedFrame) =>
    set((state) => {
      const newFpsHistory = [...state.fpsHistory.slice(1), fps];
      const newDropped = isDroppedFrame ? state.droppedFrames + 1 : state.droppedFrames;
      
      let newBottlenecks = state.bottlenecks;
      if (fps < 30 && (!state.bottlenecks.length || state.bottlenecks[0]?.type !== 'LOW_FPS')) {
        const alert: BottleneckAlert = {
          id: `fps-${Date.now()}`,
          type: 'LOW_FPS',
          severity: fps < 20 ? 'CRITICAL' : 'WARNING',
          message: `Frame rate dropped to ${fps.toFixed(1)} FPS (${frameTimeMs.toFixed(1)}ms frame time)`,
          timestamp: Date.now(),
        };
        newBottlenecks = [alert, ...state.bottlenecks.slice(0, MAX_BOTTLENECK_LOGS - 1)];
      }

      return {
        fps,
        frameTimeMs,
        droppedFrames: newDropped,
        fpsHistory: newFpsHistory,
        bottlenecks: newBottlenecks,
      };
    }),

  updateCesiumMetrics: (sceneTimeMs, entityCount, satelliteCount) =>
    set((state) => {
      let newBottlenecks = state.bottlenecks;
      if (sceneTimeMs > 35) {
        const alert: BottleneckAlert = {
          id: `cesium-${Date.now()}`,
          type: 'SLOW_SCENE_UPDATE',
          severity: sceneTimeMs > 60 ? 'CRITICAL' : 'WARNING',
          message: `Cesium scene update took ${sceneTimeMs.toFixed(1)}ms (${entityCount} active entities)`,
          timestamp: Date.now(),
        };
        newBottlenecks = [alert, ...state.bottlenecks.slice(0, MAX_BOTTLENECK_LOGS - 1)];
      }

      return {
        cesiumSceneUpdateTimeMs: sceneTimeMs,
        activeEntities: entityCount,
        renderedSatellites: satelliteCount,
        bottlenecks: newBottlenecks,
      };
    }),

  updateMemoryMetrics: (mem) =>
    set((state) => {
      const updatedMemory = { ...state.memory, ...mem };
      let newBottlenecks = state.bottlenecks;

      if (updatedMemory.percentUsed > 80) {
        const alert: BottleneckAlert = {
          id: `mem-${Date.now()}`,
          type: 'HIGH_MEMORY',
          severity: updatedMemory.percentUsed > 90 ? 'CRITICAL' : 'WARNING',
          message: `JS Heap memory usage at ${updatedMemory.percentUsed.toFixed(1)}% (${updatedMemory.usedJSHeapSizeMB.toFixed(1)} MB)`,
          timestamp: Date.now(),
        };
        newBottlenecks = [alert, ...state.bottlenecks.slice(0, MAX_BOTTLENECK_LOGS - 1)];
      }

      return {
        memory: updatedMemory,
        bottlenecks: newBottlenecks,
      };
    }),

  addNetworkCall: (call) =>
    set((state) => {
      const newCall: NetworkCallMetric = {
        ...call,
        id: `net-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };

      const newTotal = state.totalRequests + 1;
      const newSlowCount = call.isSlow ? state.slowRequestsCount + 1 : state.slowRequestsCount;
      const newAvgResponse = Math.round(
        (state.avgResponseTimeMs * state.totalRequests + call.durationMs) / newTotal
      );
      const newCalls = [newCall, ...state.recentCalls.slice(0, MAX_NETWORK_LOGS - 1)];

      let newBottlenecks = state.bottlenecks;
      if (call.isSlow) {
        const alert: BottleneckAlert = {
          id: `net-slow-${Date.now()}`,
          type: 'SLOW_API',
          severity: call.durationMs > 1500 ? 'CRITICAL' : 'WARNING',
          message: `Slow API call: ${call.method} ${call.url.split('?')[0]} (${call.durationMs}ms)`,
          timestamp: Date.now(),
          details: `Status ${call.status}`,
        };
        newBottlenecks = [alert, ...state.bottlenecks.slice(0, MAX_BOTTLENECK_LOGS - 1)];
      }

      return {
        totalRequests: newTotal,
        slowRequestsCount: newSlowCount,
        avgResponseTimeMs: newAvgResponse,
        recentCalls: newCalls,
        bottlenecks: newBottlenecks,
      };
    }),

  incrementActiveRequests: () => set((state) => ({ activeRequests: state.activeRequests + 1 })),
  decrementActiveRequests: () =>
    set((state) => ({ activeRequests: Math.max(0, state.activeRequests - 1) })),

  addBottleneck: (alert) =>
    set((state) => ({
      bottlenecks: [
        { ...alert, id: `bn-${Date.now()}`, timestamp: Date.now() },
        ...state.bottlenecks.slice(0, MAX_BOTTLENECK_LOGS - 1),
      ],
    })),

  clearBottlenecks: () => set({ bottlenecks: [] }),
}));
