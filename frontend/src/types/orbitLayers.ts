export type OrbitRegime = 'LEO' | 'MEO' | 'GEO' | 'HEO';

export const ORBIT_REGIMES: OrbitRegime[] = ['LEO', 'MEO', 'GEO', 'HEO'];

export const ORBIT_REGIME_LABELS: Record<OrbitRegime, string> = {
  LEO: 'Low Earth Orbit',
  MEO: 'Medium Earth Orbit',
  GEO: 'Geostationary Orbit',
  HEO: 'Highly Elliptical Orbit',
};

const EARTH_RADIUS_KM = 6371;
const HEO_ECCENTRICITY_THRESHOLD = 0.25;
const GEO_ALTITUDE_MIN_KM = 35586;
const MEO_ALTITUDE_MIN_KM = 2000;

/**
 * Orbit regime isn't a field the backend provides, so it's derived from the
 * same Keplerian elements EarthTwin already uses to place objects on the
 * globe. Eccentricity is checked first so a highly elliptical orbit is
 * classified as HEO regardless of which altitude band its semimajor axis
 * falls into (a Molniya-type orbit's SMA can land in the MEO band).
 */
export function deriveOrbitRegime(obj: {
  semimajor_axis: number | null;
  eccentricity: number | null;
  inclination?: number | null;
  period?: number | null;
}): OrbitRegime {
  if (obj.semimajor_axis == null) return 'LEO';

  const altitude = obj.semimajor_axis - EARTH_RADIUS_KM;
  const eccentricity = obj.eccentricity ?? 0;

  if (eccentricity > HEO_ECCENTRICITY_THRESHOLD) return 'HEO';
  if (altitude >= GEO_ALTITUDE_MIN_KM) return 'GEO';
  if (altitude >= MEO_ALTITUDE_MIN_KM) return 'MEO';
  return 'LEO';
}
