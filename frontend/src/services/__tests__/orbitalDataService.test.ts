import { describe, it, expect } from 'vitest';
import { orbitalDataService, StaticOrbitalDataProvider } from '../orbitalDataService';
import { calculateOrbitalPosition, calculateOrbitalVelocity } from '../orbitalPositionService';
import { getObjectType, unpackMinifiedRow, type OrbitalObject } from '@/types/orbital';

describe('Orbital Data Service & Position Calculations', () => {
  const sampleMinifiedRow = [
    15544,
    'STARLINK-101',
    1, // PAYLOAD
    53.05,
    0.00015,
    6921.0,
    145.2,
    89.4,
    210.5,
    15.06,
    95.6,
    'US',
  ];

  it('unpacks minified row into canonical OrbitalObject', () => {
    const obj = unpackMinifiedRow(sampleMinifiedRow);
    expect(obj.id).toBe(15544);
    expect(obj.noradId).toBe('15544');
    expect(obj.name).toBe('STARLINK-101');
    expect(obj.classification).toBe('PAYLOAD');
    expect(obj.type).toBe('SATELLITE');
    expect(obj.inclination).toBe(53.05);
    expect(obj.semimajorAxis).toBe(6921.0);
    expect(obj.status).toBe('ACTIVE');
    expect(obj.country).toBe('US');
  });

  it('correctly classifies object types', () => {
    expect(getObjectType({ classification: 'PAYLOAD' })).toBe('PAYLOAD');
    expect(getObjectType({ classification: 'DEBRIS' })).toBe('DEBRIS');
    expect(getObjectType({ classification: 'ROCKET_BODY' })).toBe('ROCKET_BODY');
    expect(getObjectType({ name: 'FENGYUN 1C DEB' })).toBe('DEBRIS');
    expect(getObjectType({ name: 'FALCON 9 R/B' })).toBe('ROCKET_BODY');
  });

  it('supports StaticOrbitalDataProvider instantiation', () => {
    const provider = new StaticOrbitalDataProvider();
    expect(provider.name).toContain('Static');
    expect(orbitalDataService).toBeDefined();
  });

  it('calculates orbital positions and velocity from Keplerian elements', () => {
    const obj: OrbitalObject = {
      id: 25544,
      noradId: '25544',
      name: 'ISS (ZARYA)',
      type: 'SATELLITE',
      status: 'ACTIVE',
      classification: 'PAYLOAD',
      epoch: '2026-02-15T00:00:00Z',
      inclination: 51.64,
      eccentricity: 0.0007,
      semimajorAxis: 6790.0,
      raan: 120.5,
      argumentOfPerigee: 45.0,
      meanAnomaly: 180.0,
      meanMotion: 15.5,
      orbitalPeriod: 92.9,
      source: 'Space-Track',
      lastUpdated: '2026-02-15T00:00:00Z',
    };

    const pos = calculateOrbitalPosition(obj);
    expect(pos).not.toBeNull();
    if (pos) {
      expect(pos.alt).toBeCloseTo(419, 0); // 6790 - 6371 = 419 km
      expect(pos.lat).toBeGreaterThanOrEqual(-90);
      expect(pos.lat).toBeLessThanOrEqual(90);
      expect(pos.lon).toBeGreaterThanOrEqual(-180);
      expect(pos.lon).toBeLessThanOrEqual(180);
    }

    const vel = calculateOrbitalVelocity(6790.0, 419.0);
    expect(vel).toBeGreaterThan(7.0);
    expect(vel).toBeLessThan(8.0); // ~7.66 km/s for LEO
  });
});
