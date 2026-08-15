import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import type { CatalogObject } from '@/types/satellite';
import { useSatelliteHover } from '@/hooks/useSatelliteHover';
import { useSatelliteSelection } from '@/hooks/useSatelliteSelection';
import { useSpotlightEffect } from '@/hooks/useSpotlightEffect';
import { SpotlightInfoCard } from './SpotlightInfoCard';

interface SpotlightManagerProps {
  viewer: Cesium.Viewer | null;
  containerEl: HTMLDivElement | null;
  entitiesRef: React.RefObject<Map<string, Cesium.Entity>>;
  catalogMapRef: React.RefObject<Map<string, CatalogObject>>;
  collisionSetRef: React.RefObject<Set<string>>;
  datasetVersion: number;
  toLatLonAlt: (obj: CatalogObject) => { lat: number; lon: number; alt: number } | null;
  onHoverChange?: (obj: CatalogObject | null, pos: { x: number; y: number }) => void;
  onSelectionChange?: (id: string | null) => void;
  /** Set to lock selection onto a satellite from outside the globe (e.g. a dashboard card). */
  focusRequest?: { catalogNumber: string; nonce: number } | null;
}

/**
 * Reusable satellite spotlight controller. Owns the Cesium input handler,
 * wires hover/selection/keyboard-nav hooks together, drives the
 * highlight/dim/orbit visuals, and renders the selected-satellite info
 * card. Designed to be easy to point at other object types later — swap
 * what populates `entitiesRef`/`catalogMapRef` and everything else works
 * the same way.
 */
export const SpotlightManager: React.FC<SpotlightManagerProps> = ({
  viewer,
  containerEl,
  entitiesRef,
  catalogMapRef,
  collisionSetRef,
  datasetVersion,
  toLatLonAlt,
  onHoverChange,
  onSelectionChange,
  focusRequest,
}) => {
  const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);
  const [handler, setHandler] = useState<Cesium.ScreenSpaceEventHandler | null>(null);
  const [keyboardFocusId, setKeyboardFocusId] = useState<string | null>(null);
  const [containerFocused, setContainerFocused] = useState(false);

  // One shared picking handler for the lifetime of the viewer instance.
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    const h = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handlerRef.current = h;
    queueMicrotask(() => setHandler(h));
    return () => {
      h.destroy();
      handlerRef.current = null;
      queueMicrotask(() => setHandler(null));
    };
  }, [viewer]);

  const { hoveredId, hoveredObject, tooltipPos } = useSatelliteHover({ viewer, handler });

  const { selectedId, selectedObject, selectedIsCollisionRisk, selectSatellite, clearSelection } = useSatelliteSelection({
    viewer,
    handler,
    toLatLonAlt,
    collisionSetRef,
    containerEl,
    onSelect: onSelectionChange,
  });

  useEffect(() => {
    onHoverChange?.(hoveredObject, tooltipPos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredObject, tooltipPos]);

  // External fly-to request (e.g. Satellite of the Day's "View on Globe")
  // — lock selection the same way a click would, keyed off `nonce` so the
  // same satellite can be re-requested.
  useEffect(() => {
    if (!focusRequest) return;
    const obj = catalogMapRef.current?.get(focusRequest.catalogNumber) ?? null;
    if (obj) selectSatellite(obj);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest]);

  // Keyboard focus takes priority over mouse hover for spotlight targeting,
  // since it reflects deliberate keyboard navigation.
  const effectiveHoverId = keyboardFocusId ?? hoveredId;

  useSpotlightEffect({
    viewer,
    entitiesRef,
    catalogMapRef,
    collisionSetRef,
    hoveredId: effectiveHoverId,
    selectedId,
    datasetVersion,
  });

  // ── Keyboard navigation ──────────────────────────────────────────
  useEffect(() => {
    if (!containerEl) return;

    const getOrderedIds = () => Array.from(entitiesRef.current?.keys() ?? []);

    const handleKeyDown = (e: KeyboardEvent) => {
      const ids = getOrderedIds();
      if (ids.length === 0) return;

      if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        const currentIndex = keyboardFocusId ? ids.indexOf(keyboardFocusId) : -1;
        const direction = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + direction + ids.length) % ids.length;
        setKeyboardFocusId(ids[nextIndex]);
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (keyboardFocusId) {
          e.preventDefault();
          const obj = catalogMapRef.current?.get(keyboardFocusId) ?? null;
          selectSatellite(obj);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
        setKeyboardFocusId(null);
      }
    };

    const handleFocus = () => setContainerFocused(true);
    const handleBlur = () => {
      setContainerFocused(false);
      setKeyboardFocusId(null);
    };

    containerEl.addEventListener('keydown', handleKeyDown);
    containerEl.addEventListener('focus', handleFocus);
    containerEl.addEventListener('blur', handleBlur);
    return () => {
      containerEl.removeEventListener('keydown', handleKeyDown);
      containerEl.removeEventListener('focus', handleFocus);
      containerEl.removeEventListener('blur', handleBlur);
    };
  }, [containerEl, keyboardFocusId, entitiesRef, catalogMapRef, selectSatellite, clearSelection]);

  return (
    <>
      {selectedObject && (
        <div className="absolute top-3 right-3 md:top-6 md:right-6 z-30 pointer-events-auto">
          <SpotlightInfoCard object={selectedObject} isCollisionRisk={selectedIsCollisionRisk} onClose={clearSelection} />
        </div>
      )}

      {containerFocused && !selectedObject && (
        <div className="spotlight-keyboard-hint absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-bg-deep-space/85 backdrop-blur-md border border-primary-container/30 px-3 py-1.5 font-technical-data text-[10px] text-primary-container/80">
            ← → navigate · Enter select · Esc clear
          </div>
        </div>
      )}
    </>
  );
};

export default SpotlightManager;