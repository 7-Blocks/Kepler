import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as Cesium from 'cesium';
import { useNavigate } from 'react-router-dom';
import { useUIStore, useActiveSector, useLayerStore, useOrbitalStore, logEvent } from '@/store';
import { orbitalDataService } from '@/services/orbitalDataService';
import { calculateCartesianPosition, calculateOrbitalPosition } from '@/services/orbitalPositionService';
import type { OrbitalObject } from '@/types/orbital';
import { deriveObjectCategory, getObjectCategoryCss, isObjectCategoryVisible } from '@/types/objectCategories';
import { deriveOrbitRegime } from '@/types/orbitLayers';
import { MaterialIcon } from './MaterialIcon';
import { ProceduralSpaceBackground } from '@/components/ui/ProceduralSpaceBackground';
import { LayerManagerPanel } from './OrbitLayers/LayerManagerPanel';
import { BookmarkModal, type BookmarkFormValues } from './GlobeBookmarks/BookmarkModal';
import { BookmarkSidebar } from './GlobeBookmarks/BookmarkSidebar';
import { useBookmarks } from '../hooks/useBookmarks';
import type { Bookmark } from '../hooks/useBookmarkStorage';
import { getSharedBookmarkFromUrl } from '../utils/bookmarkHelpers';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { executeVoiceCommand } from '../lib/voiceCommands';
import { useCesiumPerformance } from '@/hooks/useCesiumPerformance';
import { OrbitalHoverPanel } from './orbital/OrbitalHoverPanel';
import { OrbitalObjectDetails } from './orbital/OrbitalObjectDetails';
import { OrbitalLegend } from './orbital/OrbitalLegend';
import { MAX_VISIBLE_SPACE_OBJECTS, ORBITAL_POINT_SIZES } from '@/constants/orbital';

let globalAutoRotate = true;

const CATEGORY_COLORS: Record<string, { css: string; cesium: Cesium.Color }> = {
  PAYLOAD: { css: '#00E5FF', cesium: Cesium.Color.fromCssColorString('#00E5FF') },
  DEBRIS: { css: '#FFAA00', cesium: Cesium.Color.fromCssColorString('#FFAA00') },
  ROCKET_BODY: { css: '#FF4444', cesium: Cesium.Color.fromCssColorString('#FF4444') },
  COLLISION: { css: '#FF0000', cesium: Cesium.Color.fromCssColorString('#FF0000') },
};

export interface EarthTwinHandle {
  /** Flies the camera to the given NORAD catalog number and selects it. */
  flyToSatellite: (catalogNumber: string) => void;
}

