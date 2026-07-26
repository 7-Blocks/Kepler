import * as Cesium from 'cesium';

export const CATEGORY_COLORS = {
  PAYLOAD: { css: '#00E5FF', cesium: Cesium.Color.fromCssColorString('#00E5FF'), label: 'Active Satellites', icon: 'satellite_alt' },
  DEBRIS: { css: '#FFAA00', cesium: Cesium.Color.fromCssColorString('#FFAA00'), label: 'Debris Objects', icon: 'delete_sweep' },
  ROCKET_BODY: { css: '#FF4444', cesium: Cesium.Color.fromCssColorString('#FF4444'), label: 'Rocket Bodies', icon: 'rocket' },
  UNKNOWN: { css: '#888888', cesium: Cesium.Color.fromCssColorString('#888888'), label: 'Unknown Objects', icon: 'help_outline' },
  COLLISION: { css: '#FF0000', cesium: Cesium.Color.fromCssColorString('#FF0000'), label: 'Collision Risk', icon: 'warning' },
  SELECTED: { css: '#00E5FF', cesium: Cesium.Color.fromCssColorString('#00E5FF'), label: 'Selected', icon: 'gps_fixed' },
} as const;

export function getPointSize(classification: string): number {
  switch (classification) {
    case 'PAYLOAD':
      return 5;
    case 'DEBRIS':
      return 4;
    case 'ROCKET_BODY':
      return 6;
    default:
      return 3;
  }
}

export function getOutlineWidth(classification: string): number {
  switch (classification) {
    case 'PAYLOAD':
      return 1;
    case 'DEBRIS':
      return 1;
    case 'ROCKET_BODY':
      return 2;
    default:
      return 1;
  }
}
