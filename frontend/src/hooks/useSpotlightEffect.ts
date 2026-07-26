import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import type { CatalogObject } from '@/types/satellite';
import { applyBaseline, applyDim, applyHighlight, type PointBaseline } from '@/components/SatelliteSpotlight/GlowEffect';
import { setOrbitHighlight, clearOrbitHighlight } from '@/components/SatelliteSpotlight/OrbitHighlight';
import { CATEGORY_COLORS, getOutlineWidth, getPointSize } from '@/lib/satelliteVisuals';

interface UseSpotlightEffectArgs {
  viewer: Cesium.Viewer | null;
  entitiesRef: React.RefObject<Map<string, Cesium.Entity>>;
  catalogMapRef: React.RefObject<Map<string, CatalogObject>>;
  collisionSetRef: React.RefObject<Set<string>>;
  hoveredId: string | null;
  selectedId: string | null;
  /** Bump whenever entitiesRef is repopulated so stale dim/highlight state resets cleanly. */
  datasetVersion: number;
}

function baselineFor(id: string, catalogMap: Map<string, CatalogObject>, collisionSet: Set<string>): PointBaseline | null {
  const obj = catalogMap.get(id);
  if (!obj) return null;
  const isCollisionRisk = collisionSet.has(id);
  const colorConfig = isCollisionRisk ? CATEGORY_COLORS.COLLISION : CATEGORY_COLORS[obj.classification] ?? CATEGORY_COLORS.UNKNOWN;
  return {
    color: colorConfig.cesium,
    pixelSize: isCollisionRisk ? 8 : getPointSize(obj.classification),
    outlineColor: colorConfig.cesium,
    outlineWidth: isCollisionRisk ? 3 : getOutlineWidth(obj.classification),
  };
}

/**
 * Central spotlight controller: given the currently hovered/selected
 * satellite id, brightens that entity, dims everything else, and highlights
 * its orbit path. Work is diffed against previous state so a hover change
 * only ever touches the two affected entities (old + new), not the whole
 * dataset — the full dataset is only touched once, on first activation.
 */
export function useSpotlightEffect({
  viewer,
  entitiesRef,
  catalogMapRef,
  collisionSetRef,
  hoveredId,
  selectedId,
  datasetVersion,
}: UseSpotlightEffectArgs): void {
  const prevActiveIdRef = useRef<string | null | undefined>(undefined);
  const dimmedIdsRef = useRef<Set<string>>(new Set());
  const lastDatasetVersionRef = useRef<number>(-1);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    const entities = entitiesRef.current;
    const catalogMap = catalogMapRef.current;
    const collisionSet = collisionSetRef.current;
    if (!entities || !catalogMap || !collisionSet) return;

    const activeId = selectedId ?? hoveredId;

    // Dataset was refreshed (e.g. 5-minute poll) — old dim/highlight state
    // no longer maps to real entities, so start clean and re-derive.
    const datasetChanged = lastDatasetVersionRef.current !== datasetVersion;
    if (datasetChanged) {
      lastDatasetVersionRef.current = datasetVersion;
      dimmedIdsRef.current = new Set();
      prevActiveIdRef.current = undefined;
    }

    const prevActiveId = prevActiveIdRef.current;
    if (!datasetChanged && activeId === prevActiveId) return;

    const dimmed = dimmedIdsRef.current;

    const restoreToBaseline = (id: string) => {
      const e = entities.get(id);
      const b = baselineFor(id, catalogMap, collisionSet);
      if (e && b) applyBaseline(e, b);
    };

    const dimEntity = (id: string) => {
      const e = entities.get(id);
      const b = baselineFor(id, catalogMap, collisionSet);
      if (e && b) {
        applyDim(e, b);
        dimmed.add(id);
      }
    };

    if (activeId === null) {
      dimmed.forEach(restoreToBaseline);
      dimmed.clear();
      if (prevActiveId) restoreToBaseline(prevActiveId);
      clearOrbitHighlight(viewer);
    } else {
      if (prevActiveId && prevActiveId !== activeId) {
        dimEntity(prevActiveId);
      }

      // First activation from a fully-baseline state: dim the whole field
      // in one pass. Subsequent hover/selection moves skip this branch
      // entirely since `dimmed` is already populated.
      if (dimmed.size === 0) {
        entities.forEach((_e, id) => {
          if (id !== activeId) dimEntity(id);
        });
      }

      const activeEntity = entities.get(activeId);
      const activeBaseline = baselineFor(activeId, catalogMap, collisionSet);
      const activeObj = catalogMap.get(activeId);
      if (activeEntity && activeBaseline) {
        dimmed.delete(activeId);
        applyHighlight(activeEntity, activeBaseline, {
          isCollisionRisk: collisionSet.has(activeId),
          labelText: activeObj?.name,
        });
      }

      if (activeObj) {
        setOrbitHighlight(viewer, activeObj, {
          color: activeBaseline?.color ?? Cesium.Color.CYAN,
          isCollisionRisk: collisionSet.has(activeId),
        });
      }
    }

    prevActiveIdRef.current = activeId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer, hoveredId, selectedId, datasetVersion]);
}
