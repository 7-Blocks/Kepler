import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MaterialIcon } from "@/components/MaterialIcon";

/**
 * Kepler — 404 Not Found Page
 * -----------------------------------------------------------------------
 * Matches the app's dashboard design system (designSystem.ts / index.css
 * theme tokens): deep space background, technical grid, glass panels,
 * Space Grotesk / IBM Plex Sans type, cyan glow accents.
 * -----------------------------------------------------------------------
 */

interface DebrisFieldProps {
  prefersReducedMotion: boolean;
}

function DebrisField({ prefersReducedMotion }: DebrisFieldProps) {
  const orbits = [
    { rx: 220, ry: 80, rotate: -15, dur: 30, dot: "#00e5ff", label: "SIG-LOST" },
    { rx: 300, ry: 115, rotate: 10, dur: 42, dot: "#00e5ff", label: "ROUTE-404" },
    { rx: 160, ry: 55, rotate: 24, dur: 20, dot: "#FF9500", label: "OOB" },
  ];

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-0"
    >
      <svg viewBox="-400 -200 800 400" className="w-[min(1000px,140%)] h-auto opacity-70">
        <circle cx="0" cy="0" r="8" fill="#c3f5ff" opacity="0.5" />
        {orbits.map((o, i) => (
          <g key={i} transform={`rotate(${o.rotate})`}>
            <ellipse
              cx="0"
              cy="0"
              rx={o.rx}
              ry={o.ry}
              fill="none"
              stroke="#1F2937"
              strokeWidth="1"
            />
            <g>
              {!prefersReducedMotion && (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 0 0"
                  to="360 0 0"
                  dur={`${o.dur}s`}
                  repeatCount="indefinite"
                />
              )}
              <circle cx={o.rx} cy="0" r="3" fill={o.dot} />
              <text
                x={o.rx + 8}
                y="4"
                fontFamily="IBM Plex Sans, monospace"
                fontSize="9"
                fill={o.dot}
                opacity="0.85"
              >
                {o.label}
              </text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-background technical-grid text-on-surface overflow-hidden flex items-center justify-center px-6">
      <DebrisField prefersReducedMotion={prefersReducedMotion} />

      <div className="relative z-10 max-w-lg w-full text-center">
        <div className="glass-panel rounded-xl px-8 py-10 sm:px-12 sm:py-14 glow-cyan">
          <div className="inline-flex items-center gap-2 font-technical-data text-xs text-primary-container border border-border-panel rounded-full px-3.5 py-1.5 mb-8 bg-surface">
            <MaterialIcon name="satellite_alt" className="text-sm" />
            TELEMETRY SIGNAL LOST
          </div>

          <h1 className="font-display-lg font-bold text-7xl sm:text-8xl text-primary tracking-tight leading-none">
            404
          </h1>

          <h2 className="font-headline-lg text-lg sm:text-xl text-text-satellite font-bold tracking-tight mt-4 uppercase">
            Object Not Found In Orbit
          </h2>

          <p className="font-body-ui text-sm text-on-surface-variant leading-relaxed mt-3 max-w-sm mx-auto">
            The route you requested doesn't correspond to any tracked page.
            It may have decayed, been renamed, or never existed in this
            catalog.
          </p>

          <button
            onClick={() => navigate("/dashboard")}
            className="mt-9 inline-flex items-center gap-2 font-body-ui font-semibold text-sm text-on-primary bg-primary-container hover:opacity-90 rounded-lg px-6 py-3 cursor-pointer transition-opacity duration-150"
          >
            <MaterialIcon name="dashboard" className="text-base" />
            Return to Dashboard
          </button>
        </div>

        <p className="font-technical-data text-[11px] text-text-muted mt-6">
          ERROR CODE: KPLR-404 · REQUESTED PATH NOT IN CATALOG
        </p>
      </div>
    </div>
  );
};

export default NotFound;
