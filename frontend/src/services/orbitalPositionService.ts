/**
 * Kepler Orbital Position Service
 * Converts Keplerian orbital elements into real-time Geodetic (Lat/Lon/Alt) and Cartesian3 coordinates.
 */

import * as Cesium from 'cesium';
import type { OrbitalObject } from '@/types/orbital';

const EARTH_RADIUS_KM = 6371.0;
const J2000 = new Date('2000-01-01T12:00:00Z').getTime();

export interface GeodeticPosition {
  lat: number;
  lon: number;
  alt: number; // in km
}

/**
 * Propagate Keplerian orbital elements to Geodetic (lat, lon, altKm)
 */
export function calculateOrbitalPosition(
  obj: OrbitalObject,
  now: Date = new Date(),
  timeOffsetSec: number = 0
): GeodeticPosition | null {
  if (
    obj.semimajorAxis == null ||
    obj.inclination == null ||
    obj.raan == null ||
    obj.argumentOfPerigee == null ||
    obj.meanAnomaly == null ||
    obj.meanMotion == null
  ) {
    return null;
  }

  const alt = obj.semimajorAxis - EARTH_RADIUS_KM;
  if (alt < 0 || alt > 100000) return null;

  const epochDate = obj.epoch ? new Date(obj.epoch) : now;
  const elapsedDays = (now.getTime() - epochDate.getTime()) / 86400000 + timeOffsetSec / 86400;
  const currentMeanAnomaly =
    (((obj.meanAnomaly + elapsedDays * obj.meanMotion * 360) % 360) * Math.PI) / 180;

  const ecc = obj.eccentricity ?? 0;
  // First-order approximation of Kepler's equation for true anomaly
  const trueAnomaly = currentMeanAnomaly + 2 * ecc * Math.sin(currentMeanAnomaly);

  const argLat = (obj.argumentOfPerigee * Math.PI) / 180 + trueAnomaly;
  const raanRad = (obj.raan * Math.PI) / 180;
  const incRad = (obj.inclination * Math.PI) / 180;

  const daysSinceJ2000 = (now.getTime() + timeOffsetSec * 1000 - J2000) / 86400000;
  const gmst = (280.46061837 + 360.98564736629 * daysSinceJ2000) % 360;

  const lon =
    (((Math.atan2(Math.cos(incRad) * Math.sin(argLat), Math.cos(argLat)) * 180) / Math.PI +
      (raanRad * 180) / Math.PI -
      gmst +
      540) %
      360) -
    180;

  const lat = (Math.asin(Math.sin(incRad) * Math.sin(argLat)) * 180) / Math.PI;

  return { lat, lon, alt };
}

/**
 * Calculates Cesium Cartesian3 vector for direct 3D rendering
 */
export function calculateCartesianPosition(
  obj: OrbitalObject,
  now: Date = new Date(),
  timeOffsetSec: number = 0
): Cesium.Cartesian3 | null {
  const geo = calculateOrbitalPosition(obj, now, timeOffsetSec);
  if (!geo) return null;
  return Cesium.Cartesian3.fromDegrees(geo.lon, geo.lat, geo.alt * 1000.0);
}

/**
 * Calculates estimated orbital velocity in km/s (Vis-Viva equation)
 */
export function calculateOrbitalVelocity(smaKm: number, altKm: number): number {
  const r = EARTH_RADIUS_KM + altKm;
  const mu = 398600.4418;
  const vSq = mu * (2 / r - 1 / smaKm);
  return vSq > 0 ? Math.sqrt(vSq) : 7.5;
}
