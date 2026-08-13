import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { usePerformanceStore } from '@/store/performanceStore';

/**
 * Custom hook to monitor Cesium rendering performance, scene update timing,
 * and active entities count.
 */
export function useCesiumPerformance(viewer: Cesium.Viewer | null): void {
  const preRenderTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    const scene = viewer.scene;

    const handlePreRender = () => {
      preRenderTimeRef.current = performance.now();
    };

    const handlePostRender = () => {
      if (!preRenderTimeRef.current) return;
      const updateTimeMs = performance.now() - preRenderTimeRef.current;
      
      const entityCount = viewer.entities.values.length;
      let satelliteCount = 0;

      // Count entities marked as catalog satellites/objects
      for (const entity of viewer.entities.values) {
        if (entity.properties?.catalogData) {
          satelliteCount++;
        }
      }

      usePerformanceStore.getState().updateCesiumMetrics(
        updateTimeMs,
        entityCount,
        satelliteCount
      );
    };

    const removePre = scene.preRender.addEventListener(handlePreRender);
    const removePost = scene.postRender.addEventListener(handlePostRender);

    return () => {
      if (!scene.isDestroyed()) {
        removePre();
        removePost();
      }
    };
  }, [viewer]);
}
