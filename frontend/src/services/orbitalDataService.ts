/**
 * Global Orbital Data Service — Kepler AI
 * Unified single source of truth for the 60,000+ Space Object Catalog.
 */

import {
  type OrbitalObject,
  type ObjectType,
  type OrbitalStatistics,
  type OrbitalFilters,
  type MinifiedOrbitalCatalog,
  unpackMinifiedRow,
} from '@/types/orbital';
import { deriveObjectCategory, type ObjectCategory } from '@/types/objectCategories';
import { deriveOrbitRegime, type OrbitRegime } from '@/types/orbitLayers';

export interface OrbitalDataProvider {
  name: string;
  loadCatalog(onProgress?: (loaded: number, total: number) => void): Promise<OrbitalObject[]>;
  loadMetadata(): Promise<OrbitalStatistics | null>;
}

export class StaticOrbitalDataProvider implements OrbitalDataProvider {
  name = 'Static CelesTrak / Space-Track Provider';

  async loadCatalog(onProgress?: (loaded: number, total: number) => void): Promise<OrbitalObject[]> {
    try {
      // 1. Try loading optimized compact minified dataset first (~6.8MB)
      const res = await fetch('/data/orbital/objects.min.json');
      if (res.ok) {
        const json: MinifiedOrbitalCatalog = await res.json();
        const rows = json.data || [];
        const total = rows.length;
        const result: OrbitalObject[] = new Array(total);

        for (let i = 0; i < total; i++) {
          result[i] = unpackMinifiedRow(rows[i]);
          if (onProgress && i % 10000 === 0) {
            onProgress(i, total);
          }
        }
        if (onProgress) onProgress(total, total);
        return result;
      }
    } catch {
      // Fall through to full objects.json if min.json is not available
    }

    // 2. Fallback to objects.json
    const res = await fetch('/data/orbital/objects.json');
    if (!res.ok) {
      throw new Error(`Failed to load orbital catalog: HTTP ${res.status}`);
    }
    const objects: OrbitalObject[] = await res.json();
    if (onProgress) onProgress(objects.length, objects.length);
    return objects;
  }

  async loadMetadata(): Promise<OrbitalStatistics | null> {
    try {
      const res = await fetch('/data/orbital/metadata.json');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return null;
  }
}

class OrbitalDataService {
  private provider: OrbitalDataProvider = new StaticOrbitalDataProvider();
  private catalog: OrbitalObject[] = [];
  private noradMap: Map<string, OrbitalObject> = new Map();
  private idMap: Map<number, OrbitalObject> = new Map();
  private categoryMap: Map<string, ObjectCategory> = new Map();
  private regimeMap: Map<string, OrbitRegime> = new Map();
  private statistics: OrbitalStatistics | null = null;
  private isLoaded = false;
  private loadPromise: Promise<OrbitalObject[]> | null = null;

  public setProvider(provider: OrbitalDataProvider) {
    this.provider = provider;
    this.isLoaded = false;
    this.catalog = [];
    this.noradMap.clear();
    this.idMap.clear();
  }

