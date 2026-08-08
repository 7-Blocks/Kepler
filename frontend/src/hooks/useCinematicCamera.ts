import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';
import type { CameraMode } from '@/store/uiStore';
import type { CatalogObject } from '@/types/satellite';
import { keplerToLatLonAlt } from '@/utils/orbitCalc';

const LERP_FACTOR = 0.08; // Controls how fast the camera catches up to the target position

export function useCinematicCamera(
  viewer: Cesium.Viewer | null,
  entitiesRef: React.RefObject<Map<string, Cesium.Entity>>,
  catalogMapRef: React.RefObject<Map<string, CatalogObject>>
) {
  const lastMode = useRef<CameraMode>('FREE');

  useEffect(() => {
    if (!viewer) return;

    const onPreRender = () => {
      const state = useUIStore.getState();
      const mode = state.cameraMode;
      const targetId = state.selectedSatelliteId;

      // Handle transitioning to FREE mode
      if (mode === 'FREE' || !targetId) {
        if (lastMode.current !== 'FREE') {
          lastMode.current = 'FREE';
          // Release any overrides if needed, but Cesium camera allows manual control natively
          // when we stop overriding it in preRender.
        }
        return;
      }

      const entity = entitiesRef.current?.get(targetId);
      const catalogData = catalogMapRef.current?.get(targetId);

      if (!entity || !catalogData) return;

      lastMode.current = mode;

      // 1. Calculate precise real-time position and velocity
      const now = new Date();
      const p0_geo = keplerToLatLonAlt(catalogData, 0);
      const p1_geo = keplerToLatLonAlt(catalogData, 1); // 1 second into future

      if (!p0_geo || !p1_geo) return;

      const p0 = Cesium.Cartesian3.fromDegrees(p0_geo.lon, p0_geo.lat, p0_geo.alt * 1000);
      const p1 = Cesium.Cartesian3.fromDegrees(p1_geo.lon, p1_geo.lat, p1_geo.alt * 1000);

      // 2. Update physical entity position so it visibly moves!
      entity.position = new Cesium.ConstantPositionProperty(p0);

      // 3. Calculate camera targets
      const velocity = Cesium.Cartesian3.subtract(p1, p0, new Cesium.Cartesian3());
      Cesium.Cartesian3.normalize(velocity, velocity);

      // 'up' is the normal vector from earth center to the satellite
      const up = Cesium.Cartesian3.normalize(p0, new Cesium.Cartesian3());

      let targetPos = new Cesium.Cartesian3();
      let targetDir = new Cesium.Cartesian3();
      let targetUp = new Cesium.Cartesian3();

      switch (mode) {
        case 'CHASE': {
          // Behind and slightly above
          const distanceBehind = 80000; // 80 km
          const heightAbove = 20000; // 20 km
          
          const backward = Cesium.Cartesian3.multiplyByScalar(velocity, -distanceBehind, new Cesium.Cartesian3());
          const upward = Cesium.Cartesian3.multiplyByScalar(up, heightAbove, new Cesium.Cartesian3());
          
          Cesium.Cartesian3.add(p0, backward, targetPos);
          Cesium.Cartesian3.add(targetPos, upward, targetPos);
          
          // Look at the satellite
          Cesium.Cartesian3.subtract(p0, targetPos, targetDir);
          Cesium.Cartesian3.normalize(targetDir, targetDir);
          targetUp = up;
          break;
        }
        case 'COCKPIT': {
          // Exactly at the satellite, looking forward along velocity
          // Slightly offset forward so we don't clip inside the point primitive
          const offset = Cesium.Cartesian3.multiplyByScalar(velocity, 1000, new Cesium.Cartesian3());
          Cesium.Cartesian3.add(p0, offset, targetPos);
          
          targetDir = velocity;
          targetUp = up;
          break;
        }
        case 'EARTH_OBSERVER': {
          // From the satellite, looking down at Earth (0,0,0)
          const offset = Cesium.Cartesian3.multiplyByScalar(up, 1000, new Cesium.Cartesian3());
          Cesium.Cartesian3.add(p0, offset, targetPos);
          
          Cesium.Cartesian3.negate(up, targetDir);
          // When looking straight down, 'up' for the camera needs to be the velocity vector
          targetUp = velocity;
          break;
        }
        case 'ORBITAL': {
          // Far above, looking down at the satellite
          const heightAbove = 500000; // 500 km
          const upward = Cesium.Cartesian3.multiplyByScalar(up, heightAbove, new Cesium.Cartesian3());
          Cesium.Cartesian3.add(p0, upward, targetPos);
          
          Cesium.Cartesian3.negate(up, targetDir);
          targetUp = velocity;
          break;
        }
      }

      // 4. Smoothly interpolate current camera towards target
      const currentPos = viewer.camera.position;
      const currentDir = viewer.camera.direction;
      const currentUp = viewer.camera.up;

      const nextPos = new Cesium.Cartesian3();
      const nextDir = new Cesium.Cartesian3();
      const nextUp = new Cesium.Cartesian3();

      Cesium.Cartesian3.lerp(currentPos, targetPos, LERP_FACTOR, nextPos);
      Cesium.Cartesian3.lerp(currentDir, targetDir, LERP_FACTOR, nextDir);
      Cesium.Cartesian3.lerp(currentUp, targetUp, LERP_FACTOR, nextUp);

      Cesium.Cartesian3.normalize(nextDir, nextDir);
      Cesium.Cartesian3.normalize(nextUp, nextUp);

      // Force the camera view
      viewer.camera.setView({
        destination: nextPos,
        orientation: {
          direction: nextDir,
          up: nextUp,
        }
      });
    };

    viewer.scene.preRender.addEventListener(onPreRender);

    return () => {
      viewer.scene.preRender.removeEventListener(onPreRender);
    };
  }, [viewer, entitiesRef, catalogMapRef]);
}
