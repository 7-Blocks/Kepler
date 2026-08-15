/**
 * Orbital catalog display and performance constants.
 */

/**
 * Maximum number of objects rendered simultaneously on the 3D Cesium globe.
 * The full 64,103+ object catalog remains accessible for statistics, search,
 * details, debris, satellite lists, and collision analysis.
 */
export const MAX_VISIBLE_SPACE_OBJECTS = 7000;

/**
 * Visual dot sizes for 3D Cesium point primitives (in CSS pixels).
 * Sized conservatively to prevent visual clutter while preserving crisp visibility.
 */
export const ORBITAL_POINT_SIZES = {
  PAYLOAD: 2.8,
  DEBRIS: 1.8,
  ROCKET_BODY: 3.2,
  SELECTED: 6.0,
} as const;