  public async loadOrbitalObjects(
    onProgress?: (loaded: number, total: number) => void
  ): Promise<OrbitalObject[]> {
    if (this.isLoaded && this.catalog.length > 0) {
      return this.catalog;
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      const rawObjects = await this.provider.loadCatalog(onProgress);

      const validObjects: OrbitalObject[] = [];
      const noradMap = new Map<string, OrbitalObject>();
      const idMap = new Map<number, OrbitalObject>();
      const catMap = new Map<string, ObjectCategory>();
      const regMap = new Map<string, OrbitRegime>();

      let satellites = 0;
      let debris = 0;
      let rocketBodies = 0;
      let leo = 0;
      let meo = 0;
      let geo = 0;
      let heo = 0;

      for (let i = 0; i < rawObjects.length; i++) {
        const obj = rawObjects[i];
        if (!obj || !obj.noradId) continue;

        validObjects.push(obj);
        noradMap.set(obj.noradId, obj);
        idMap.set(obj.id, obj);

        // Derive category & regime
        const cat = deriveObjectCategory({
          name: obj.name,
          classification: obj.classification,
        });
        catMap.set(obj.noradId, cat);

        const regime = deriveOrbitRegime({
          semimajor_axis: obj.semimajorAxis,
          eccentricity: obj.eccentricity,
          inclination: obj.inclination,
          period: obj.orbitalPeriod,
        });
        regMap.set(obj.noradId, regime);

        if (obj.classification === 'PAYLOAD') satellites++;
        else if (obj.classification === 'DEBRIS') debris++;
        else if (obj.classification === 'ROCKET_BODY') rocketBodies++;

        if (regime === 'LEO') leo++;
        else if (regime === 'MEO') meo++;
        else if (regime === 'GEO') geo++;
        else if (regime === 'HEO') heo++;
      }

      this.catalog = validObjects;
      this.noradMap = noradMap;
      this.idMap = idMap;
      this.categoryMap = catMap;
      this.regimeMap = regMap;
      this.isLoaded = true;

      this.statistics = {
        totalObjects: validObjects.length,
        totalSatellites: satellites,
        totalDebris: debris,
        totalRocketBodies: rocketBodies,
        totalPayloads: satellites,
        activeObjects: satellites,
        unknownObjects: 0,
        leoCount: leo,
        meoCount: meo,
        geoCount: geo,
        heoCount: heo,
        lastUpdated: new Date().toISOString(),
        source: 'Space-Track / CelesTrak GP Dataset',
      };

      this.visibleSubset = [];
      return this.catalog;
    })();

    try {
      return await this.loadPromise;
    } finally {
      this.loadPromise = null;
    }
  }

  private visibleSubset: OrbitalObject[] = [];

  public getAllOrbitalObjects(): OrbitalObject[] {
    return this.catalog;
  }

  /**
   * Returns a balanced, representative subset of ~7,000 objects for 3D visualization.
   * Preserves full catalog integrity while preventing scene clutter and GPU overload.
   */
  public getVisibleObjects(maxCount = 7000): OrbitalObject[] {
    if (this.visibleSubset.length > 0 && this.visibleSubset.length === Math.min(this.catalog.length, maxCount)) {
      return this.visibleSubset;
    }

    if (this.catalog.length <= maxCount) {
      this.visibleSubset = this.catalog;
      return this.visibleSubset;
    }

    // Stratified representative sampling:
    // Satellites: ~40% (2800)
    // Debris: ~48% (3360)
    // Rocket bodies: ~12% (840)
    const targetSat = Math.round(maxCount * 0.40);
    const targetDebris = Math.round(maxCount * 0.48);
    const targetRb = maxCount - targetSat - targetDebris;

    const sats: OrbitalObject[] = [];
    const debrisList: OrbitalObject[] = [];
    const rbs: OrbitalObject[] = [];

    for (let i = 0; i < this.catalog.length; i++) {
      const obj = this.catalog[i];
      if (obj.classification === 'PAYLOAD') sats.push(obj);
      else if (obj.classification === 'DEBRIS') debrisList.push(obj);
      else if (obj.classification === 'ROCKET_BODY') rbs.push(obj);
      else debrisList.push(obj);
    }

    const sample = (arr: OrbitalObject[], target: number): OrbitalObject[] => {
      if (arr.length <= target) return arr;
      const result: OrbitalObject[] = [];
      const step = arr.length / target;
      for (let i = 0; i < target; i++) {
        const idx = Math.min(Math.floor(i * step), arr.length - 1);
        result.push(arr[idx]);
      }
      return result;
    };

    this.visibleSubset = [
      ...sample(sats, targetSat),
      ...sample(debrisList, targetDebris),
      ...sample(rbs, targetRb),
    ];

    return this.visibleSubset;
  }

  public getOrbitalObjectById(noradIdOrId: string | number): OrbitalObject | undefined {
    if (typeof noradIdOrId === 'number') {
      const byId = this.idMap.get(noradIdOrId);
      if (byId) return byId;
      const str = String(noradIdOrId).padStart(5, '0');
      return this.noradMap.get(str);
    }
    const clean = String(noradIdOrId).padStart(5, '0');
    return this.noradMap.get(clean) || this.noradMap.get(String(noradIdOrId));
  }

  public getObjectCategory(noradId: string): ObjectCategory {
    return this.categoryMap.get(noradId) ?? 'OTHER';
  }

