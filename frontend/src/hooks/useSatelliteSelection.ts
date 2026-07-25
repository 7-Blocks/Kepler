import { useCallback, useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import type { CatalogObject } from '@/types/satellite';

interface UseSatelliteSelectionArgs {
  viewer: Cesium.Viewer | null;
  handler: Cesium.ScreenSpaceEventHandler | null;
  /** Convert a CatalogObject's orbital elements into a lat/lon/alt(km) point. */
  toLatLonAlt: (obj: CatalogObject) => { lat: number; lon: number; alt: number } | null;
  /** Read only inside event handlers, never during render. */
  collisionSetRef: React.RefObject<Set<string>>;
  onSelect?: (id: string | null) => void;
}

interface UseSatelliteSelectionResult {
  selectedId: string | null;
  selectedObject: CatalogObject | null;
  selectedIsCollisionRisk: boolean;
  selectSatellite: (obj: CatalogObject | null) => void;
  clearSelection: () => void;
}

/**
 * Click locks the spotlight onto a satellite; clicking empty space clears
 * it. Double-click additionally flies the camera to center on the target,
 * per the "Focus Camera" requirement — kept separate from single-click so
 * every click doesn't yank the camera around.
 */
export function useSatelliteSelection({
  viewer,
  handler,
  toLatLonAlt,
  collisionSetRef,
  onSelect,
}: UseSatelliteSelectionArgs): UseSatelliteSelectionResult {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<CatalogObject | null>(null);
  const [selectedIsCollisionRisk, setSelectedIsCollisionRisk] = useState(false);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  const selectSatellite = useCallback(
    (obj: CatalogObject | null) => {
      setSelectedId(obj?.catalog_number ?? null);
      setSelectedObject(obj);
      setSelectedIsCollisionRisk(obj ? collisionSetRef.current?.has(obj.catalog_number) ?? false : false);
      onSelectRef.current?.(obj?.catalog_number ?? null);
    },
    [collisionSetRef]
  );

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setSelectedObject(null);
    setSelectedIsCollisionRisk(false);
    onSelectRef.current?.(null);
  }, []);

  useEffect(() => {
    if (!viewer || !handler || viewer.isDestroyed()) return;

    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id && picked.id.properties?.catalogData) {
        try {
          const rawData = picked.id.properties.catalogData.getValue(Cesium.JulianDate.now());
          const obj = JSON.parse(rawData) as CatalogObject;
          selectSatellite(obj);
        } catch {
          /* ignore malformed entity data */
        }
      } else {
        // Clicked empty space — clear the lock.
        clearSelection();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id && picked.id.properties?.catalogData) {
        try {
          const rawData = picked.id.properties.catalogData.getValue(Cesium.JulianDate.now());
          const obj = JSON.parse(rawData) as CatalogObject;
          selectSatellite(obj);
          const pos = toLatLonAlt(obj);
          if (pos) {
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt * 1000 + 2000000),
              duration: 1.5,
            });
          }
        } catch {
          /* ignore malformed entity data */
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }, [viewer, handler, toLatLonAlt, selectSatellite, clearSelection]);

  return { selectedId, selectedObject, selectedIsCollisionRisk, selectSatellite, clearSelection };
}
