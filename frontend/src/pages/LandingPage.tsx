import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import Lightfall from "@/components/ui/Lightfall";
import { Database, LineChart, Zap, History } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/* ─── Shared Components ─────────────────────────────────────────── */

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

/* ─── Hero Section (Lightfall Background) ───────────────────────── */

interface HeroProps {
  onLaunchDashboard: () => void;
  prefersReducedMotion: boolean;
}

function Hero({ onLaunchDashboard, prefersReducedMotion }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, prefersReducedMotion ? 1 : 0.2]);

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(
        titleRef.current,
        { y: 60, opacity: 0, duration: 0.9, rotateX: 8, transformOrigin: "50% 100%" }
      )
        .from(bodyRef.current, { y: 24, opacity: 0, duration: 0.6 }, "-=0.45")
        .from(buttonsRef.current, { y: 16, opacity: 0, duration: 0.5 }, "-=0.3");
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="product"
      className="relative min-h-svh flex items-center justify-center px-6 pt-0 mt-0 pb-16 overflow-hidden bg-[#0C1220]"
    >
      {/* Lightfall WebGL Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Lightfall
          colors={['#00e5ff', '#00707cff', '#9ddfe7ff', '#00e5ff']}
          backgroundColor="#0C1220"
          speed={0.4}
          streakCount={3}
          streakWidth={1.2}
          streakLength={1.2}
          glow={0.8}
          density={0.5}
          twinkle={0.8}
          zoom={2.5}
          backgroundGlow={0.4}
          opacity={0.1}
          mouseInteraction={!prefersReducedMotion}
          mouseStrength={0.6}
          mouseRadius={1.2}
        />
      </div>

      {/* Background Atmosphere Overlay for smooth blending */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-1"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 30%, rgba(12,18,32,0.1) 0%, rgba(12,18,32,0.8) 75%, #0C1220 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.18] pointer-events-none z-1"
        style={{
          backgroundImage:
            "linear-gradient(#1B2436 1px, transparent 1px), linear-gradient(90deg, #1B2436 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 75% 65% at 50% 50%, black 15%, transparent 72%)",
        }}
      />

      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 max-w-[800px] text-center flex flex-col items-center pt-12"
      >
        <h1
          ref={titleRef}
          className="font-necosmic font-bold text-4xl sm:text-5xl md:text-6.5xl leading-[1.1] text-[#E7EBF3] m-0 tracking-tighter"
        >
          Autonomous traffic control <br />
          for <span className="text-[#00e5ff] drop-shadow-[0_0_15px_rgba(0,229,255,0.25)]">everything in orbit</span>.
        </h1>

        <p
          ref={bodyRef}
          className="font-body-ui text-[1.05rem] sm:text-[1.12rem] leading-relaxed text-[#8892A6] mt-8 mb-10 max-w-[580px]"
        >
          Kepler predicts conjunctions, resolves conflicts autonomously, and provides
          operators with a clean, explainable decision ledger — before a near-miss ever
          becomes a headline.
        </p>

        <div ref={buttonsRef} className="flex gap-4 justify-center flex-wrap">
          <MagneticButton
            onClick={onLaunchDashboard}
            className="font-body-ui font-semibold text-[15px] text-[#060A14] bg-[#00e5ff] hover:bg-[#00daf3] border-none rounded-lg px-8 py-4 cursor-pointer shadow-[0_0_20px_rgba(0,229,255,0.35)] transition-all duration-200"
          >
            Launch Dashboard
          </MagneticButton>
          <a
            href="#how-it-works"
            className="font-body-ui font-semibold text-[15px] text-[#E7EBF3] bg-[#0C1220]/60 backdrop-blur-sm border border-[#1B2436] hover:border-[#00e5ff]/50 hover:bg-[#1B2436]/40 rounded-lg px-8 py-4 text-none transition-all duration-200"
          >
            See how it works
          </a>
        </div>
      </motion.div>
    </section>
  );
}

/* ─── How It Works ────────────────────────────────────────────── */

