/**
 * Canonical TypeScript Interfaces for Kepler's 60,000+ Orbital Catalog
 */

import type { ObjectCategory } from './objectCategories';
import type { OrbitRegime } from './orbitLayers';

export type ObjectType = 'SATELLITE' | 'DEBRIS' | 'ROCKET_BODY' | 'PAYLOAD' | 'UNKNOWN';
export type ObjectClassification = 'PAYLOAD' | 'DEBRIS' | 'ROCKET_BODY' | 'UNKNOWN';
export type ObjectStatus = 'ACTIVE' | 'INACTIVE' | 'DECAYED' | 'UNKNOWN';

export interface OrbitalObject {
  id: number;
  noradId: string;
  name: string;
  type: ObjectType;
  country?: string | null;
  owner?: string | null;
  status: ObjectStatus;
  classification: ObjectClassification;

  // Orbital Elements (Keplerian)
  epoch: string | null;
  inclination: number | null;
  eccentricity: number | null;
  semimajorAxis: number | null;
  raan: number | null;
  argumentOfPerigee: number | null;
  meanAnomaly: number | null;
  meanMotion: number | null;
  orbitalPeriod: number | null;

  // TLE Lines (optional)
  tleLine1?: string | null;
  tleLine2?: string | null;

  // Real-time calculated state (inferred/cached)
  latitude?: number | null;
  longitude?: number | null;
  altitude?: number | null;
  velocity?: number | null;

  // Metadata
  source: string;
  lastUpdated: string | null;

  // Optional attributes
  launchDate?: string | null;
  launchSite?: string | null;
  decayDate?: string | null;
  purpose?: string | null;
  operator?: string | null;
  cosparId?: string | null;
}

export interface OrbitalStatistics {
  totalObjects: number;
  totalSatellites: number;
  totalDebris: number;
  totalRocketBodies: number;
  totalPayloads: number;
  activeObjects: number;
  unknownObjects: number;
  lastUpdated?: string;
  source?: string;
  leoCount?: number;
  meoCount?: number;
  geoCount?: number;
  heoCount?: number;
}

export interface OrbitalFilters {
  objectType: 'ALL' | ObjectType;
  category?: 'ALL' | ObjectCategory;
  regime?: 'ALL' | OrbitRegime;
  status?: 'ALL' | ObjectStatus;
  searchQuery: string;
  minAltitudeKm?: number;
  maxAltitudeKm?: number;
  country?: string;
}

/**
 * Standard Object Classification Resolver
 */
export function getObjectType(obj: { classification?: string; type?: string; name?: string }): ObjectType {
  if (obj.type === 'SATELLITE' || obj.type === 'DEBRIS' || obj.type === 'ROCKET_BODY' || obj.type === 'PAYLOAD') {
    return obj.type;
  }
  if (obj.classification === 'DEBRIS') return 'DEBRIS';
  if (obj.classification === 'ROCKET_BODY') return 'ROCKET_BODY';
  if (obj.classification === 'PAYLOAD') return 'PAYLOAD';

  const name = (obj.name ?? '').toUpperCase();
  if (name.includes('DEB') || name.includes('DEBRIS')) return 'DEBRIS';
  if (name.includes('R/B') || name.includes('ROCKET')) return 'ROCKET_BODY';
  return 'SATELLITE';
}

/**
 * Compact Minified JSON schema unpacker
 */
export interface MinifiedOrbitalCatalog {
  schema: string[];
  data: (string | number)[][];
}

export function unpackMinifiedRow(row: (string | number)[]): OrbitalObject {
  // [noradId, name, classCode, inc, ecc, sma, raan, argP, meanA, meanM, period, country]
  const noradIdNum = Number(row[0]);
  const noradStr = String(noradIdNum).padStart(5, '0');
  const name = String(row[1]);
  const classCode = Number(row[2]);
  const classification: ObjectClassification =
    classCode === 1 ? 'PAYLOAD' : classCode === 2 ? 'DEBRIS' : 'ROCKET_BODY';
  const type: ObjectType = classification === 'PAYLOAD' ? 'SATELLITE' : (classification as ObjectType);
  const inc = Number(row[3]);
  const ecc = Number(row[4]);
  const sma = Number(row[5]);
  const raan = Number(row[6]);
  const argP = Number(row[7]);
  const meanA = Number(row[8]);
  const meanM = Number(row[9]);
  const period = Number(row[10]);
  const country = String(row[11] || 'INTL');

  return {
    id: noradIdNum,
    noradId: noradStr,
    name,
    type,
    country,
    owner: country,
    status: classification === 'PAYLOAD' ? 'ACTIVE' : 'INACTIVE',
    classification,
    epoch: '2026-02-15T00:00:00Z',
    inclination: inc,
    eccentricity: ecc,
    semimajorAxis: sma,
    raan,
    argumentOfPerigee: argP,
    meanAnomaly: meanA,
    meanMotion: meanM,
    orbitalPeriod: period,
    source: 'Space-Track / CelesTrak',
    lastUpdated: '2026-02-15T00:00:00Z',
  };
}

/**
 * Adapter converting OrbitalObject to legacy SpaceObject interface
 */
export function toSpaceObject(obj: OrbitalObject): import('@/services/api').SpaceObject {
  return {
    id: obj.id,
    name: obj.name,
    catalog_number: obj.noradId,
    cospar_id: obj.cosparId ?? null,
    classification: obj.classification,
    epoch: obj.epoch,
    inclination: obj.inclination,
    eccentricity: obj.eccentricity,
    semimajor_axis: obj.semimajorAxis,
    raan: obj.raan,
    arg_of_perigee: obj.argumentOfPerigee,
    mean_anomaly: obj.meanAnomaly,
    mean_motion: obj.meanMotion,
    period: obj.orbitalPeriod,
    has_tle: Boolean(obj.tleLine1 && obj.tleLine2),
    updated_at: obj.lastUpdated,
  };
}

