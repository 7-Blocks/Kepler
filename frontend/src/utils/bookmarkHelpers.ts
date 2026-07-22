import type { Bookmark } from '../hooks/useBookmarkStorage';

const PRESET_TIMESTAMP = '2026-01-01T00:00:00.000Z';

const DEFAULT_HEADING = 0;
const DEFAULT_PITCH = -1.48; // Approximately -85 degrees.
const DEFAULT_ROLL = 0;

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  {
    id: 'default-earth-overview',
    name: 'Earth Overview',
    description: 'A wide global view of Earth.',
    category: 'Overview',
    latitude: 15,
    longitude: 30,
    altitude: 20_000_000,
    heading: DEFAULT_HEADING,
    pitch: DEFAULT_PITCH,
    roll: DEFAULT_ROLL,
    isFavorite: false,
    isDefault: true,
    createdAt: PRESET_TIMESTAMP,
    updatedAt: PRESET_TIMESTAMP,
  },
  {
    id: 'default-iss',
    name: 'ISS',
    description: 'A low-Earth-orbit perspective associated with the International Space Station.',
    category: 'Satellite',
    latitude: 0,
    longitude: 0,
    altitude: 2_200_000,
    heading: DEFAULT_HEADING,
    pitch: DEFAULT_PITCH,
    roll: DEFAULT_ROLL,
    isFavorite: false,
    isDefault: true,
    createdAt: PRESET_TIMESTAMP,
    updatedAt: PRESET_TIMESTAMP,
  },
  {
    id: 'default-india',
    name: 'India',
    description: 'Overview centered on the Indian subcontinent.',
    category: 'Region',
    latitude: 20.5937,
    longitude: 78.9629,
    altitude: 3_000_000,
    heading: DEFAULT_HEADING,
    pitch: DEFAULT_PITCH,
    roll: DEFAULT_ROLL,
    isFavorite: false,
    isDefault: true,
    createdAt: PRESET_TIMESTAMP,
    updatedAt: PRESET_TIMESTAMP,
  },
  {
    id: 'default-europe',
    name: 'Europe',
    description: 'Regional overview of Europe.',
    category: 'Region',
    latitude: 54.526,
    longitude: 15.2551,
    altitude: 3_500_000,
    heading: DEFAULT_HEADING,
    pitch: DEFAULT_PITCH,
    roll: DEFAULT_ROLL,
    isFavorite: false,
    isDefault: true,
    createdAt: PRESET_TIMESTAMP,
    updatedAt: PRESET_TIMESTAMP,
  },
  {
    id: 'default-north-america',
    name: 'North America',
    description: 'Regional overview of North America.',
    category: 'Region',
    latitude: 45,
    longitude: -100,
    altitude: 4_500_000,
    heading: DEFAULT_HEADING,
    pitch: DEFAULT_PITCH,
    roll: DEFAULT_ROLL,
    isFavorite: false,
    isDefault: true,
    createdAt: PRESET_TIMESTAMP,
    updatedAt: PRESET_TIMESTAMP,
  },
  {
    id: 'default-starlink',
    name: 'Starlink Constellation',
    description: 'Wide view suitable for examining a large low-Earth-orbit constellation.',
    category: 'Constellation',
    latitude: 0,
    longitude: -20,
    altitude: 10_000_000,
    heading: DEFAULT_HEADING,
    pitch: DEFAULT_PITCH,
    roll: DEFAULT_ROLL,
    isFavorite: false,
    isDefault: true,
    createdAt: PRESET_TIMESTAMP,
    updatedAt: PRESET_TIMESTAMP,
  },
  {
    id: 'default-low-earth-orbit',
    name: 'Low Earth Orbit',
    description: 'A closer view of the low-Earth-orbit operational region.',
    category: 'Orbit',
    latitude: 10,
    longitude: 0,
    altitude: 5_000_000,
    heading: DEFAULT_HEADING,
    pitch: DEFAULT_PITCH,
    roll: DEFAULT_ROLL,
    isFavorite: false,
    isDefault: true,
    createdAt: PRESET_TIMESTAMP,
    updatedAt: PRESET_TIMESTAMP,
  },
];

type SharedBookmarkData = Pick<
  Bookmark,
  | 'name'
  | 'description'
  | 'category'
  | 'latitude'
  | 'longitude'
  | 'altitude'
  | 'heading'
  | 'pitch'
  | 'roll'
>;

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const binary = Array.from(bytes, (byte) =>
    String.fromCharCode(byte)
  ).join('');

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
  const base64 = value
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const padded = base64.padEnd(
    Math.ceil(base64.length / 4) * 4,
    '='
  );

  const binary = atob(padded);

  const bytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0)
  );

  return new TextDecoder().decode(bytes);
}

function isValidSharedBookmark(
  value: unknown
): value is SharedBookmarkData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const bookmark = value as Partial<SharedBookmarkData>;

  return (
    typeof bookmark.name === 'string' &&
    typeof bookmark.category === 'string' &&
    typeof bookmark.latitude === 'number' &&
    Number.isFinite(bookmark.latitude) &&
    typeof bookmark.longitude === 'number' &&
    Number.isFinite(bookmark.longitude) &&
    typeof bookmark.altitude === 'number' &&
    Number.isFinite(bookmark.altitude) &&
    typeof bookmark.heading === 'number' &&
    Number.isFinite(bookmark.heading) &&
    typeof bookmark.pitch === 'number' &&
    Number.isFinite(bookmark.pitch) &&
    typeof bookmark.roll === 'number' &&
    Number.isFinite(bookmark.roll)
  );
}

export function createBookmarkShareUrl(
  bookmark: Bookmark
): string {
  const sharedData: SharedBookmarkData = {
    name: bookmark.name,
    description: bookmark.description,
    category: bookmark.category,
    latitude: bookmark.latitude,
    longitude: bookmark.longitude,
    altitude: bookmark.altitude,
    heading: bookmark.heading,
    pitch: bookmark.pitch,
    roll: bookmark.roll,
  };

  const url = new URL(window.location.href);

  url.searchParams.set(
    'bookmark',
    toBase64Url(JSON.stringify(sharedData))
  );

  return url.toString();
}

export function getSharedBookmarkFromUrl(): Bookmark | null {
  try {
    const encodedBookmark = new URLSearchParams(
      window.location.search
    ).get('bookmark');

    if (!encodedBookmark) {
      return null;
    }

    const decodedBookmark: unknown = JSON.parse(
      fromBase64Url(encodedBookmark)
    );

    if (!isValidSharedBookmark(decodedBookmark)) {
      return null;
    }

    const now = new Date().toISOString();

    return {
      ...decodedBookmark,
      id: crypto.randomUUID(),
      isFavorite: false,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };
  } catch {
    return null;
  }
}