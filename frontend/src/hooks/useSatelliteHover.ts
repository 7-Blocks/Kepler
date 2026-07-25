import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import type { CatalogObject } from '@/types/satellite';

interface UseSatelliteHoverArgs {
  viewer: Cesium.Viewer | null;
  handler: Cesium.ScreenSpaceEventHandler | null;
  /** Skip hover spotlight changes while true (e.g. keyboard navigation is driving focus). */
  disabled?: boolean;
}

interface UseSatelliteHoverResult {
  hoveredId: string | null;
  hoveredObject: CatalogObject | null;
  tooltipPos: { x: number; y: number };
}

/**
 * Wires MOUSE_MOVE picking to hover state. Only re-renders when the hovered
 * entity actually changes (not on every pixel of mouse movement), keeping
 * this cheap even with large datasets.
 */
export function useSatelliteHover({ viewer, handler, disabled }: UseSatelliteHoverArgs): UseSatelliteHoverResult {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredObject, setHoveredObject] = useState<CatalogObject | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const hoveredIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!viewer || !handler || viewer.isDestroyed()) return;

    handler.setInputAction((movement: { endPosition: Cesium.Cartesian2 }) => {
      if (disabled) return;

      const picked = viewer.scene.pick(movement.endPosition);
      if (Cesium.defined(picked) && picked.id && picked.id.properties?.catalogData) {
        try {
          const rawData = picked.id.properties.catalogData.getValue(Cesium.JulianDate.now());
          const obj = JSON.parse(rawData) as CatalogObject;
          if (hoveredIdRef.current !== obj.catalog_number) {
            hoveredIdRef.current = obj.catalog_number;
            setHoveredId(obj.catalog_number);
            setHoveredObject(obj);
          }
          setTooltipPos({ x: movement.endPosition.x + 15, y: movement.endPosition.y - 10 });
        } catch {
          /* malformed entity data — ignore this pick */
        }
      } else if (hoveredIdRef.current !== null) {
        hoveredIdRef.current = null;
        setHoveredId(null);
        setHoveredObject(null);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }, [viewer, handler, disabled]);

  return { hoveredId, hoveredObject, tooltipPos };
}
