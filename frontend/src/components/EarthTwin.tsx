import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { MaterialIcon } from './MaterialIcon';
import * as Cesium from 'cesium';

interface CatalogObject {
  id: number;
  name: string;
  catalog_number: string;
  classification: 'PAYLOAD' | 'DEBRIS' | 'ROCKET_BODY' | 'UNKNOWN';
  epoch: string | null;
  inclination: number | null;
  eccentricity: number | null;
  semimajor_axis: number | null;
  raan: number | null;
  arg_of_perigee: number | null;
  mean_anomaly: number | null;
  mean_motion: number | null;
  period: number | null;
  has_tle: boolean;
  updated_at: string | null;
}

interface CollisionRisk {
  id: number;
  object_a: { name: string; catalog_number: string } | null;
  object_b: { name: string; catalog_number: string } | null;
  probability: number;
  miss_distance_m: number;
  relative_velocity_kms: number;
  risk_level: string;
  tca: string;
}



function keplerToLatLonAlt(obj: CatalogObject, timeOffsetSec: number = 0): { lat: number; lon: number; alt: number } | null {
  if (obj.semimajor_axis == null || obj.inclination == null || obj.raan == null ||
      obj.arg_of_perigee == null || obj.mean_anomaly == null || obj.mean_motion == null) {
    return null;
  }

  const EARTH_RADIUS = 6371; 
  const alt = obj.semimajor_axis - EARTH_RADIUS;
  if (alt < 0 || alt > 100000) return null;

  
  const epochDate = obj.epoch ? new Date(obj.epoch) : new Date();
  const now = new Date();
  const elapsedDays = (now.getTime() - epochDate.getTime()) / 86400000 + (timeOffsetSec / 86400);
  const meanMotionRadPerSec = (obj.mean_motion * 2 * Math.PI) / 86400;
  const currentMeanAnomaly = ((obj.mean_anomaly + (elapsedDays * obj.mean_motion * 360)) % 360) * Math.PI / 180;

  
  const ecc = obj.eccentricity ?? 0;
  const trueAnomaly = currentMeanAnomaly + 2 * ecc * Math.sin(currentMeanAnomaly);

  
  const argLat = (obj.arg_of_perigee * Math.PI / 180) + trueAnomaly;

  
  const raanRad = obj.raan * Math.PI / 180;
  const incRad = obj.inclination * Math.PI / 180;

  
  const J2000 = new Date('2000-01-01T12:00:00Z').getTime();
  const daysSinceJ2000 = (now.getTime() + timeOffsetSec * 1000 - J2000) / 86400000;
  const GMST = (280.46061837 + 360.98564736629 * daysSinceJ2000) % 360;

  const lon = ((Math.atan2(
    Math.cos(incRad) * Math.sin(argLat),
    Math.cos(argLat)
  ) * 180 / Math.PI + (raanRad * 180 / Math.PI) - GMST + 540) % 360) - 180;

  const lat = Math.asin(Math.sin(incRad) * Math.sin(argLat)) * 180 / Math.PI;

  return { lat, lon, alt };
}


const CATEGORY_COLORS = {
  PAYLOAD:     { css: '#00E5FF', cesium: Cesium.Color.fromCssColorString('#00E5FF'), label: 'Active Satellites', icon: 'satellite_alt' },
  DEBRIS:      { css: '#FFAA00', cesium: Cesium.Color.fromCssColorString('#FFAA00'), label: 'Debris Objects',    icon: 'delete_sweep' },
  ROCKET_BODY: { css: '#FF4444', cesium: Cesium.Color.fromCssColorString('#FF4444'), label: 'Rocket Bodies',     icon: 'rocket' },
  UNKNOWN:     { css: '#888888', cesium: Cesium.Color.fromCssColorString('#888888'), label: 'Unknown Objects',   icon: 'help_outline' },
  COLLISION:   { css: '#FF0000', cesium: Cesium.Color.fromCssColorString('#FF0000'), label: 'Collision Risk',    icon: 'warning' },
  SELECTED:    { css: '#00E5FF', cesium: Cesium.Color.fromCssColorString('#00E5FF'), label: 'Selected',          icon: 'gps_fixed' },
} as const;

function getPointSize(classification: string): number {
  switch (classification) {
    case 'PAYLOAD':     return 5;
    case 'DEBRIS':      return 4;
    case 'ROCKET_BODY': return 6;
    default:            return 3;
  }
}

function getOutlineWidth(classification: string): number {
  switch (classification) {
    case 'PAYLOAD':     return 1;
    case 'DEBRIS':      return 1;
    case 'ROCKET_BODY': return 2;
    default:            return 1;
  }
}


