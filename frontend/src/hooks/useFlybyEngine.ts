import { useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useBookmarkStorage } from '@/hooks/useBookmarkStorage';
import { api } from '@/services/api';
import type { SpaceObject, APIResponse } from '@/services/api';
import { keplerToLatLonAlt, calculateGroundDistanceKm, calculateElevationAngle } from '@/utils/orbitCalc';
import type { CatalogObject } from '@/types/satellite';

// Flyby check interval: every 30 seconds
const CHECK_INTERVAL_MS = 30 * 1000;
const MIN_ELEVATION_DEG = 10; // Minimum elevation to consider it a visible flyby
const PROPAGATION_MINUTES = 60; // Look ahead 60 minutes

export function useFlybyEngine() {
  const { selectedSatelliteIds } = useUIStore();
  const { preferences, addNotification } = useNotificationStore();
  const { bookmarks } = useBookmarkStorage();
  
  const userLocationRef = useRef<{ lat: number, lon: number } | null>(null);

  // Initialize user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocationRef.current = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
        },
        (error) => {
          console.warn('Geolocation denied or failed, using default location (0,0).', error);
          userLocationRef.current = { lat: 0, lon: 0 };
        }
      );
    } else {
      userLocationRef.current = { lat: 0, lon: 0 };
    }
  }, []);

  useEffect(() => {
    if (selectedSatelliteIds.length === 0) return;

    const checkFlybys = async () => {
      try {
        // Fetch data for all tracked satellites
        const satPromises = selectedSatelliteIds.map(id => api.getCatalogObjectByNorad(id));
        const responses = await Promise.allSettled(satPromises);
        
        const satellites = responses
          .filter((res): res is PromiseFulfilledResult<APIResponse<SpaceObject>> => res.status === 'fulfilled')
          .map(res => res.value.data as SpaceObject)
          .filter(Boolean);

        // Prepare target locations
        const targetLocations = [
          ...(userLocationRef.current ? [{ 
            name: 'Current Location', 
            lat: userLocationRef.current.lat, 
            lon: userLocationRef.current.lon 
          }] : []),
          ...bookmarks.map(b => ({ name: b.name, lat: b.latitude, lon: b.longitude }))
        ];

        const now = new Date();

        for (const sat of satellites) {
          // Cast SpaceObject to CatalogObject structure expected by keplerToLatLonAlt
          const catalogObj = sat as unknown as CatalogObject;

          for (const loc of targetLocations) {
            let minDistance = Infinity;
            let timeOfClosestApproachSec = 0;
            let closestPos = null;

            // Propagate forward minute-by-minute
            for (let min = 0; min <= PROPAGATION_MINUTES; min++) {
              const timeOffsetSec = min * 60;
              const pos = keplerToLatLonAlt(catalogObj, timeOffsetSec);
              
              if (pos) {
                const dist = calculateGroundDistanceKm(loc.lat, loc.lon, pos.lat, pos.lon);
                if (dist < minDistance) {
                  minDistance = dist;
                  timeOfClosestApproachSec = timeOffsetSec;
                  closestPos = pos;
                }
              }
            }

            if (closestPos) {
              const maxElevation = calculateElevationAngle(closestPos.alt, minDistance);
              const etaDate = new Date(now.getTime() + timeOfClosestApproachSec * 1000);
              const minutesUntilPass = timeOfClosestApproachSec / 60;

              // If it's a valid pass, and it's happening within our warning window
              if (
                maxElevation >= MIN_ELEVATION_DEG && 
                minutesUntilPass > 0 &&
                minutesUntilPass <= preferences.warningMinutes
              ) {
                // Estimate velocity (simple circular orbit approximation for UI purposes)
                const vKmS = Math.sqrt(398600.4418 / (6371 + closestPos.alt));

                addNotification({
                  satelliteId: sat.catalog_number,
                  satelliteName: sat.name || `NORAD ${sat.catalog_number}`,
                  locationName: loc.name,
                  eta: etaDate,
                  altitudeKm: closestPos.alt,
                  velocityKms: vKmS,
                  maxElevationDeg: maxElevation,
                  durationSec: 180, // Estimated visible duration 3 mins
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Flyby engine error:', err);
      }
    };

    // Run immediately, then on interval
    checkFlybys();
    const intervalId = setInterval(checkFlybys, CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [selectedSatelliteIds, bookmarks, preferences.warningMinutes, addNotification]);
}
