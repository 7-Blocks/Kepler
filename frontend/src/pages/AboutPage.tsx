import React, { useEffect, useLayoutEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CloudSun,
  Database,
  FileSearch,
  Fuel,
  MessagesSquare,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);


function MagneticButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 280, damping: 22 });
  const springY = useSpring(y, { stiffness: 280, damping: 22 });

  return (
    <motion.button
      type="button"
      className={className}
      style={reduce ? undefined : { x: springX, y: springY }}
      whileHover={reduce ? undefined : { scale: 1.03 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      onMouseMove={(e) => {
        if (reduce) return;
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left - rect.width / 2) * 0.28);
        y.set((e.clientY - rect.top - rect.height / 2) * 0.28);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[110] bg-[#4FE0C8]"
      style={{ scaleX }}
    />
  );
}

/* ─── Hero ───────────────────────────────────────────────────────── */

function AboutHero() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const orbitRef = useRef<SVGSVGElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, reduce ? 1 : 0.2]);

  useLayoutEffect(() => {
    if (reduce) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(eyebrowRef.current, { y: 20, opacity: 0, duration: 0.6 })
        .from(
          titleRef.current,
          { y: 80, opacity: 0, duration: 1, rotateX: 12, transformOrigin: "50% 100%" },
          "-=0.25"
        )
        .from(lineRef.current, { y: 40, opacity: 0, duration: 0.7 }, "-=0.55")
        .from(bodyRef.current, { y: 24, opacity: 0, duration: 0.6 }, "-=0.4");

      if (orbitRef.current) {
        gsap.utils.toArray<SVGGElement>(".orbit-ring", orbitRef.current).forEach((ring, i) => {
          gsap.to(ring, {
            rotation: 360,
            svgOrigin: "400 400",
            duration: 36 + i * 16,
            repeat: -1,
            ease: "none",
          });
        });
        gsap.to(orbitRef.current.querySelectorAll(".orbit-dot"), {
          opacity: 0.35,
          duration: 1.6,
          yoyo: true,
          repeat: -1,
          stagger: 0.35,
          ease: "sine.inOut",
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-svh flex items-start px-6 pt-0 mt-0 pb-16 overflow-hidden bg-[#0C1220]"
    >
      {/* Atmosphere */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 85% 20%, rgba(79,224,200,0.12) 0%, transparent 50%), radial-gradient(ellipse 60% 50% at 10% 90%, rgba(255,176,32,0.07) 0%, transparent 45%), #0C1220",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.28] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#1B2436 1px, transparent 1px), linear-gradient(90deg, #1B2436 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 75% 65% at 60% 40%, black 15%, transparent 72%)",
        }}
      />

      {/* GSAP orbital field */}
      <svg
        ref={orbitRef}
        aria-hidden="true"
        viewBox="0 0 800 800"
        className="absolute right-[-18%] top-[38%] -translate-y-1/2 w-[min(820px,95vw)] h-auto opacity-70 pointer-events-none hidden sm:block"
      >
        {[140, 220, 300, 380].map((r, i) => (
          <g key={r} className="orbit-ring">
            <circle
              cx="400"
              cy="400"
              r={r}
              fill="none"
              stroke={i === 2 ? "#FFB020" : "#1B2436"}
              strokeWidth={i === 2 ? 1.2 : 1}
              opacity={i === 2 ? 0.55 : 1}
            />
            <circle
              className="orbit-dot"
              cx={400 + r}
              cy="400"
              r={i === 2 ? 4 : 3}
              fill={i === 2 ? "#FFB020" : "#4FE0C8"}
            />
          </g>
        ))}
        <circle cx="400" cy="400" r="8" fill="#E7EBF3" opacity="0.9" />
      </svg>

      <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-[1180px] mx-auto w-full pt-28 sm:pt-32 md:pt-36">
        <div ref={eyebrowRef} className="font-technical-data text-xs text-[#4FE0C8] tracking-[0.22em] mb-7">
          ABOUT · ORBITAL INTELLIGENCE
        </div>
        <h1
          ref={titleRef}
          className="font-necosmic font-bold text-[clamp(3.5rem,12vw,8rem)] leading-[0.92] text-[#E7EBF3] m-0 tracking-tight"
        >
          Kepler
        </h1>
        <p
          ref={lineRef}
          className="font-necosmic font-medium text-[clamp(1.35rem,3.5vw,2.75rem)] text-[#8892A6] mt-5 mb-0 leading-[1.15] max-w-[18ch]"
        >
          Built for the crowded sky.
        </p>
        <p
          ref={bodyRef}
          className="font-body-ui text-[1.05rem] leading-relaxed text-[#8892A6] mt-8 max-w-[520px]"
        >
          An AI-powered orbital intelligence platform — monitoring satellites,
          tracking debris, predicting collisions, and resolving conflicts
          before they become headlines.
        </p>
      </motion.div>
    </section>
  );
}

/* ─── Mission / Vision ──────────────────────────────── */

function MissionVision() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".mv-panel").forEach((panel) => {
        gsap.from(panel, {
          y: 64,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: panel,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section
      id="mission"
      ref={sectionRef}
      className="relative py-28 px-6 section-rule bg-[#0C1220]"
    >
      <div className="max-w-[1180px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <article className="mv-panel relative overflow-hidden rounded-2xl border border-[#1B2436] bg-[#0C1220]/80 p-8 sm:p-12 min-h-[320px] flex flex-col justify-end">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-60 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 0% 0%, rgba(79,224,200,0.14), transparent 55%)",
            }}
          />
          <div className="relative">
            <div className="font-technical-data text-xs text-[#4FE0C8] tracking-[0.18em] mb-5">
              01 · MISSION
            </div>
            <h2 className="font-necosmic font-semibold text-3xl sm:text-4xl text-[#E7EBF3] m-0 mb-5 leading-[1.1]">
              Keep every orbit
              <br />
              navigable.
            </h2>
            <p className="font-body-ui text-[#8892A6] leading-relaxed m-0 text-[1.02rem] max-w-[42ch]">
              Autonomous, explainable traffic control — predicting conjunctions,
              proposing the smallest safe correction, and leaving a clean record
              for operators and regulators.
            </p>
          </div>
        </article>

        <article className="mv-panel relative overflow-hidden rounded-2xl border border-[#1B2436] bg-[#0C1220]/80 p-8 sm:p-12 min-h-[320px] flex flex-col justify-end lg:mt-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-60 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 100% 100%, rgba(255,176,32,0.12), transparent 55%)",
            }}
          />
          <div className="relative">
            <div className="font-technical-data text-xs text-[#FFB020] tracking-[0.18em] mb-5">
              02 · VISION
            </div>
            <h2 className="font-necosmic font-semibold text-3xl sm:text-4xl text-[#E7EBF3] m-0 mb-5 leading-[1.1]">
              A sky that stays
              <br />
              open for everyone.
            </h2>
            <p className="font-body-ui text-[#8892A6] leading-relaxed m-0 text-[1.02rem] max-w-[42ch]">
              Orbital highways as reliable as terrestrial ones — debris accounted
              for, conflicts resolved in seconds, access not gated by who can
              afford to guess.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

/* ─── Why Kepler ─────────────────────────────────────────────────── */

function WhyKepler() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const reasons = [
    {
      n: "01",
      label: "Congestion",
      body: "Thousands of new satellites enter orbit every year. Manual watchlists and email alerts cannot keep pace with the traffic.",
    },
    {
      n: "02",
      label: "Debris",
      body: "Fragmentation events and spent stages multiply risk. Tracking alone is not enough — operators need decisions, not just detections.",
    },
    {
      n: "03",
      label: "Autonomy",
      body: "Kepler closes the loop: ingest, predict, resolve, record — so near-misses never become the next Kessler cascade headline.",
    },
  ];

  useLayoutEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.from(".why-head", {
        y: 48,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      });
      gsap.from(".why-row", {
        x: reduce ? 0 : window.matchMedia("(min-width: 640px)").matches ? -40 : 0,
        y: window.matchMedia("(min-width: 640px)").matches ? 0 : 28,
        opacity: 0,
        duration: 0.75,
        stagger: 0.14,
        ease: "power3.out",
        scrollTrigger: { trigger: ".why-rows", start: "top 85%" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section
      id="why"
      ref={sectionRef}
      className="py-16 sm:py-24 md:py-28 px-5 sm:px-6 section-rule bg-[#0C1220] overflow-x-clip"
    >
      <div className="max-w-[1180px] mx-auto">
        <div className="why-head mb-10 sm:mb-14 md:mb-16 max-w-[640px]">
          <div className="font-technical-data text-[11px] sm:text-xs text-[#4FE0C8] tracking-[0.18em] mb-3 sm:mb-4">
            03 · WHY KEPLER EXISTS
          </div>
          <h2 className="font-necosmic font-semibold text-3xl sm:text-4xl md:text-5xl text-[#E7EBF3] m-0 mb-4 sm:mb-5 leading-[1.05]">
            Orbit is no longer empty.
          </h2>
          <p className="font-body-ui text-[#8892A6] leading-relaxed m-0 text-[0.98rem] sm:text-[1.05rem]">
            Earth's orbital environment is one of the fastest-growing operational
            challenges in aerospace. Kepler was built because traffic management
            for space still looks like a spreadsheet-era problem.
          </p>
        </div>

        <div className="why-rows flex flex-col">
          {reasons.map((r) => (
            <motion.div
              key={r.label}
              className="why-row group grid grid-cols-[auto_1fr] sm:grid-cols-[88px_minmax(9rem,12.5rem)_1fr] gap-x-3 gap-y-2 sm:gap-x-8 sm:gap-y-1 items-start sm:items-baseline py-6 sm:py-8 border-t border-[#1B2436]/70 last:border-b last:border-[#1B2436]/70"
              whileHover={reduce ? undefined : { x: 6 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <span className="font-technical-data text-xs sm:text-sm text-[#4FE0C8] pt-1 sm:pt-0">
                {r.n}
              </span>
              <h3 className="font-necosmic font-semibold text-xl sm:text-2xl text-[#E7EBF3] m-0 group-hover:text-[#4FE0C8] transition-ui">
                {r.label}
              </h3>
              <p className="col-span-2 sm:col-span-1 sm:col-start-3 font-body-ui text-[#8892A6] leading-relaxed m-0 text-sm sm:text-[0.98rem] max-w-none sm:max-w-[48ch]">
                {r.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Challenges ─────────────────────────────────────────────────── */

function Challenges() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const challenges: {
    num: string;
    title: string;
    body: string;
    Icon: LucideIcon;
  }[] = [
    {
      num: "01",
      title: "Catalog scale",
      body: "Tens of thousands of objects. Ephemerides drift; noise and gaps hide real collisions until late.",
      Icon: Database,
    },
    {
      num: "02",
      title: "Conjunction volume",
      body: "Thousands of close-approach alerts weekly. Ranking by probability and consequence is the difference between noise and action.",
      Icon: AlertTriangle,
    },
    {
      num: "03",
      title: "Maneuver cost",
      body: "Every avoidance burn spends propellant and mission life. The right maneuver is the smallest one that still keeps risk below threshold.",
      Icon: Fuel,
    },
    {
      num: "04",
      title: "Explainability",
      body: "Regulators and insurers need a trail: why a maneuver was chosen, what data fed it, and whether it can be audited.",
      Icon: FileSearch,
    },
    {
      num: "05",
      title: "Space weather",
      body: "Atmospheric density swings shift LEO decay overnight. Models that ignore solar activity miss the window that matters.",
      Icon: CloudSun,
    },
    {
      num: "06",
      title: "Coordination lag",
      body: "Cross-operator coordination is slow and fragmented. Seconds of autonomy beat hours of email threads.",
      Icon: MessagesSquare,
    },
  ];

  useLayoutEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.from(".chal-head", {
        y: 40,
        opacity: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
      });
      gsap.from(".chal-card", {
        y: 56,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: ".chal-grid", start: "top 82%" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section
      id="challenges"
      ref={sectionRef}
      className="py-28 px-6 section-rule bg-[#0C1220]"
    >
      <div className="max-w-[1180px] mx-auto">
        <div className="chal-head mb-14 max-w-[620px] ml-auto text-right">
          <div className="font-technical-data text-xs text-[#4FE0C8] tracking-[0.18em] mb-4">
            04 · CHALLENGES
          </div>
          <h2 className="font-necosmic font-semibold text-4xl sm:text-5xl text-[#E7EBF3] m-0 mb-5 leading-[1.05]">
            What modern STM still gets wrong.
          </h2>
          <p className="font-body-ui text-[#8892A6] leading-relaxed m-0 text-[1.05rem]">
            The physics of orbit are known. The operational stack around them is
            not. These are the failure modes Kepler is designed to absorb.
          </p>
        </div>

        <div className="chal-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map((c, i) => {
            const { Icon } = c;
            return (
              <motion.article
                key={c.num}
                className={`chal-card relative overflow-hidden rounded-2xl border border-[#1B2436] bg-[#0C1220] p-7 min-h-[220px] flex flex-col ${
                  i === 0 || i === 5 ? "sm:col-span-2 lg:col-span-1" : ""
                }`}
                whileHover={
                  reduce
                    ? undefined
                    : { y: -6, borderColor: "rgba(79,224,200,0.45)" }
                }
                transition={{ type: "spring", stiffness: 360, damping: 28 }}
              >
                <Icon
                  aria-hidden="true"
                  strokeWidth={1.15}
                  className="pointer-events-none absolute -right-4 -bottom-4 h-36 w-36 sm:h-44 sm:w-44 text-[#4FE0C8] opacity-[0.08]"
                />
                <div className="relative z-10 flex flex-col flex-1">
                  <span className="font-technical-data text-xs text-[#FFB020] mb-6">
                    {c.num}
                  </span>
                  <h3 className="font-necosmic font-semibold text-xl text-[#E7EBF3] m-0 mb-3">
                    {c.title}
                  </h3>
                  <p className="font-body-ui text-sm text-[#8892A6] leading-relaxed m-0 mt-auto">
                    {c.body}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Roadmap ──────────────────────────────── */

function Roadmap() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const milestones = [
    {
      phase: "01",
      era: "Foundation",
      status: "Live",
      items: [
        "Live satellite & debris tracking",
        "Digital twin Earth visualization",
        "Conjunction prediction core",
        "Operator dashboard & risk panels",
      ],
    },
    {
      phase: "02",
      era: "Autonomy",
      status: "In progress",
      items: [
        "Multi-agent AI decision system",
        "Autonomous maneuver recommendations",
        "Explainable decision records",
        "Space weather–aware forecasts",
      ],
    },
    {
      phase: "03",
      era: "Coordination",
      status: "Next",
      items: [
        "Cross-operator conflict corridors",
        "Partner catalog fusion at scale",
        "Regulator-ready audit exports",
        "Closed-loop execution with human veto",
      ],
    },
    {
      phase: "04",
      era: "Horizon",
      status: "Research",
      items: [
        "Debris remediation planning support",
        "Cislunar traffic corridors",
        "Predictive constellation capacity maps",
        "Open standards for STM interoperability",
      ],
    },
  ];

  useLayoutEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.from(".road-head", {
        y: 40,
        opacity: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
      });

      if (progressRef.current) {
        gsap.fromTo(
          progressRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".road-track",
              start: "top 60%",
              end: "bottom 30%",
              scrub: 0.6,
            },
          }
        );
      }

      gsap.utils.toArray<HTMLElement>(".road-item").forEach((item) => {
        gsap.from(item, {
          x: 48,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: item,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section
      id="roadmap"
      ref={sectionRef}
      className="py-28 px-6 section-rule bg-[#0C1220]"
    >
      <div className="max-w-[1180px] mx-auto">
        <div className="road-head mb-16 max-w-[560px]">
          <div className="font-technical-data text-xs text-[#4FE0C8] tracking-[0.18em] mb-4">
            05 · FUTURE ROADMAP
          </div>
          <h2 className="font-necosmic font-semibold text-4xl sm:text-5xl text-[#E7EBF3] m-0 mb-5 leading-[1.05]">
            From watchtower to traffic control.
          </h2>
          <p className="font-body-ui text-[#8892A6] leading-relaxed m-0 text-[1.05rem]">
            A phased path from situational awareness to autonomous, coordinated
            orbital traffic management.
          </p>
        </div>

        <div className="road-track relative pl-2 sm:pl-4">
          <div
            aria-hidden="true"
            className="absolute left-[19px] sm:left-[27px] top-3 bottom-3 w-px bg-[#1B2436] origin-top"
          />
          <div
            ref={progressRef}
            aria-hidden="true"
            className="absolute left-[19px] sm:left-[27px] top-3 bottom-3 w-px bg-[#4FE0C8] origin-top"
            style={{ transform: "scaleY(0)" }}
          />

          <ol className="m-0 p-0 list-none flex flex-col gap-14">
            {milestones.map((m) => (
              <li
                key={m.phase}
                className="road-item relative grid grid-cols-[40px_1fr] sm:grid-cols-[56px_1fr] gap-5 sm:gap-8"
              >
                <div className="relative z-10 flex justify-center pt-1">
                  <motion.span
                    className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-[#4FE0C8]/60 bg-[#0C1220] font-technical-data text-xs text-[#4FE0C8]"
                    whileHover={reduce ? undefined : { scale: 1.08, borderColor: "#4FE0C8" }}
                  >
                    {m.phase}
                  </motion.span>
                </div>

                <div>
                  <div className="flex flex-wrap items-baseline gap-3 mb-4">
                    <h3 className="font-necosmic font-semibold text-2xl sm:text-3xl text-[#E7EBF3] m-0">
                      {m.era}
                    </h3>
                    <span className="font-technical-data text-[11px] text-[#8892A6] uppercase tracking-wider">
                      {m.status}
                    </span>
                  </div>
                  <ul className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {m.items.map((item) => (
                      <li
                        key={item}
                        className="font-body-ui text-sm text-[#8892A6] leading-snug flex gap-2.5"
                      >
                        <span className="text-[#4FE0C8] shrink-0" aria-hidden="true">
                          —
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ────────────────────────────────────────────────────────── */

function ClosingCta({ onLaunchDashboard }: { onLaunchDashboard: () => void }) {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.from(".cta-block", {
        y: 50,
        opacity: 0,
        scale: 0.98,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section
      ref={sectionRef}
      className="py-28 px-6 section-rule bg-[#0C1220]"
    >
      <div className="cta-block max-w-[1180px] mx-auto relative overflow-hidden rounded-3xl border border-[#1B2436] px-8 py-16 sm:px-16 sm:py-20 text-center">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 120%, rgba(79,224,200,0.16), transparent 55%), radial-gradient(ellipse 50% 40% at 80% 0%, rgba(255,176,32,0.1), transparent 50%), #0C1220",
          }}
        />
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="font-necosmic font-semibold text-4xl sm:text-5xl text-[#E7EBF3] m-0 mb-5 leading-[1.05]">
            See the sky as it is.
          </h2>
          <p className="font-body-ui text-[#8892A6] leading-relaxed max-w-[440px] mb-10 text-[1.05rem]">
            Open the operational command center — tracking, prediction, and
            autonomous recommendations in one place.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <MagneticButton
              onClick={onLaunchDashboard}
              className="font-body-ui font-semibold text-[15px] text-[#060A14] bg-[#FFB020] hover:bg-[#e59b15] border-none rounded-lg px-7 py-3.5 cursor-pointer"
            >
              Launch Dashboard
            </MagneticButton>
            <Link
              to="/"
              className="font-body-ui font-semibold text-[15px] text-[#E7EBF3] bg-transparent border border-[#1B2436] hover:border-[#4FE0C8]/50 hover:bg-[#1B2436]/30 rounded-lg px-7 py-3.5 no-underline transition-ui"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  useEffect(() => {
    ScrollTrigger.refresh();
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="bg-[#0C1220]">
      {!reduce && <ScrollProgress />}
      <AboutHero />
      <MissionVision />
      <WhyKepler />
      <Challenges />
      <Roadmap />
      <ClosingCta onLaunchDashboard={() => navigate("/dashboard")} />
    </div>
  );
};

export default AboutPage;