  public getObjectRegime(noradId: string): OrbitRegime {
    return this.regimeMap.get(noradId) ?? 'LEO';
  }

  public getObjectStatistics(): OrbitalStatistics {
    return (
      this.statistics ?? {
        totalObjects: this.catalog.length,
        totalSatellites: 0,
        totalDebris: 0,
        totalRocketBodies: 0,
        totalPayloads: 0,
        activeObjects: 0,
        unknownObjects: 0,
      }
    );
  }

  public getSatelliteObjects(): OrbitalObject[] {
    return this.catalog.filter((o) => o.classification === 'PAYLOAD');
  }

  public getDebrisObjects(): OrbitalObject[] {
    return this.catalog.filter((o) => o.classification === 'DEBRIS');
  }

  public getRocketBodies(): OrbitalObject[] {
    return this.catalog.filter((o) => o.classification === 'ROCKET_BODY');
  }

  public getObjectsByType(type: ObjectType): OrbitalObject[] {
    if (type === 'SATELLITE' || type === 'PAYLOAD') {
      return this.getSatelliteObjects();
    }
    if (type === 'DEBRIS') {
      return this.getDebrisObjects();
    }
    if (type === 'ROCKET_BODY') {
      return this.getRocketBodies();
    }
    return this.catalog;
  }

  public getObjectsByCategory(category: ObjectCategory): OrbitalObject[] {
    return this.catalog.filter((o) => this.categoryMap.get(o.noradId) === category);
  }

  public getObjectsByRegime(regime: OrbitRegime): OrbitalObject[] {
    return this.catalog.filter((o) => this.regimeMap.get(o.noradId) === regime);
  }

  /**
   * Fast substring search across 60,000+ objects
   */
  public searchOrbitalObjects(query: string, limit = 50): OrbitalObject[] {
    if (!query || !query.trim()) return [];
    const q = query.trim().toUpperCase();
    const results: OrbitalObject[] = [];

    // 1. Direct NORAD match
    const directMatch = this.getOrbitalObjectById(q);
    if (directMatch) {
      results.push(directMatch);
    }

    for (let i = 0; i < this.catalog.length; i++) {
      if (results.length >= limit) break;
      const obj = this.catalog[i];
      if (obj.noradId === q) continue; // already added

      if (
        obj.name.toUpperCase().includes(q) ||
        obj.noradId.includes(q) ||
        (obj.country && obj.country.toUpperCase() === q) ||
        (obj.owner && obj.owner.toUpperCase().includes(q))
      ) {
        results.push(obj);
      }
    }
    return results;
  }

  /**
   * Filtered query with pagination
   */
  public queryObjects(
    filters: Partial<OrbitalFilters>,
    page = 1,
    pageSize = 30
  ): { items: OrbitalObject[]; total: number; pages: number } {
    let filtered = this.catalog;

    if (filters.objectType && filters.objectType !== 'ALL') {
      if (filters.objectType === 'SATELLITE' || filters.objectType === 'PAYLOAD') {
        filtered = filtered.filter((o) => o.classification === 'PAYLOAD');
      } else if (filters.objectType === 'DEBRIS') {
        filtered = filtered.filter((o) => o.classification === 'DEBRIS');
      } else if (filters.objectType === 'ROCKET_BODY') {
        filtered = filtered.filter((o) => o.classification === 'ROCKET_BODY');
      }
    }

    if (filters.category && filters.category !== 'ALL') {
      filtered = filtered.filter((o) => this.categoryMap.get(o.noradId) === filters.category);
    }

    if (filters.regime && filters.regime !== 'ALL') {
      filtered = filtered.filter((o) => this.regimeMap.get(o.noradId) === filters.regime);
    }

    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter((o) => o.status === filters.status);
    }

    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toUpperCase();
      filtered = filtered.filter(
        (o) =>
          o.name.toUpperCase().includes(q) ||
          o.noradId.includes(q) ||
          (o.country && o.country.toUpperCase().includes(q))
      );
    }

    const total = filtered.length;
    const pages = Math.ceil(total / pageSize) || 1;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return { items, total, pages };
  }
}

export const orbitalDataService = new OrbitalDataService();
