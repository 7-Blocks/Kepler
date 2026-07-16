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
 * -----------------------------------------------------------------------
 */

const FONT_LINK_ID = "kepler-landing-fonts";

function useInjectFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);
}

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

/* Nav */

interface NavBarProps {
  onLaunchDashboard: () => void;
}

function NavBar({ onLaunchDashboard }: NavBarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Product", href: "#product" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Reliability", href: "#reliability" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md transition-all duration-200 ${
        scrolled
          ? "bg-[#060A14]/85 border-b border-[#1B2436]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1180px] mx-auto px-6 py-4 flex items-center justify-between">
        <span className="font-display-xl text-headline-xl text-xl font-bold tracking-tighter text-primary-container drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]">
          Kepler
        </span>

        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="font-body-ui text-sm text-[#8892A6] hover:text-[#E7EBF3] transition-colors duration-150"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <button
          onClick={onLaunchDashboard}
          className="font-body-ui font-semibold bg-primary-container shadow-none transition-ui hover:shadow-[0_0_8px_rgba(0,229,255,1)] text-sm text-[#060A14] bg-[#4FE0C8] border-none rounded-md px-4 py-2 cursor-pointer transition-colors duration-150"
        >
          Dashboard
        </button>
      </div>
    </header>
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
      className="py-24 px-6 border-t border-[#1B2436] bg-[#060A14]"
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
      className="py-20 px-6 border-t border-[#1B2436] bg-[#0C1220]"
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

/* Footer */

function Footer() {
  return (
    <footer
      id="contact"
      className="border-t border-[#1B2436] py-12 px-6 bg-[#060A14]"
    >
      <div className="max-w-[1180px] mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div className="max-w-[320px]">
          <div className="font-display-lg font-semibold text-base text-[#E7EBF3] mb-2">
            Kepler
          </div>
          <p className="font-body-ui text-[13px] text-[#8892A6] leading-relaxed m-0">
            Autonomous space traffic management, built for operators who
            can't afford to guess.
          </p>
        </div>

        <div className="flex gap-14 flex-wrap">
          <div>
            <div className="font-body-ui text-xs text-[#4FE0C8] mb-3.5 font-semibold">
              PRODUCT
            </div>
            {[
              { label: "Overview", href: "#product" },
              { label: "How it works", href: "#how-it-works" },
              { label: "Reliability", href: "#reliability" }
            ].map((link) => (
              <div key={link.label} className="mb-2">
                <a href={link.href} className="font-body-ui text-[13px] text-[#8892A6] hover:text-[#E7EBF3] no-underline transition-colors duration-150">
                  {link.label}
                </a>
              </div>
            ))}
          </div>
          <div>
            <div className="font-body-ui text-xs text-[#4FE0C8] mb-3.5 font-semibold">
              COMPANY
            </div>
            {[
              { label: "About", disabled: true },
              { label: "Careers", disabled: true },
              { label: "Contact", href: "#contact" }
            ].map((link) => (
              <div key={link.label} className="mb-2">
                {link.disabled ? (
                  <span className="font-body-ui text-[13px] text-[#8892A6]/50 cursor-default select-none">
                    {link.label}
                  </span>
                ) : (
                  <a href={link.href} className="font-body-ui text-[13px] text-[#8892A6] hover:text-[#E7EBF3] no-underline transition-colors duration-150">
                    {link.label}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto mt-10 pt-5 border-t border-[#1B2436]/40 font-technical-data text-[11px] text-[#8892A6]">
        © {new Date().getFullYear()} Kepler. All systems nominal.
      </div>
    </footer>
  );
}

/* Page */

export const LandingPage: React.FC = () => {
  useInjectFonts();
  const navigate = useNavigate();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Dynamic overflow modification to support page anchors scrolling
    document.body.style.overflow = "auto";
    document.body.style.overflowX = "hidden";
    
    return () => {
      document.body.style.overflow = "hidden";
      document.body.style.overflowX = "hidden";
    };
  }, []);

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
    <div className="bg-[#060A14] min-h-screen text-[#E7EBF3] overflow-x-hidden select-none">
      <NavBar onLaunchDashboard={handleLaunch} />
      <Hero />
      <HowItWorks />
      <Reliability />
      <Footer />
    </div>
  );
};

export default LandingPage;