function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const steps = [
    {
      title: "Ingest",
      body: "Kepler pulls tracking data from public and partner catalogs, normalizing ephemerides in real time.",
      Icon: Database,
    },
    {
      title: "Predict",
      body: "A conjunction model flags close approaches days out, ranked by probability and consequence.",
      Icon: LineChart,
    },
    {
      title: "Resolve",
      body: "Autonomous maneuver planning proposes — or executes — the smallest safe correction.",
      Icon: Zap,
    },
    {
      title: "Record",
      body: "Every decision is logged with the telemetry and reasoning behind it, for operators and regulators alike.",
      Icon: History,
    },
  ];

  useLayoutEffect(() => {
    if (reduce) return;

    const ctx = gsap.context(() => {
      gsap.from(".hiw-head", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });

      gsap.from(".hiw-card", {
        y: 50,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".hiw-grid",
          start: "top 85%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-28 px-6 section-rule bg-[#0C1220] relative overflow-hidden"
    >
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 10% 20%, rgba(79,224,200,0.06), transparent 50%)",
        }}
      />

      <div className="max-w-[1180px] mx-auto relative z-10">
        <div className="hiw-head mb-16 max-w-[600px]">
          <div className="font-technical-data text-xs text-[#4FE0C8] tracking-[0.18em] mb-4">
            01 · WORKFLOW LOOP
          </div>
          <h2 className="font-necosmic font-semibold text-3xl sm:text-4xl md:text-5xl text-[#E7EBF3] m-0 mb-5 leading-[1.08]">
            From tracked object to resolved conflict
          </h2>
          <p className="font-body-ui text-[1.05rem] text-[#8892A6] leading-relaxed m-0">
            A closed loop that runs continuously, not a dashboard you have to babysit.
          </p>
        </div>

        <div className="hiw-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => {
            const { Icon } = s;
            return (
              <motion.div
                key={s.title}
                className="hiw-card relative overflow-hidden bg-[#0C1220] border border-[#1B2436] rounded-xl p-8 flex flex-col min-h-[200px]"
                whileHover={reduce ? undefined : { y: -5, borderColor: "rgba(79,224,200,0.35)" }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              >
                <Icon
                  aria-hidden="true"
                  strokeWidth={1.15}
                  className="pointer-events-none absolute -right-6 -bottom-6 h-28 w-28 text-[#4FE0C8] opacity-[0.06] select-none"
                />
                <div className="relative z-10 flex flex-col flex-1">
                  <div className="font-technical-data text-xs text-[#4FE0C8] mb-5">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="font-necosmic font-semibold text-xl text-[#E7EBF3] mb-3">
                    {s.title}
                  </h3>
                  <p className="font-body-ui text-sm text-[#8892A6] leading-relaxed m-0">
                    {s.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Reliability (Stats) Section ─────────────────────────────── */

function Reliability() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const stats = [
    { value: "12,400+", label: "objects tracked" },
    { value: "99.982%", label: "conjunction recall" },
    { value: "< 40ms", label: "decision latency" },
    { value: "0", label: "unresolved conflicts, to date" },
  ];

  useLayoutEffect(() => {
    if (reduce) return;

    const ctx = gsap.context(() => {
      gsap.from(".stat-box", {
        y: 32,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 88%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <section
      id="reliability"
      ref={sectionRef}
      className="py-24 px-6 section-rule bg-[#0C1220]"
    >
      <div className="max-w-[1180px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s) => (
          <div key={s.label} className="stat-box">
            <div className="font-display-lg font-bold text-3xl sm:text-4xl md:text-5xl text-[#4FE0C8] tracking-tight">
              {s.value}
            </div>
            <div className="font-technical-data text-xs text-[#8892A6] mt-3 uppercase tracking-wider">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── CTA Section ─────────────────────────────────────────────── */

function ClosingCta({ onLaunchDashboard }: { onLaunchDashboard: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    if (reduce) return;

    const ctx = gsap.context(() => {
      gsap.from(".cta-box", {
        y: 40,
        opacity: 0,
        scale: 0.98,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <section
      ref={sectionRef}
      className="py-28 px-6 section-rule bg-[#0C1220]"
    >
      <div className="cta-box max-w-[1180px] mx-auto relative overflow-hidden rounded-3xl border border-[#1B2436] px-8 py-16 sm:px-16 sm:py-20 text-center">
        {/* Atmosphere */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 120%, rgba(79,224,200,0.14), transparent 55%), radial-gradient(ellipse 50% 40% at 85% 0%, rgba(255,176,32,0.08), transparent 50%), #0C1220",
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <h2 className="font-necosmic font-semibold text-3xl sm:text-4xl md:text-5xl text-[#E7EBF3] m-0 mb-6 leading-[1.05]">
            Secure the skies with Kepler.
          </h2>
          <p className="font-body-ui text-[#8892A6] leading-relaxed max-w-[460px] mb-10 text-[1.05rem]">
            Deploy our autonomous space traffic management suite to track assets, predict risks, and resolve conflicts.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <MagneticButton
              onClick={onLaunchDashboard}
              className="font-body-ui font-semibold text-[15px] text-[#060A14] bg-[#FFB020] hover:bg-[#e59b15] border-none rounded-lg px-7 py-3.5 cursor-pointer shadow-lg shadow-orange-500/10"
            >
              Launch Dashboard
            </MagneticButton>
            <Link
              to="/about"
              className="font-body-ui font-semibold text-[15px] text-[#E7EBF3] bg-transparent border border-[#1B2436] hover:border-[#4FE0C8]/50 hover:bg-[#1B2436]/20 rounded-lg px-7 py-3.5 no-underline transition-all duration-200"
            >
              Learn about us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  useEffect(() => {
    ScrollTrigger.refresh();
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const handleLaunch = () => {
    navigate("/dashboard");
  };

  return (
    <div className="bg-[#0C1220] select-none">
      {!reduce && <ScrollProgress />}
      <Hero onLaunchDashboard={handleLaunch} prefersReducedMotion={!!reduce} />
      <HowItWorks />
      <Reliability />
      <ClosingCta onLaunchDashboard={handleLaunch} />
    </div>
  );
};

export default LandingPage;
