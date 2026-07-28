/**
 * Curated "Satellite of the Day" dataset.
 *
 * This is hand-written editorial content (mission summary, operator, launch
 * date, facts) because the backend catalog only stores orbital mechanics
 * from TLE data — there's no mission/bio data anywhere in this app.
 *
 * `catalog_number` is the real NORAD Catalog Number and is used to cross-
 * reference this entry against the live catalog (via
 * api.getCatalogObjectByNorad) so orbit type / altitude / inclination /
 * period always come from real, current data instead of also being
 * hardcoded here.
 *
 * IMPORTANT: verify each catalog_number against the live /catalog/objects
 * endpoint before merging — an object can decay/re-enter and drop out of
 * the tracked catalog. The rotation hook and card component both handle a
 * missing match gracefully, but it's worth confirming these are current.
 */

export type SatelliteStatus = 'Active' | 'Inactive' | 'Retired';

export interface SpotlightSatellite {
  /** Real NORAD Catalog Number, used to match against live catalog data. */
  catalog_number: string;
  name: string;
  operator: string;
  launch_date: string; // ISO date, e.g. '1998-11-20'
  status: SatelliteStatus;
  mission_summary: string;
  facts: string[];
  /** Optional; card falls back to a placeholder illustration if omitted. */
  image?: string;
}

export const SPOTLIGHT_SATELLITES: SpotlightSatellite[] = [
  {
    catalog_number: '25544',
    name: 'International Space Station',
    operator: 'NASA / Roscosmos / ESA / JAXA / CSA',
    launch_date: '1998-11-20',
    status: 'Active',
    mission_summary:
      'A continuously crewed research platform in low Earth orbit, built and operated jointly by five space agencies for long-duration microgravity science.',
    facts: [
      'Orbits Earth roughly every 90 minutes — about 16 sunrises a day for the crew.',
      'The largest human-made structure ever assembled in space.',
    ],
  },
  {
    catalog_number: '20580',
    name: 'Hubble Space Telescope',
    operator: 'NASA / ESA',
    launch_date: '1990-04-24',
    status: 'Active',
    mission_summary:
      'A space-based observatory that images the universe in visible, ultraviolet, and near-infrared light, free of atmospheric distortion.',
    facts: [
      'Deployed from Space Shuttle Discovery on mission STS-31.',
      "Its data has been used in over 20,000 peer-reviewed scientific papers.",
    ],
  },
  {
    catalog_number: '25994',
    name: 'Terra (EOS AM-1)',
    operator: 'NASA',
    launch_date: '1999-12-18',
    status: 'Active',
    mission_summary:
      "Flagship of NASA's Earth Observing System, carrying five instruments that monitor clouds, land cover, and the carbon cycle.",
    facts: [
      'Flies in a sun-synchronous orbit, crossing the equator every morning at roughly the same local time.',
    ],
  },
  {
    catalog_number: '27424',
    name: 'Aqua',
    operator: 'NASA',
    launch_date: '2002-05-04',
    status: 'Active',
    mission_summary:
      "Part of NASA's A-Train satellite constellation, gathering data on Earth's water cycle : evaporation, precipitation, and ice.",
    facts: [
      'Carries the AIRS instrument, used to improve weather forecasting models worldwide.',
    ],
  },
  {
    catalog_number: '33591',
    name: 'NOAA-19',
    operator: 'NOAA',
    launch_date: '2009-02-06',
    status: 'Active',
    mission_summary:
      'The final satellite in the POES series, providing global weather imagery and atmospheric soundings for forecasting.',
    facts: [
      'Data from NOAA polar orbiters feeds directly into daily weather forecasts and hurricane tracking.',
    ],
  },
  {
    catalog_number: '39084',
    name: 'Landsat 8',
    operator: 'NASA / USGS',
    launch_date: '2013-02-11',
    status: 'Active',
    mission_summary:
      "Part of the longest continuous record of Earth's land surface as seen from space, running since 1972.",
    facts: [
      'Its imagery is freely available and widely used for tracking deforestation, urban growth, and agriculture.',
    ],
  },
];