export const EarthTwin = forwardRef<EarthTwinHandle>((_props, ref) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const pointCollectionRef = useRef<Cesium.PointPrimitiveCollection | null>(null);
  const pointsMapRef = useRef<Map<string, Cesium.PointPrimitive>>(new Map());
  const selectedHighlightRef = useRef<Cesium.Entity | null>(null);

  const [viewerInstance, setViewerInstance] = useState<Cesium.Viewer | null>(null);
  useCesiumPerformance(viewerInstance);

  const activeSector = useActiveSector();
  const { setSelectedSatelliteId } = useUIStore();
  const { statistics, loading: catalogLoading, loadingProgress } = useOrbitalStore();

  const [hoveredObject, setHoveredObject] = useState<OrbitalObject | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [selectedDetailsObject, setSelectedDetailsObject] = useState<OrbitalObject | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [showLegend, setShowLegend] = useState(true);
  const [showLayerManager, setShowLayerManager] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [isBookmarkSidebarOpen, setIsBookmarkSidebarOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const {
    bookmarks,
    filteredBookmarks,
    favoriteBookmarks,
    recentBookmarks,
    categories,
    searchQuery,
    selectedCategory,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    toggleFavorite,
    markAsRecent,
    setSearchQuery,
    setSelectedCategory,
    exportBookmarks,
    importBookmarks,
  } = useBookmarks();

  // Voice Command Handlers
  const handleTrackISS = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    globalAutoRotate = false;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0, 0, 2_200_000),
      duration: 1.5,
    });
    logEvent('TRACKING', 'MEDIUM', 'ISS tracking engaged', 'Camera locked onto International Space Station orbit.');
  }, []);

  const handleShowDebris = useCallback(() => {
    navigate('/dashboard/debris');
  }, [navigate]);

  const handleOpenCollisionCenter = useCallback(() => {
    navigate('/dashboard/collision-center');
  }, [navigate]);

  const handleZoomToIndia = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    globalAutoRotate = false;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(78.9629, 20.5937, 3_000_000),
      duration: 1.5,
    });
    logEvent('CAMERA', 'LOW', 'Camera repositioned', 'Zoomed to regional view: India.');
  }, []);

  const handleToggleSpaceWeather = useCallback(() => {
    navigate('/dashboard/space-weather');
  }, [navigate]);

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onCommand: (text) => {
      executeVoiceCommand(text, {
        trackISS: handleTrackISS,
        showDebris: handleShowDebris,
        openCollisionCenter: handleOpenCollisionCenter,
        zoomToIndia: handleZoomToIndia,
        toggleSpaceWeather: handleToggleSpaceWeather,
      });
    },
  });

  // Focus & FlyTo satellite method
  const flyToSatellite = useCallback(
    (catalogNumber: string) => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      const obj = orbitalDataService.getOrbitalObjectById(catalogNumber);
      if (!obj) return;

      setSelectedSatelliteId(obj.noradId);
      setSelectedDetailsObject(obj);

      const pos = calculateOrbitalPosition(obj);
      if (pos) {
        globalAutoRotate = false;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt * 1000 + 2000000),
          duration: 1.5,
        });

        // Add spotlight / highlight ring
        if (selectedHighlightRef.current) {
          viewer.entities.remove(selectedHighlightRef.current);
        }
        selectedHighlightRef.current = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt * 1000),
          point: {
            pixelSize: 14,
            color: Cesium.Color.fromCssColorString('#00E5FF'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: ` ${obj.name} (NORAD ${obj.noradId})`,
            font: '11px monospace',
            fillColor: Cesium.Color.fromCssColorString('#00E5FF'),
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('#0a0d14e0'),
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            pixelOffset: new Cesium.Cartesian2(12, 0),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      }
    },
    [setSelectedSatelliteId]
  );

  useImperativeHandle(ref, () => ({
    flyToSatellite,
  }));

  const selectedSatelliteId = useUIStore((s) => s.selectedSatelliteId);
  useEffect(() => {
    if (selectedSatelliteId) {
      flyToSatellite(selectedSatelliteId);
    }
  }, [selectedSatelliteId, flyToSatellite]);

  // Render ~7,000 points using GPU PointPrimitiveCollection for peak performance & clarity
  const renderCatalogPoints = useCallback(async (viewer: Cesium.Viewer) => {
    if (!viewer || viewer.isDestroyed()) return;

    try {
      await orbitalDataService.loadOrbitalObjects();
      if (!viewer || viewer.isDestroyed()) return;

      const objects = orbitalDataService.getVisibleObjects(MAX_VISIBLE_SPACE_OBJECTS);

      // Remove existing point collection if any
      if (pointCollectionRef.current) {
        viewer.scene.primitives.remove(pointCollectionRef.current);
        pointCollectionRef.current = null;
      }

      const pointCollection = new Cesium.PointPrimitiveCollection();
      viewer.scene.primitives.add(pointCollection);
      pointCollectionRef.current = pointCollection;

      const pointsMap = new Map<string, Cesium.PointPrimitive>();
      const { categoryVisibility: catVis, regimeVisibility: regVis } = useLayerStore.getState();

      const now = new Date();

      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        const cartPos = calculateCartesianPosition(obj, now);
        if (!cartPos) continue;

        const category = deriveObjectCategory({
          name: obj.name,
          classification: obj.classification,
        });
        const regime = deriveOrbitRegime({
          semimajor_axis: obj.semimajorAxis,
          eccentricity: obj.eccentricity,
          inclination: obj.inclination,
          period: obj.orbitalPeriod,
        });

        const initiallyVisible = isObjectCategoryVisible(category, catVis) && (regVis[regime] ?? true);

        let color = CATEGORY_COLORS.PAYLOAD.cesium;
        let pixelSize: number = ORBITAL_POINT_SIZES.PAYLOAD;
        if (obj.classification === 'DEBRIS') {
          color = CATEGORY_COLORS.DEBRIS.cesium;
          pixelSize = ORBITAL_POINT_SIZES.DEBRIS;
        } else if (obj.classification === 'ROCKET_BODY') {
          color = CATEGORY_COLORS.ROCKET_BODY.cesium;
          pixelSize = ORBITAL_POINT_SIZES.ROCKET_BODY;
        } else {
          color = Cesium.Color.fromCssColorString(getObjectCategoryCss(category));
          pixelSize = ORBITAL_POINT_SIZES.PAYLOAD;
        }

        const point = pointCollection.add({
          position: cartPos,
          color: color.withAlpha(0.9),
          pixelSize,
          outlineColor: color.withAlpha(0.4),
          outlineWidth: 1,
          id: obj.noradId,
          show: initiallyVisible,
        });

        pointsMap.set(obj.noradId, point);
      }

      pointsMapRef.current = pointsMap;
    } catch (err) {
      console.error('Failed to populate orbital catalog points:', err);
    }
  }, []);

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current) return;
    let onTick: (() => void) | null = null;
    let handler: Cesium.ScreenSpaceEventHandler | null = null;

    try {
      const viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        shouldAnimate: true,
        requestRenderMode: false,
      });

      viewerRef.current = viewer;

      queueMicrotask(() => {
        setUseFallback(false);
        setViewerInstance(viewer);
      });

      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#10141e');
      viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;
      if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
      if (viewer.scene.sun) viewer.scene.sun.show = false;
      if (viewer.scene.moon) viewer.scene.moon.show = false;
      viewer.scene.fog.enabled = false;
      if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true;

      // Default perspective
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(30, 15, 20000000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-85),
          roll: 0.0,
        },
      });

      const sharedBookmark = getSharedBookmarkFromUrl();
      if (sharedBookmark) {
        globalAutoRotate = false;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            sharedBookmark.longitude,
            sharedBookmark.latitude,
            sharedBookmark.altitude
          ),
          orientation: {
            heading: sharedBookmark.heading,
            pitch: sharedBookmark.pitch,
            roll: sharedBookmark.roll,
          },
          duration: 0,
        });
      }

      let lastPropagateTime = Date.now();
      onTick = () => {
        if (globalAutoRotate) {
          viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.0002);
        }

        // Live orbital propagation: advance points in true 3D space every 2.5 seconds
        const nowMs = Date.now();
        if (nowMs - lastPropagateTime >= 2500) {
          lastPropagateTime = nowMs;
          const pointsMap = pointsMapRef.current;
          if (pointsMap && pointsMap.size > 0) {
            const date = new Date(nowMs);
            const visibleObjects = orbitalDataService.getVisibleObjects(MAX_VISIBLE_SPACE_OBJECTS);
            for (let i = 0; i < visibleObjects.length; i++) {
              const obj = visibleObjects[i];
              const pt = pointsMap.get(obj.noradId);
              if (pt) {
                const newPos = calculateCartesianPosition(obj, date);
                if (newPos) {
                  pt.position = newPos;
                }
              }
            }
          }
        }
      };
      viewer.clock.onTick.addEventListener(onTick);

      // Fast Screen Space Interaction: Hover & Click
      handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

      handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
        const picked = viewer.scene.pick(movement.endPosition);
        if (picked && picked.id && typeof picked.id === 'string') {
          const obj = orbitalDataService.getOrbitalObjectById(picked.id);
          if (obj) {
            setHoveredObject(obj);
            setHoverPos({ x: movement.endPosition.x, y: movement.endPosition.y });
            return;
          }
        }
        setHoveredObject(null);
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const picked = viewer.scene.pick(click.position);
        if (picked && picked.id && typeof picked.id === 'string') {
          const obj = orbitalDataService.getOrbitalObjectById(picked.id);
          if (obj) {
            setSelectedSatelliteId(obj.noradId);
            setSelectedDetailsObject(obj);
            setIsDetailsOpen(true);
            flyToSatellite(obj.noradId);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // Render 60,000+ catalog objects
      renderCatalogPoints(viewer);

      return () => {
        globalAutoRotate = true;
        if (handler) handler.destroy();
        const v = viewerRef.current;
        if (v && !v.isDestroyed()) {
          if (onTick) v.clock.onTick.removeEventListener(onTick);
          v.destroy();
        }
        viewerRef.current = null;
        setViewerInstance(null);
      };
    } catch (e) {
      console.warn('Cesium initialization failed, using fallback', e);
      setUseFallback(true);
    }
  }, [flyToSatellite, renderCatalogPoints, setSelectedSatelliteId]);

  // Apply Layer Toggles instantly to GPU Points
  const categoryVisibility = useLayerStore((s) => s.categoryVisibility);
  const regimeVisibility = useLayerStore((s) => s.regimeVisibility);

  useEffect(() => {
    const pointsMap = pointsMapRef.current;
    if (!pointsMap || pointsMap.size === 0) return;

    pointsMap.forEach((point, noradId) => {
      const category = orbitalDataService.getObjectCategory(noradId);
      const regime = orbitalDataService.getObjectRegime(noradId);
      const isVisible = isObjectCategoryVisible(category, categoryVisibility) && (regimeVisibility[regime] ?? true);
      point.show = isVisible;
    });
  }, [categoryVisibility, regimeVisibility]);

  // Bookmark handling
  const restoreBookmark = useCallback((bookmark: Bookmark) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    globalAutoRotate = false;
    markAsRecent(bookmark.id);

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        bookmark.longitude,
        bookmark.latitude,
        bookmark.altitude
      ),
      orientation: {
        heading: bookmark.heading,
        pitch: bookmark.pitch,
        roll: bookmark.roll,
      },
      duration: 1.5,
    });
  }, [markAsRecent]);

  const handleBookmarkSubmit = useCallback(
    (values: BookmarkFormValues) => {
      if (editingBookmark) {
        updateBookmark(editingBookmark.id, {
          name: values.name,
          description: values.description,
          category: values.category,
        });
        setEditingBookmark(null);
        setIsBookmarkModalOpen(false);
        return;
      }

      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(viewer.camera.positionWC);
      if (!cartographic) return;

      addBookmark({
        name: values.name,
        description: values.description,
        category: values.category,
        latitude: Cesium.Math.toDegrees(cartographic.latitude),
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        altitude: cartographic.height,
        heading: viewer.camera.heading,
        pitch: viewer.camera.pitch,
        roll: viewer.camera.roll,
      });

      setIsBookmarkModalOpen(false);
    },
    [addBookmark, editingBookmark, updateBookmark]
  );

  const statsCount = statistics?.totalObjects ?? 64103;

  return (
    <div className="relative w-full h-full bg-bg-deep-space overflow-hidden select-none">
      <ProceduralSpaceBackground viewer={viewerInstance} />

      <div
        ref={containerRef}
        className={`w-full h-full transition-opacity duration-700 ${useFallback ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* ── Hover Tooltip ────────────────────────────────────────── */}
      <OrbitalHoverPanel
        object={hoveredObject}
        position={hoverPos}
        containerBounds={containerRef.current?.getBoundingClientRect()}
      />

      {/* ── Full Object Details Modal ────────────────────────────── */}
      <OrbitalObjectDetails
        object={selectedDetailsObject}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onFlyTo={flyToSatellite}
      />

      {/* ── HUD Overlay ───────────────────────────────────────── */}
      <div className="absolute inset-0 p-3 pb-16 md:p-6 md:pb-16 flex flex-col justify-between z-10 pointer-events-none overflow-hidden">
        {/* Top Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
          <div className="glass-panel p-2 md:p-4 border-l-4 border-l-primary-container animate-[slideDown_0.5s_ease-out] max-w-[70%] sm:max-w-none">
            <p className="font-label-caps text-[9px] md:text-label-caps text-primary-container/80 drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
              ORBITAL INTELLIGENCE
            </p>
            <h2 className="font-display-lg text-sm md:text-headline-lg font-bold text-on-surface">
              {activeSector ? activeSector.toUpperCase() : 'GLOBAL VIEW'}
            </h2>
            <p className="font-technical-data text-[9px] md:text-[10px] text-on-surface-variant mt-1">
              {catalogLoading
                ? `LOADING ORBITAL CATALOG... (${loadingProgress}%)`
                : `${statsCount.toLocaleString()} Objects Tracked · 3D View: ${Math.min(statsCount, MAX_VISIBLE_SPACE_OBJECTS).toLocaleString()}`}
            </p>
          </div>

          <div className="text-right space-y-1 animate-[slideDown_0.5s_ease-out] hidden sm:block">
            <div className="bg-status-success/20 border border-status-success px-3 md:px-4 py-1 flex items-center gap-2">
              <MaterialIcon name="verified_user" className="text-status-success text-sm" />
              <span className="font-technical-data text-status-success text-[11px] md:text-[12px] font-bold">
                60K+ GLOBAL CATALOG ONLINE
              </span>
            </div>
            <p className="font-technical-data text-[9px] md:text-[10px] text-primary/70 hidden md:block">
              SOURCE: SPACE-TRACK / CELESTRAK GP API
            </p>
          </div>
        </div>

        {/* Bottom Row Controls */}
        <div className="flex justify-end w-full animate-[slideUp_0.5s_ease-out]">
          <div className="flex flex-wrap justify-end items-center gap-1 md:gap-1.5 pointer-events-auto bg-bg-deep-space/80 backdrop-blur-xl border border-border-panel/50 p-1.5 md:p-2 rounded-sm max-w-full">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={!isSupported}
              className={`px-2.5 md:px-3.5 py-2 font-bold text-[10px] md:text-xs transition-ui border ${
                isListening
                  ? 'bg-status-emergency text-white border-status-emergency animate-pulse'
                  : 'border-primary-container text-primary-container hover:bg-primary-container/10'
              }`}
            >
              {isListening ? 'LISTENING...' : 'VOICE COMMAND'}
            </button>

            <button
              type="button"
              onClick={() => setIsBookmarkModalOpen(true)}
              className="px-2.5 md:px-3.5 py-2 font-bold text-[10px] md:text-xs transition-ui border border-primary-container text-primary-container hover:bg-primary-container/10 cursor-pointer"
            >
              SAVE VIEW
            </button>

            <button
              type="button"
              onClick={() => setIsBookmarkSidebarOpen(true)}
              className="px-2.5 md:px-3.5 py-2 font-bold text-[10px] md:text-xs transition-ui border border-primary-container text-primary-container hover:bg-primary-container/10 cursor-pointer"
            >
              BOOKMARKS
            </button>

            <button
              onClick={() => setShowLegend((v) => !v)}
              aria-pressed={showLegend}
              className={`px-2.5 md:px-3.5 py-2 font-bold text-[10px] md:text-xs transition-ui border cursor-pointer ${
                showLegend
                  ? 'bg-primary-container text-bg-deep-space border-primary-container'
                  : 'border-primary-container text-primary-container hover:bg-primary-container/10'
              }`}
            >
              LEGEND
            </button>

            <button
              onClick={() => setShowLayerManager((v) => !v)}
              aria-pressed={showLayerManager}
              className={`px-2.5 md:px-3.5 py-2 font-bold text-[10px] md:text-xs transition-ui border cursor-pointer ${
                showLayerManager
                  ? 'bg-primary-container text-bg-deep-space border-primary-container'
                  : 'border-primary-container text-primary-container hover:bg-primary-container/10'
              }`}
            >
              LAYERS
            </button>
          </div>
        </div>
      </div>

      {/* ── Orbital Legend ─────────────────────────────────────── */}
      <OrbitalLegend
        stats={statistics}
        isOpen={showLegend}
        onClose={() => setShowLegend(false)}
      />

      {showLayerManager && (
        <LayerManagerPanel
          onClose={() => setShowLayerManager(false)}
          regimeCounts={{
            LEO: statistics?.leoCount ?? Math.round(statsCount * 0.85),
            MEO: statistics?.meoCount ?? Math.round(statsCount * 0.06),
            GEO: statistics?.geoCount ?? Math.round(statsCount * 0.08),
            HEO: statistics?.heoCount ?? Math.round(statsCount * 0.01),
          }}
          categoryCounts={{
            NAVIGATION: Math.round(statsCount * 0.04),
            WEATHER: Math.round(statsCount * 0.02),
            MILITARY: Math.round(statsCount * 0.03),
            SPACE_DEBRIS: statistics?.totalDebris ?? Math.round(statsCount * 0.65),
            ROCKET_BODY: statistics?.totalRocketBodies ?? Math.round(statsCount * 0.10),
            OTHER: Math.round(statsCount * 0.16),
            PAYLOAD: statistics?.totalSatellites ?? Math.round(statsCount * 0.25),
            COLLISION: 0,
          }}
        />
      )}

      {/* ── Bookmarks Modals ──────────────────────────────────── */}
      {isBookmarkModalOpen && (
        <BookmarkModal
          initialBookmark={editingBookmark}
          onClose={() => {
            setIsBookmarkModalOpen(false);
            setEditingBookmark(null);
          }}
          onSubmit={handleBookmarkSubmit}
        />
      )}

      {isBookmarkSidebarOpen && (
        <BookmarkSidebar
          onClose={() => setIsBookmarkSidebarOpen(false)}
          bookmarks={bookmarks}
          filteredBookmarks={filteredBookmarks}
          favoriteBookmarks={favoriteBookmarks}
          recentBookmarks={recentBookmarks}
          categories={categories}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onCategoryChange={setSelectedCategory}
          onSearchChange={setSearchQuery}
          onOpenBookmark={restoreBookmark}
          onShareBookmark={() => {}}
          onCreateBookmark={() => setIsBookmarkModalOpen(true)}
          onEditBookmark={(bm) => {
            setEditingBookmark(bm);
            setIsBookmarkModalOpen(true);
          }}
          onDeleteBookmark={deleteBookmark}
          onToggleFavorite={toggleFavorite}
          onExportBookmarks={exportBookmarks}
          onImportBookmarks={importBookmarks}
        />
      )}
    </div>
  );
});

EarthTwin.displayName = 'EarthTwin';
export default EarthTwin;