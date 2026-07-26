import * as Cesium from 'cesium';
import type { CatalogObject } from '@/types/satellite';

/**
 * Computes a lightweight polyline for a satellite's orbit path so it can be
 * emphasized while the satellite is hovered/selected.
 *
 * This mirrors the position math used to place satellite points (see
 * EarthTwin.keplerToLatLonAlt) but sweeps the true anomaly across a full
 * revolution while holding "now" fixed, so the drawn ellipse matches the
 * satellite's current ground track shape. It intentionally ignores nodal
 * regression across a single period — a reasonable simplification for a
 * visual highlight rather than a precision propagator.
 */
const EARTH_RADIUS_KM = 6371;
const ORBIT_SAMPLE_STEPS = 90;

export function computeOrbitPositions(obj: CatalogObject): Cesium.Cartesian3[] | null {
  if (
    obj.semimajor_axis == null ||
    obj.inclination == null ||
    obj.raan == null ||
    obj.arg_of_perigee == null ||
    obj.mean_motion == null
  ) {
    return null;
  }

  const alt = obj.semimajor_axis - EARTH_RADIUS_KM;
  if (alt < 0 || alt > 100000) return null;

  const ecc = obj.eccentricity ?? 0;
  const raanRad = (obj.raan * Math.PI) / 180;
  const incRad = (obj.inclination * Math.PI) / 180;
  const argPerigeeRad = (obj.arg_of_perigee * Math.PI) / 180;

  const now = new Date();
  const J2000 = new Date('2000-01-01T12:00:00Z').getTime();
  const daysSinceJ2000 = (now.getTime() - J2000) / 86400000;
  const GMST = (280.46061837 + 360.98564736629 * daysSinceJ2000) % 360;

  const positions: Cesium.Cartesian3[] = [];

  for (let i = 0; i <= ORBIT_SAMPLE_STEPS; i++) {
    const meanAnomaly = ((i / ORBIT_SAMPLE_STEPS) * 360 * Math.PI) / 180;
    const trueAnomaly = meanAnomaly + 2 * ecc * Math.sin(meanAnomaly);
    const argLat = argPerigeeRad + trueAnomaly;

    // Geocentric distance varies with true anomaly for eccentric orbits:
    // r = a(1 - e^2) / (1 + e*cos(ν)). At ecc=0 this reduces to the
    // constant-radius circular case.
    const radiusKm = (obj.semimajor_axis * (1 - ecc * ecc)) / (1 + ecc * Math.cos(trueAnomaly));
    const pointAlt = radiusKm - EARTH_RADIUS_KM;

    const lon =
      ((((Math.atan2(Math.cos(incRad) * Math.sin(argLat), Math.cos(argLat)) * 180) / Math.PI +
        (raanRad * 180) / Math.PI -
        GMST +
        540) %
        360) -
        180);
    const lat = (Math.asin(Math.sin(incRad) * Math.sin(argLat)) * 180) / Math.PI;

    positions.push(Cesium.Cartesian3.fromDegrees(lon, lat, pointAlt * 1000));
  }

  return positions;
}

interface OrbitHighlightOptions {
  color: Cesium.Color;
  isCollisionRisk?: boolean;
}

const ORBIT_ENTITY_ID = '__spotlight_orbit_highlight__';

/**
 * Adds (or replaces) the single orbit-highlight polyline entity on the
 * viewer. Only one orbit is ever highlighted at a time, so this removes any
 * previous instance first — cheap, since it's only called on
 * hover/selection change, never per frame.
 */
export function setOrbitHighlight(
  viewer: Cesium.Viewer,
  obj: CatalogObject | null,
  options: OrbitHighlightOptions
): void {
  if (viewer.isDestroyed()) return;

  const existing = viewer.entities.getById(ORBIT_ENTITY_ID);
  if (existing) viewer.entities.remove(existing);

  if (!obj) return;

  const positions = computeOrbitPositions(obj);
  if (!positions) return;

  const width = options.isCollisionRisk ? 3.5 : 2.5;
  const glowPower = options.isCollisionRisk ? 0.35 : 0.2;

  viewer.entities.add({
    id: ORBIT_ENTITY_ID,
    polyline: {
      positions,
      width,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower,
        color: options.color.withAlpha(0.9),
      }),
      clampToGround: false,
    },
  });
}

export function clearOrbitHighlight(viewer: Cesium.Viewer): void {
  if (viewer.isDestroyed()) return;
  const existing = viewer.entities.getById(ORBIT_ENTITY_ID);
  if (existing) viewer.entities.remove(existing);
}
