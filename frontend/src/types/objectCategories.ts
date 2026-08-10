/**
 * Layer-manager object categories from the Orbit Layer Manager feature.
 * These are UI/filter buckets — not the raw catalog `classification` field.
 */
export type ObjectCategory =
  | 'NAVIGATION'
  | 'WEATHER'
  | 'MILITARY'
  | 'SPACE_DEBRIS'
  | 'ROCKET_BODY'
  | 'OTHER';

export const OBJECT_CATEGORIES: ObjectCategory[] = [
  'NAVIGATION',
  'WEATHER',
  'MILITARY',
  'SPACE_DEBRIS',
  'ROCKET_BODY',
  'OTHER',
];

export const OBJECT_CATEGORY_INFO: Record<ObjectCategory, { css: string; label: string }> = {
  NAVIGATION: { css: '#4CD6F0', label: 'Navigation Satellites' },
  WEATHER: { css: '#34C759', label: 'Weather Satellites' },
  MILITARY: { css: '#9D7BFF', label: 'Military Satellites' },
  SPACE_DEBRIS: { css: '#FFAA00', label: 'Space Debris' },
  ROCKET_BODY: { css: '#FF4444', label: 'Rocket Bodies' },
  OTHER: { css: '#8793AC', label: 'Other Objects' },
};

/** CSS hex used for globe markers / toggles for a derived category. */
export function getObjectCategoryCss(category: ObjectCategory): string {
  return OBJECT_CATEGORY_INFO[category].css;
}

const NAVIGATION_PATTERNS = [
  /\bgps\b/i,
  /\bnavstar\b/i,
  /\bglonass\b/i,
  /\bgalileo\b/i,
  /\bbeidou\b/i,
  /\bcompass\b/i,
  /\bqzss\b/i,
  /\bmichibiki\b/i,
  /\birnss\b/i,
  /\bnavic\b/i,
  /\bwaas\b/i,
  /\begnos\b/i,
  /\bmsas\b/i,
  /\bgagan\b/i,
];

const WEATHER_PATTERNS = [
  /\bgoes\b/i,
  /\bnoaa\b/i,
  /\bmetop\b/i,
  /\bmeteo\b/i,
  /\bhimawari\b/i,
  /\bfengyun\b/i,
  /\bfy[- ]?\d/i,
  /\bmsg[- ]?\d/i,
  /\bmeteosat\b/i,
  /\binsat\b/i,
  /\belectro[- ]?l\b/i,
  /\bsuomi\b/i,
  /\bnpp\b/i,
  /\bjpss\b/i,
  /\bdmsp\b/i,
  /\bterra\b/i,
  /\baqua\b/i,
  /\bgpm\b/i,
  /\bcloudsat\b/i,
  /\bcalipso\b/i,
];

const MILITARY_PATTERNS = [
  /\busa[- ]?\d/i,
  /\bnrol\b/i,
  /\bno[- ]?ss\b/i,
  /\blacrosse\b/i,
  /\bonyx\b/i,
  /\bmentor\b/i,
  /\borion\b/i,
  /\bsbss\b/i,
  /\bdds\b/i,
  /\bmilstar\b/i,
  /\baehf\b/i,
  /\bwgs\b/i,
  /\bmuos\b/i,
  /\bskynet\b/i,
  /\bsyracuse\b/i,
  /\bsicral\b/i,
  /\bcosmos[- ]?\d/i, // many Russian military; imperfect but commonly used
  /\bkh[- ]?\d/i,
  /\bkeyhole\b/i,
  /\bintruder\b/i,
  /\bgapfiller\b/i,
  /\bsbirs\b/i,
  /\bgssap\b/i,
];

function matchesAny(name: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(name));
}

/**
 * Maps a catalog object onto a layer-manager category.
 * Debris / rocket bodies come from classification; payload mission type is
 * inferred from the object name because the API does not expose mission role.
 *
 * Payloads that match no mission pattern fall into 'OTHER' so every tracked
 * object belongs to exactly one toggleable layer.
 */
export function deriveObjectCategory(obj: {
  name: string;
  classification: 'PAYLOAD' | 'DEBRIS' | 'ROCKET_BODY' | 'UNKNOWN';
}): ObjectCategory {
  if (obj.classification === 'DEBRIS') return 'SPACE_DEBRIS';
  if (obj.classification === 'ROCKET_BODY') return 'ROCKET_BODY';

  const name = obj.name ?? '';
  if (matchesAny(name, NAVIGATION_PATTERNS)) return 'NAVIGATION';
  if (matchesAny(name, WEATHER_PATTERNS)) return 'WEATHER';
  if (matchesAny(name, MILITARY_PATTERNS)) return 'MILITARY';

  return 'OTHER';
}

/** Visibility rule for a derived category. */
export function isObjectCategoryVisible(
  category: ObjectCategory,
  visibility: Record<ObjectCategory, boolean>
): boolean {
  return visibility[category] ?? true;
}
