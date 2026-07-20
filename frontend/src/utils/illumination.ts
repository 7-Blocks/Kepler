import * as Cesium from 'cesium';

/**
 * Determines whether a satellite at the given position is illuminated by the Sun.
 * Returns true if the line of sight from the satellite to the Sun does not intersect the Earth.
 *
 * @param position - Satellite position in Earth-centered fixed (ECEF) coordinates.
 * @param julianDate - Current Cesium JulianDate (typically Cesium.JulianDate.now()).
 * @param globe - The Cesium Globe instance (used for ellipsoid reference).
 */
export function isSatelliteSunlit(
  position: Cesium.Cartesian3,
  julianDate: Cesium.JulianDate,
  globe: Cesium.Globe
): boolean {
  // Compute Sun position in the Earth‑Centered Inertial (ECI) frame.
  const sunPosInertial = new Cesium.Cartesian3();
  Cesium.Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(julianDate, sunPosInertial);

  // Convert Sun position to Earth‑Fixed frame.
  const temeToFixed = Cesium.Transforms.computeTemeToPseudoFixedMatrix(julianDate);
  const sunPosFixed = Cesium.Matrix4.multiplyByPoint(temeToFixed, sunPosInertial, new Cesium.Cartesian3());

  // Vector from satellite to Sun.
  const satToSun = Cesium.Cartesian3.subtract(sunPosFixed, position, new Cesium.Cartesian3());
  const direction = Cesium.Cartesian3.normalize(satToSun, new Cesium.Cartesian3());

  // Ray from satellite toward the Sun.
  const ray = new Cesium.Ray(position, direction);

  // Test intersection with Earth's ellipsoid (WGS84).
  const intersection = Cesium.IntersectionTests.rayEllipsoid(ray, Cesium.Ellipsoid.WGS84);

  // If there is no intersection, the satellite is sunlit.
  if (!intersection) return true;

  // Distance from satellite to Sun.
  const distanceToSun = Cesium.Cartesian3.distance(position, sunPosFixed);

  // Intersection distance along the ray (already normalized).
  const distanceToEarth = intersection.start;

  // Satellite is sunlit if the Earth lies beyond the Sun.
  return distanceToEarth > distanceToSun;
}
