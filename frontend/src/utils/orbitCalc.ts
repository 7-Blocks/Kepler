import type { CatalogObject } from '@/types/satellite';

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates current or future position based on Keplerian elements.
 * @param obj The satellite object containing orbital elements.
 * @param timeOffsetSec Number of seconds into the future to propagate (0 for now).
 * @returns The latitude, longitude (in degrees), and altitude (in km) or null if invalid.
 */
export function keplerToLatLonAlt(obj: CatalogObject, timeOffsetSec: number = 0): { lat: number; lon: number; alt: number } | null {
  if (obj.semimajor_axis == null || obj.inclination == null || obj.raan == null ||
    obj.arg_of_perigee == null || obj.mean_anomaly == null || obj.mean_motion == null) {
    return null;
  }

  const alt = obj.semimajor_axis - EARTH_RADIUS_KM;
  if (alt < 0 || alt > 100000) return null;

  const epochDate = obj.epoch ? new Date(obj.epoch) : new Date();
  const now = new Date();
  const elapsedDays = (now.getTime() - epochDate.getTime()) / 86400000 + (timeOffsetSec / 86400);
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

/**
 * Calculates the great-circle distance between two points on Earth using the Haversine formula.
 */
export function calculateGroundDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Computes the elevation angle of a satellite from a ground observer.
 * @param satelliteAltKm The altitude of the satellite in km.
 * @param groundDistanceKm The great circle ground distance from the observer to the satellite's nadir (sub-satellite point).
 * @returns Elevation angle in degrees (0 is on horizon, 90 is directly overhead).
 */
export function calculateElevationAngle(satelliteAltKm: number, groundDistanceKm: number): number {
  const rE = EARTH_RADIUS_KM;
  const rS = EARTH_RADIUS_KM + satelliteAltKm;
  
  // Central angle between observer and satellite's nadir
  const gammaRad = groundDistanceKm / rE;
  
  // Slant range (distance from observer to satellite)
  const d = Math.sqrt(rE ** 2 + rS ** 2 - 2 * rE * rS * Math.cos(gammaRad));
  
  // Elevation angle calculation
  const cosEl = (rS * Math.sin(gammaRad)) / d;
  
  let elRad = Math.acos(cosEl);
  
  // If gamma > 90 deg, the satellite is definitely below the horizon, but Math.acos handles 0 to PI.
  // Actually, wait, a standard way is to use atan2 or just simple geometry:
  // el = atan( (cos(gamma) - (rE / rS)) / sin(gamma) )
  
  const el = Math.atan2(Math.cos(gammaRad) - (rE / rS), Math.sin(gammaRad));
  return el * (180 / Math.PI);
}
