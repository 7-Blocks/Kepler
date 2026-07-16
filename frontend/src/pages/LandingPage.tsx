import Hero from "@/components/Hero";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Kepler — Landing Page
 * -----------------------------------------------------------------------
 * Design tokens
 *   bg          #060A14  deep orbital black
 *   bg-panel    #0C1220  raised panel / nav / footer
 *   line        #1B2436  hairline borders
 *   text        #E7EBF3  primary text
 *   text-dim    #8892A6  secondary text
 *   accent      #4FE0C8  "tracked" telemetry teal (signature color)
 *   warn        #FFB020  "conflict" amber (used sparingly, for CTA + alerts)
 *
 * Type
 *   display: "Space Grotesk" (headlines — geometric, technical, a little cold)
 *   body:    "Inter" (paragraphs, nav, footer)
 *   mono:    "JetBrains Mono" (telemetry labels, coordinates, small data)
 *
 * Signature element
 *   A live orbital field in the hero: thin elliptical paths with small
 *   telemetry dots drifting along them, each carrying a coordinate-style
 *   label. It's the literal subject — space traffic — rendered as the
 *   backdrop rather than an abstract gradient blob.
 *
 * Chrome (nav / footer) lives in MarketingLayout.
 * -----------------------------------------------------------------------
 */

/* Orbital field */

interface OrbitalFieldProps {
  prefersReducedMotion: boolean;
}

function OrbitalField({ prefersReducedMotion }: OrbitalFieldProps) {
  const orbits = [
    { rx: 260, ry: 90, rotate: -18, dur: 34, dot: "#4FE0C8", label: "SAT-2291" },
    { rx: 340, ry: 130, rotate: 8, dur: 46, dot: "#4FE0C8", label: "SAT-0417" },
    { rx: 180, ry: 60, rotate: 22, dur: 22, dot: "#FFB020", label: "CONJ-88" },
    { rx: 400, ry: 160, rotate: -6, dur: 58, dot: "#4FE0C8", label: "SAT-3355" },
  ];

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-0"
    >
      <svg
        viewBox="-450 -220 900 440"
        className="w-[min(1100px,150%)] h-auto opacity-90"
      >
        <circle cx="0" cy="0" r="10" fill="#E7EBF3" opacity="0.9" />

        {orbits.map((o, i) => (
          <g key={i} transform={`rotate(${o.rotate})`}>
            <ellipse
              cx="0"
              cy="0"
              rx={o.rx}
              ry={o.ry}
              fill="none"
              stroke="#1B2436"
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
              <circle cx={o.rx} cy="0" r="3.5" fill={o.dot} />
              <text
                x={o.rx + 10}
                y="4"
                className="font-technical-data"
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

/* Hero */

interface HeroProps {
  onLaunchDashboard: () => void;
  prefersReducedMotion: boolean;
}

function Hero({ onLaunchDashboard, prefersReducedMotion }: HeroProps) {
  return (
    <section
      id="product"
      className="relative min-h-svh flex items-center justify-center px-6 pt-0 mt-0 pb-16 overflow-hidden"
    >
      <OrbitalField prefersReducedMotion={prefersReducedMotion} />

      <div className="relative z-10 max-w-[720px] text-center flex flex-col items-center">
        <div className="inline-flex items-center font-technical-data text-xs text-[#4FE0C8] border border-[#1B2436] rounded-full px-3.5 py-1.5 mb-7 bg-[#0C1220]">
          TRACKING 12,400+ OBJECTS · LIVE
        </div>

        <h1 className="font-display-lg font-bold text-4xl sm:text-5xl md:text-6xl leading-[1.08] text-[#E7EBF3] m-0 tracking-tight">
          Autonomous traffic control
          <br />
          for everything in orbit.
        </h1>

        <p className="font-body-ui text-[1.05rem] leading-relaxed text-[#8892A6] mt-6 mb-9 max-w-[560px]">
          Kepler predicts conjunctions, resolves them autonomously, and hands
          operators a clean, explainable record — before a near-miss ever
          becomes a headline.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            type="button"
            onClick={onLaunchDashboard}
            className="font-body-ui font-semibold text-[15px] text-[#060A14] bg-[#FFB020] hover:bg-[#e59b15] border-none rounded-lg px-6.5 py-3 cursor-pointer transition-colors duration-150"
          >
            Launch Dashboard
          </button>
          <a
            href="#how-it-works"
            className="font-body-ui font-semibold text-[15px] text-[#E7EBF3] bg-transparent border border-[#1B2436] hover:bg-[#1B2436]/30 rounded-lg px-6.5 py-3 text-none transition-colors duration-150"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}

/* How it works */

function HowItWorks() {
  const steps = [
    {
      title: "Ingest",
      body: "Kepler pulls tracking data from public and partner catalogs, normalizing ephemerides in real time.",
    },
    {
      title: "Predict",
      body: "A conjunction model flags close approaches days out, ranked by probability and consequence.",
    },
    {
      title: "Resolve",
      body: "Autonomous maneuver planning proposes — or executes — the smallest safe correction.",
    },
    {
      title: "Record",
      body: "Every decision is logged with the telemetry and reasoning behind it, for operators and regulators alike.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-24 px-6 section-rule bg-[#0C1220]"
    >
      <div className="max-w-[1180px] mx-auto">
        <h2 className="font-display-lg font-semibold text-3xl text-[#E7EBF3] mb-3">
          From tracked object to resolved conflict
        </h2>
        <p className="font-body-ui text-[#8892A6] max-w-[560px] mb-14 leading-relaxed">
          A closed loop that runs continuously, not a dashboard you have to
          babysit.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="bg-[#0C1220] border border-[#1B2436] rounded-xl p-6 flex flex-col"
            >
              <div className="font-technical-data text-xs text-[#4FE0C8] mb-3">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-display-lg font-semibold text-lg text-[#E7EBF3] mb-2">
                {s.title}
              </h3>
              <p className="font-body-ui text-sm text-[#8892A6] leading-relaxed m-0">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Reliability strip */

function Reliability() {
  const stats = [
    { value: "12,400+", label: "objects tracked" },
    { value: "99.982%", label: "conjunction recall" },
    { value: "< 40ms", label: "decision latency" },
    { value: "0", label: "unresolved conflicts, to date" },
  ];

  return (
    <section
      id="reliability"
      className="py-20 px-6 section-rule bg-[#0C1220]"
    >
      <div className="max-w-[1180px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="font-display-lg font-bold text-3xl text-[#4FE0C8]">
              {s.value}
            </div>
            <div className="font-body-ui text-xs text-[#8892A6] mt-1.5">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* Page */

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const handleLaunch = () => {
    navigate("/dashboard");
  };

  return (
    <div className="select-none">
      <Hero onLaunchDashboard={handleLaunch} prefersReducedMotion={prefersReducedMotion} />
      <HowItWorks />
      <Reliability />
    </div>
  );
};

export default LandingPage;