const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

async function fetchAllCatalogObjects(): Promise<CatalogObject[]> {
  const res = await fetch(`${API_BASE}/catalog/objects?size=500&page=1`);
  const json = await res.json();
  return json.data ?? [];
}

async function fetchCollisions(): Promise<CollisionRisk[]> {
  const res = await fetch(`${API_BASE}/collisions?size=50`);
  const json = await res.json();
  return json.data ?? [];
}

const LegendCardSkeleton = () => (
  <div className="min-w-[200px] glass-panel p-4 animate-pulse bg-surface-container/40 h-48" />
);

export const EarthTwin: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { activeSector, setSelectedSatelliteId } = useUIStore();
  const [useFallback, setUseFallback] = useState(true);
  const [hoveredObject, setHoveredObject] = useState<CatalogObject | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [showLegend, setShowLegend] = useState(true);
  const [showDensity, setShowDensity] = useState(false);
  const [showRiskOverlay, setShowRiskOverlay] = useState(false);
  const [objectCounts, setObjectCounts] = useState({ payloads: 0, debris: 0, rocketBodies: 0, total: 0, collisions: 0 });
  const [dataLoaded, setDataLoaded] = useState(false);

  
  const [stats, setStats] = useState({
    totalObjects: 0,
    lastSync: '',
    weatherIndex: 'K0',
  });

  
  const populateEntities = useCallback(async (viewer: Cesium.Viewer) => {
    try {
      if (!viewer || viewer.isDestroyed()) return;

      const [objects, collisions] = await Promise.all([
        fetchAllCatalogObjects(),
        fetchCollisions(),
      ]);

      
      const collisionCatNums = new Set<string>();
      collisions.forEach(c => {
        if (c.object_a?.catalog_number) collisionCatNums.add(c.object_a.catalog_number);
        if (c.object_b?.catalog_number) collisionCatNums.add(c.object_b.catalog_number);
      });

      let payloads = 0, debris = 0, rocketBodies = 0;
      const entityMap = new Map<string, Cesium.Entity>();

      
      if (!viewer || viewer.isDestroyed()) return;

      
      viewer.entities.removeAll();

      objects.forEach(obj => {
        const pos = keplerToLatLonAlt(obj);
        if (!pos) return;

        
        if (obj.classification === 'PAYLOAD') payloads++;
        else if (obj.classification === 'DEBRIS') debris++;
        else if (obj.classification === 'ROCKET_BODY') rocketBodies++;

        
        const isCollisionRisk = collisionCatNums.has(obj.catalog_number);
        const colorConfig = isCollisionRisk
          ? CATEGORY_COLORS.COLLISION
          : CATEGORY_COLORS[obj.classification] ?? CATEGORY_COLORS.UNKNOWN;

        const pixelSize = isCollisionRisk ? 8 : getPointSize(obj.classification);
        const outlineWidth = isCollisionRisk ? 3 : getOutlineWidth(obj.classification);

        const entity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt * 1000),
          point: {
            pixelSize,
            color: colorConfig.cesium.withAlpha(0.85),
            outlineColor: colorConfig.cesium.withAlpha(0.4),
            outlineWidth,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scaleByDistance: new Cesium.NearFarScalar(1e6, 1.5, 5e7, 0.4),
          },
          properties: new Cesium.PropertyBag({
            catalogData: JSON.stringify(obj),
            objectType: obj.classification,
            isCollisionRisk,
          }),
          label: {
            text: '',
            show: false,
          },
        });

        entityMap.set(obj.catalog_number, entity);
      });

      
      collisions.forEach(conj => {
        if (!conj.object_a || !conj.object_b) return;
        const entityA = entityMap.get(conj.object_a.catalog_number);
        const entityB = entityMap.get(conj.object_b.catalog_number);
        if (!entityA?.position || !entityB?.position) return;

        const posA = entityA.position.getValue(Cesium.JulianDate.now());
        const posB = entityB.position.getValue(Cesium.JulianDate.now());
        if (!posA || !posB) return;

        viewer.entities.add({
          polyline: {
            positions: [posA, posB],
            width: 2,
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.RED.withAlpha(0.7),
              dashLength: 8,
            }),
          },
        });
      });

      entitiesRef.current = entityMap;
      setObjectCounts({
        payloads,
        debris,
        rocketBodies,
        total: objects.length,
        collisions: collisions.length,
      });
      setStats({
        totalObjects: objects.length,
        lastSync: new Date().toLocaleTimeString(),
        weatherIndex: 'K3',
      });
      setDataLoaded(true);

    } catch (err) {
      console.error('Failed to load orbital data for visualization:', err);
    }
  }, []);

  
  useEffect(() => {
    if (!containerRef.current || !Cesium) return;
    if (viewerRef.current && !viewerRef.current.isDestroyed()) return;

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
        navigationInstructionsInitiallyVisible: false,
        scene3DOnly: true,
        shouldAnimate: true,
      });

      viewerRef.current = viewer;
      setUseFallback(false);

      
      viewer.scene.globe.enableLighting = false;
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#050710');
      viewer.scene.fog.enabled = false;
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = true;
      }

      
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(30, 15, 20000000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-85),
          roll: 0.0,
        },
      });

      
      onTick = () => {
        viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.0003);
      };
      viewer.clock.onTick.addEventListener(onTick);

      
      handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

      handler.setInputAction((movement: { endPosition: Cesium.Cartesian2 }) => {
        const picked = viewer.scene.pick(movement.endPosition);
        if (Cesium.defined(picked) && picked.id && picked.id.properties) {
          try {
            const rawData = picked.id.properties.catalogData?.getValue(Cesium.JulianDate.now());
            if (rawData) {
              const obj = JSON.parse(rawData) as CatalogObject;
              setHoveredObject(obj);
              setTooltipPos({ x: movement.endPosition.x + 15, y: movement.endPosition.y - 10 });
            }
          } catch { }
        } else {
          setHoveredObject(null);
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      
      handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
        const picked = viewer.scene.pick(click.position);
        if (Cesium.defined(picked) && picked.id && picked.id.properties) {
          try {
            const rawData = picked.id.properties.catalogData?.getValue(Cesium.JulianDate.now());
            if (rawData) {
              const obj = JSON.parse(rawData) as CatalogObject;
              setSelectedSatelliteId(obj.catalog_number);

              
              const pos = keplerToLatLonAlt(obj);
              if (pos) {
                viewer.camera.flyTo({
                  destination: Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt * 1000 + 2000000),
                  duration: 1.5,
                });
              }
            }
          } catch { }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      
      populateEntities(viewer);

      
      const refreshInterval = setInterval(() => {
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          populateEntities(viewerRef.current);
        }
      }, 5 * 60_000);

      return () => {
        clearInterval(refreshInterval);
        if (handler) handler.destroy();
        const v = viewerRef.current;
        if (v && !v.isDestroyed()) {
          if (onTick) v.clock.onTick.removeEventListener(onTick);
          v.destroy();
        }
        viewerRef.current = null;
      };

    } catch (e) {
      console.warn('Cesium initialization failed, using fallback', e);
      setUseFallback(true);
    }
  }, []); 

  return (
    <div className="relative w-full h-full overflow-hidden bg-bg-deep-space border-b border-border-panel">
      {/* 3D Cesium Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* High-Fidelity SVG Fallback */}
      {useFallback && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(5,7,10,0.8)_0%,#000000_100%)]">
          <img
            src="https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=1200&q=80"
            alt="3D Earth Twin"
            className="w-full h-full object-cover opacity-60 brightness-75 contrast-125 select-none"
          />
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <circle cx="50%" cy="50%" r="200" fill="none" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="0.75" strokeDasharray="10 5" className="animate-[spin_40s_linear_infinite]" />
            <circle cx="50%" cy="50%" r="240" fill="none" stroke="rgba(0, 229, 255, 0.15)" strokeWidth="0.5" strokeDasharray="5 15" className="animate-[spin_60s_linear_infinite_reverse]" />
            <path d="M 45% 45% L 55% 55%" stroke="#FF3B30" strokeWidth="1" strokeDasharray="4 2" className="animate-pulse" />
            <circle cx="45%" cy="45%" r="5" fill="#FF3B30" className="animate-pulse-critical" />
            <circle cx="55%" cy="55%" r="5" fill="#FF3B30" className="animate-pulse-critical" style={{ animationDelay: '0.5s' }} />
            <ellipse cx="50%" cy="50%" rx="350" ry="120" fill="none" stroke="rgba(0, 229, 255, 0.2)" strokeWidth="1" transform="rotate(-15 640 200)" />
          </svg>
        </div>
      )}

      {/* ── Hover Tooltip (Glassmorphism) ──────────────────────── */}
      {hoveredObject && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none animate-[fadeIn_0.15s_ease-out]"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="bg-bg-deep-space/90 backdrop-blur-xl border border-primary-container/30 p-3 min-w-[240px] shadow-[0_0_30px_rgba(0,229,255,0.15)]">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: CATEGORY_COLORS[hoveredObject.classification]?.css ?? '#888' }}
              />
              <span className="font-technical-data text-xs font-bold text-primary-container">
                {hoveredObject.name}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-technical-data text-[10px]">
              {[
                ['NORAD ID', hoveredObject.catalog_number],
                ['TYPE', hoveredObject.classification],
                ['ALTITUDE', hoveredObject.semimajor_axis ? `${Math.round(hoveredObject.semimajor_axis - 6371).toLocaleString()} km` : '—'],
                ['INCLINATION', hoveredObject.inclination != null ? `${hoveredObject.inclination.toFixed(2)}°` : '—'],
                ['MEAN MOTION', hoveredObject.mean_motion != null ? `${hoveredObject.mean_motion.toFixed(4)} rev/d` : '—'],
                ['PERIOD', hoveredObject.period != null ? `${hoveredObject.period.toFixed(1)} min` : '—'],
                ['EPOCH', hoveredObject.epoch ? new Date(hoveredObject.epoch).toISOString().substring(0, 10) : '—'],
                ['ECCENTRICITY', hoveredObject.eccentricity != null ? hoveredObject.eccentricity.toFixed(6) : '—'],
              ].map(([label, val]) => (
                <React.Fragment key={label}>
                  <span className="text-on-surface-variant/60">{label}</span>
                  <span className="text-on-surface font-semibold">{val}</span>
                </React.Fragment>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-primary-container/20 text-[9px] text-primary/50 font-technical-data">
              Click to select · Source: Space-Track GP API
            </div>
          </div>
        </div>
      )}

      {/* ── HUD Overlay ───────────────────────────────────────── */}
      <div className="absolute inset-0 p-3 md:p-6 flex flex-col justify-between z-10 pointer-events-none overflow-hidden">

        {/* Top Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
          <div className="glass-panel p-2 md:p-4 border-l-4 border-l-primary-container animate-[slideDown_0.5s_ease-out] max-w-[70%] sm:max-w-none">
            <p className="font-label-caps text-[9px] md:text-label-caps text-primary-container/80 drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
              ORBITAL INTELLIGENCE
            </p>
            <h2 className="font-display-lg text-sm md:text-headline-lg font-bold text-on-surface">
              {activeSector ? activeSector.toUpperCase() : 'GLOBAL VIEW'}
            </h2>
            {dataLoaded && (
              <p className="font-technical-data text-[9px] md:text-[10px] text-on-surface-variant mt-1">
                {objectCounts.total.toLocaleString()} objects tracked · Synced {stats.lastSync}
              </p>
            )}
          </div>

          <div className="text-right space-y-1 animate-[slideDown_0.5s_ease-out] hidden sm:block">
          {dataLoaded ? (
            <>
            {objectCounts.collisions > 0 ? (
              <div className="bg-status-emergency/20 border border-status-emergency px-3 md:px-4 py-1 flex items-center gap-2 drop-shadow-[0_0_12px_rgba(255,59,48,0.4)]">
                <MaterialIcon name="warning" className="text-status-emergency text-sm animate-pulse" />
                <span className="font-technical-data text-status-emergency text-[11px] md:text-[12px] font-bold">
                  {objectCounts.collisions} ACTIVE CONJUNCTION{objectCounts.collisions !== 1 ? 'S' : ''}
                </span>
              </div>
            ) : (
              <div className="bg-status-success/20 border border-status-success px-3 md:px-4 py-1 flex items-center gap-2">
                <MaterialIcon name="verified_user" className="text-status-success text-sm" />
                <span className="font-technical-data text-status-success text-[11px] md:text-[12px] font-bold">
                  ALL CLEAR
                </span>
              </div>
            )}
            </>
          ) : (
            <>
            <div className="w-full h-8 bg-surface-container/80 animate-pulse" />
            <div className="w-full h-4 bg-surface-container/80 animate-pulse" />
            </>
          ) }
            <p className={`font-technical-data text-[9px] md:text-[10px] text-primary/70 hidden md:block transition-opacity duration-500 ${dataLoaded ? 'opacity-100' : 'opacity-0'}`}>
              WEATHER: {stats.weatherIndex} · DATA SOURCE: SPACE-TRACK / NASA DONKI
            </p>

          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-start sm:items-end justify-between animate-[slideUp_0.5s_ease-out]">
          <div className="flex gap-4 md:gap-8 flex-wrap">
            {!dataLoaded && !useFallback ? (
              <div className="min-w-[250px] p-4 animate-pulse bg-surface-container/80 h-12" />
            ) : (
              <>
            <div className="space-y-0.5">
              <p className="font-label-caps text-[9px] md:text-[10px] text-primary/70 uppercase">Objects Tracked</p>
              <p className="font-headline-lg text-primary text-xl md:text-3xl font-bold font-technical-data drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
                {objectCounts.total.toLocaleString()}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="font-label-caps text-[9px] md:text-[10px] text-primary/70 uppercase">Debris</p>
              <p className="font-headline-lg text-status-warning text-xl md:text-3xl font-bold font-technical-data drop-shadow-[0_0_8px_rgba(255,170,0,0.4)]">
                {objectCounts.debris.toLocaleString()}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="font-label-caps text-[9px] md:text-[10px] text-primary/70 uppercase">Collision Risks</p>
              <p className={`font-headline-lg text-xl md:text-3xl font-bold font-technical-data ${objectCounts.collisions > 0 ? 'text-status-emergency animate-pulse drop-shadow-[0_0_8px_rgba(255,59,48,0.6)]' : 'text-status-success drop-shadow-[0_0_8px_rgba(0,255,136,0.4)]'}`}>
                {objectCounts.collisions}
              </p>
            </div>
            </>
            )
          }
          </div>

          {/* Controls */}
          <div className="flex gap-1.5 md:gap-2 pointer-events-auto">
            <button
              onClick={() => setShowLegend(v => !v)}
              className={`px-2.5 md:px-4 py-2 md:py-2.5 font-bold text-[10px] md:text-xs transition-all active:scale-95 cursor-pointer border ${
                showLegend ? 'bg-primary-container text-bg-deep-space border-primary-container' : 'border-primary-container text-primary-container hover:bg-primary-container/10'
              }`}
            >
              LEGEND
            </button>
            <button
              onClick={() => setShowDensity(v => !v)}
              className={`px-2.5 md:px-4 py-2 md:py-2.5 font-bold text-[10px] md:text-xs transition-all active:scale-95 cursor-pointer border ${
                showDensity ? 'bg-status-warning text-bg-deep-space border-status-warning' : 'border-status-warning/50 text-status-warning hover:bg-status-warning/10'
              }`}
            >
              DENSITY
            </button>
            <button
              onClick={() => setShowRiskOverlay(v => !v)}
              className={`px-2.5 md:px-4 py-2 md:py-2.5 font-bold text-[10px] md:text-xs transition-all active:scale-95 cursor-pointer border ${
                showRiskOverlay ? 'bg-status-emergency text-white border-status-emergency' : 'border-status-emergency/50 text-status-emergency hover:bg-status-emergency/10'
              }`}
            >
              RISK
            </button>
          </div>
        </div>
      </div>

      {/* ── Legend Panel ───────────────────────────────────────── */}
      {showLegend && (
        <div className="absolute bottom-16 md:bottom-24 left-3 md:left-6 z-20 pointer-events-auto animate-[slideUp_0.3s_ease-out]">
          {dataLoaded ? (
          <div className="bg-bg-deep-space/90 backdrop-blur-xl border border-border-panel p-4 min-w-[200px] shadow-[0_0_30px_rgba(0,0,0,0.6)]">
            <div className="flex justify-between items-center mb-3">
              <span className="font-label-caps text-[10px] text-primary-container font-bold tracking-widest">ORBITAL LEGEND</span>
              <button onClick={() => setShowLegend(false)} className="text-on-surface-variant/60 hover:text-on-surface cursor-pointer">
                <MaterialIcon name="close" className="text-xs" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { color: CATEGORY_COLORS.PAYLOAD.css,     label: 'Active Satellites', count: objectCounts.payloads },
                { color: CATEGORY_COLORS.DEBRIS.css,      label: 'Debris Objects',    count: objectCounts.debris },
                { color: CATEGORY_COLORS.ROCKET_BODY.css, label: 'Rocket Bodies',     count: objectCounts.rocketBodies },
                { color: CATEGORY_COLORS.COLLISION.css,    label: 'Collision Risks',   count: objectCounts.collisions },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}60` }}
                    />
                    <span className="font-technical-data text-[11px] text-on-surface-variant">{item.label}</span>
                  </div>
                  <span className="font-technical-data text-[11px] font-bold text-on-surface">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-border-panel/40 text-[9px] text-on-surface-variant/50 font-technical-data">
              All positions from real orbital elements
            </div>
          </div>
          ) : (<LegendCardSkeleton />) }
        </div>
      )}
      {/* ── Inline Styles for Animations ──────────────────────── */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
export default EarthTwin;
