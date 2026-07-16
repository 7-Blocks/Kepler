import React, { useEffect, useRef } from "react";
import Globe from "globe.gl";
import * as satellite from "satellite.js";

const EARTH_RADIUS_KM = 6371; // km
const TIME_STEP = 3 * 1000; // per frame
const radiansToDegrees = (rad: number) => (rad * 180) / Math.PI;

interface SatDataItem {
  satrec: satellite.SatRec;
  name: string;
  lat: number;
  lng: number;
  alt: number;
}

export const GlobeBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Globe
    const world = new Globe(containerRef.current)
      .globeImageUrl("//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg")
      .backgroundColor("rgba(0,0,0,0)")
      .particleLat("lat")
      .particleLng("lng")
      .particleAltitude("alt")
      .particlesColor(() => "#00e5ff")
      .showAtmosphere(true)
      .atmosphereColor("#00e5ff")
      .atmosphereAltitude(0.25);

    // Disable zoom
    world.controls().enableZoom = false;

    globeInstanceRef.current = world;

    // Set initial view
    setTimeout(() => {
      world.pointOfView({ altitude: 3.0 }, 1000);
    }, 200);

    // Resize handler
    const handleResize = () => {
      if (containerRef.current) {
        world.width(containerRef.current.clientWidth);
        world.height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    // Fetch and propagate satellites
    let isMounted = true;
    fetch("/datasets/space-track-leo.txt")
      .then((r) => {
        if (!r.ok) {
          throw new Error(`Failed to fetch dataset: ${r.statusText}`);
        }
        return r.text();
      })
      .then((rawData) => {
        if (!isMounted) return;

        const tleData = rawData
          .replace(/\r/g, "")
          .split(/\n(?=[^12])/)
          .filter((d) => d)
          .map((tle) => tle.split("\n"));

        const satData: SatDataItem[] = tleData
          .map(([name, ...tle]) => {
            if (!tle[0] || !tle[1]) return null;
            try {
              return {
                satrec: satellite.twoline2satrec(tle[0], tle[1]),
                name: name.trim().replace(/^0 /, ""),
                lat: 0,
                lng: 0,
                alt: 0,
              };
            } catch (e) {
              return null;
            }
          })
          .filter((d): d is SatDataItem => {
            if (!d) return false;
            const pos = satellite.propagate(d.satrec, new Date());
            return !!(pos && typeof pos === "object" && pos.position);
          });

        // Time ticker loop
        let time = new Date();

        const frameTicker = () => {
          if (!isMounted) return;

          time = new Date(+time + TIME_STEP);

          // Update satellite positions
          const gmst = satellite.gstime(time);
          satData.forEach((d) => {
            const eci = satellite.propagate(d.satrec, time);
            if (eci && typeof eci === "object" && eci.position) {
              const position = eci.position as satellite.PositionAndVelocity["position"];
              if (typeof position === "object" && "x" in position) {
                const gdPos = satellite.eciToGeodetic(position, gmst);
                d.lat = radiansToDegrees(gdPos.latitude);
                d.lng = radiansToDegrees(gdPos.longitude);
                d.alt = gdPos.height / EARTH_RADIUS_KM;
              }
            } else {
              d.lat = NaN;
              d.lng = NaN;
              d.alt = NaN;
            }
          });

          const validSats = satData.filter(
            (d) => !isNaN(d.lat) && !isNaN(d.lng) && !isNaN(d.alt)
          );
          world.particlesData([validSats]);

          // Rotate globe slowly
          const currentPov = world.pointOfView();
          world.pointOfView({
            lng: currentPov.lng + 0.05,
          });

          animationFrameRef.current = requestAnimationFrame(frameTicker);
        };

        frameTicker();
      })
      .catch((err) => {
        console.error("Error loading or running globe satellites:", err);
      });

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default GlobeBackground;
