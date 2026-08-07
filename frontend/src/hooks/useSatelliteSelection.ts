import { useCallback, useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import type { CatalogObject } from '@/types/satellite';
import { prefersReducedMotion } from '@/components/SatelliteSpotlight/GlowEffect';
import { logEvent } from '@/store/logbookStore';

interface UseSatelliteSelectionArgs {
  viewer: Cesium.Viewer | null;
  handler: Cesium.ScreenSpaceEventHandler | null;
  /** Convert a CatalogObject's orbital elements into a lat/lon/alt(km) point. */
  toLatLonAlt: (obj: CatalogObject) => { lat: number; lon: number; alt: number } | null;
  /** Read only inside event handlers, never during render. */
  collisionSetRef: React.RefObject<Set<string>>;
  /** The keyboard-focusable globe container (not the Cesium canvas) that
   *  SpotlightManager listens on for arrow-key navigation. Refocused after
   *  mouse clicks so keyboard nav keeps working without requiring a Tab. */
  containerEl: HTMLDivElement | null;
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
  containerEl,
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
      const isCollisionRisk = obj ? collisionSetRef.current?.has(obj.catalog_number) ?? false : false;
      setSelectedIsCollisionRisk(isCollisionRisk);
      // Selection logging happens centrally in uiStore.setSelectedSatelliteId
      // (which this ultimately calls via onSelect), since the satellite list
      // page also writes to that same field directly — logging here too
      // would double up for globe-driven selections.
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
      // Return focus to the keyboard-navigable globe container (not the
      // Cesium canvas) so arrow-key navigation keeps working after a mouse
      // interaction, without requiring the user to Tab in first.
      containerEl?.focus({ preventScroll: true });
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
            const destination = Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt * 1000 + 2000000);
            if (prefersReducedMotion()) {
              // Jump directly to the destination instead of animating.
              viewer.camera.flyTo({ destination, duration: 0 });
            } else {
              viewer.camera.flyTo({ destination, duration: 1.5 });
            }
            logEvent(
              'CAMERA',
              'LOW',
              'Camera focused on target',
              `Flew to ${obj.name ?? 'Unknown object'} — NORAD ${obj.catalog_number}`
            );
          }
        } catch {
          /* ignore malformed entity data */
        }
      }
      containerEl?.focus({ preventScroll: true });
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }, [viewer, handler, toLatLonAlt, selectSatellite, clearSelection, containerEl]);

  return { selectedId, selectedObject, selectedIsCollisionRisk, selectSatellite, clearSelection };
}
