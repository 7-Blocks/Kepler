import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Satellite,
  Shield,
  BrainCircuit,
  Radar,
  BarChart3,
  ArrowRight,
  Check,
  Globe,
  Lock,
  Target,
  Orbit,
  Eye,
  type LucideIcon,
} from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { MagicCard } from "@/components/ui/magic-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6 } },
};

/* ------------------------------------------------------------------ */
/*  Solution Cards                                                     */
/* ------------------------------------------------------------------ */

interface Solution {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  gradientFrom: string;
  gradientTo: string;
}

const solutions: Solution[] = [
  {
    icon: Shield,
    title: "Autonomous Collision Avoidance",
    description:
      "AI-driven conjunction assessment and autonomous manoeuvre planning that reacts in real time — before threats escalate.",
    features: [
      "Real-time conjunction screening",
      "Autonomous manoeuvre generation",
      "Multi-objective optimisation",
      "Regulatory compliance checks",
    ],
    gradientFrom: "#4FE0C8",
    gradientTo: "#00E5FF",
  },
  {
    icon: Radar,
    title: "Space Traffic Intelligence",
    description:
      "Comprehensive situational awareness across all orbital regimes with predictive analytics and risk scoring.",
    features: [
      "12,400+ objects tracked in real time",
      "Predictive trajectory modelling",
      "Risk scoring & prioritisation",
      "Cross-domain correlation",
    ],
    gradientFrom: "#8B5CF6",
    gradientTo: "#A78BFA",
  },
  {
    icon: BrainCircuit,
    title: "AI Mission Planning",
    description:
      "Intelligent mission design that accounts for debris environment, fuel efficiency, and regulatory constraints.",
    features: [
      "Debris-aware trajectory design",
      "Fuel-optimal manoeuvre sequencing",
      "Launch window analysis",
      "End-of-life disposal planning",
    ],
    gradientFrom: "#FFB454",
    gradientTo: "#F59E0B",
  },
  {
    icon: Globe,
    title: "Orbital Operations Platform",
    description:
      "Unified command centre for fleet operators to monitor, command, and coordinate multi-asset constellations.",
    features: [
      "Multi-asset fleet dashboard",
      "Real-time telemetry visualisation",
      "Automated anomaly detection",
      "Collaborative response workflows",
    ],
    gradientFrom: "#5EE7FF",
    gradientTo: "#38BDF8",
  },
  {
    icon: Lock,
    title: "Compliance & Reporting",
    description:
      "Automated regulatory compliance tracking and reporting for national and international space authorities.",
    features: [
      "Automated IADC guideline checks",
      "FCC / ESA compliance reports",
      "Collision history audit trail",
      "One-click regulatory export",
    ],
    gradientFrom: "#FB7185",
    gradientTo: "#F43F5E",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description:
      "Deep analytics on orbital environment trends, constellation performance, and risk exposure over time.",
    features: [
      "Orbital density heatmaps",
      "Constellation performance KPIs",
      "Risk trend dashboards",
      "Custom report builder",
    ],
    gradientFrom: "#34D399",
    gradientTo: "#10B981",
  },
];

/* ------------------------------------------------------------------ */
/*  Use Cases                                                          */
/* ------------------------------------------------------------------ */

interface UseCase {
  icon: LucideIcon;
  title: string;
  description: string;
}

const useCases: UseCase[] = [
  {
    icon: Satellite,
    title: "Satellite Operators",
    description:
      "Protect your constellation with autonomous collision avoidance and real-time orbital intelligence.",
  },
  {
    icon: Target,
    title: "Launch Providers",
    description:
      "Design debris-aware launch trajectories and ensure compliant end-of-life disposal.",
  },
  {
    icon: Eye,
    title: "Defence & Government",
    description:
      "Maintain space domain awareness with classified-grade analytics and reporting capabilities.",
  },
  {
    icon: Orbit,
    title: "New Space Startups",
    description:
      "Scale your constellation without scaling your operations team — let AI handle the traffic.",
  },
];

/* ------------------------------------------------------------------ */
/*  Stats                                                              */
/* ------------------------------------------------------------------ */

const stats = [
  { value: "12,400+", label: "Objects Tracked" },
  { value: "99.982%", label: "Conjunction Recall" },
  { value: "<40ms", label: "Decision Latency" },
  { value: "0", label: "Unresolved Conflicts" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function SolutionsPage() {
  return (
    <div className="relative min-h-screen bg-[#0C1220] text-[#E7EBF3] selection:bg-[#4FE0C8]/30">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pt-36 pb-24 sm:pt-44 sm:pb-32">
        <Particles className="absolute inset-0" color="#4FE0C8" quantity={140} refresh={false} />
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/8 blur-[160px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00E5FF]" />
              Solutions
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-8 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Intelligent solutions for
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-[#5EE7FF] to-[#8B5CF6] bg-clip-text text-transparent">
              every orbital challenge
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#8892A6]"
          >
            From autonomous collision avoidance to full-spectrum traffic intelligence — Kepler
            delivers AI-powered solutions that keep your assets safe and your operations efficient.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <Link to="/dashboard">
              <ShimmerButton className="rounded-full px-8 py-3 text-sm font-semibold">
                Explore Platform
              </ShimmerButton>
            </Link>
            <a
              href="#solutions"
              className="rounded-full border border-white/15 bg-white/5 px-8 py-3 text-sm font-medium text-white backdrop-blur transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200"
            >
              View Solutions
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="relative border-y border-white/5 bg-[#080D18]/80 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center"
            >
              <div className="text-3xl font-bold text-cyan-300 sm:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm text-[#6B7690]">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Solutions Grid ─── */}
      <section id="solutions" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Core Solutions</h2>
            <p className="mx-auto mt-4 max-w-xl text-[#8892A6]">
              Purpose-built AI systems for every aspect of space traffic management.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {solutions.map((sol, i) => (
              <motion.div
                key={sol.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
              >
                <MagicCard
                  gradientColor={`${sol.gradientFrom}50`}
                  className="group h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 backdrop-blur-xl"
                  fillClassName="bg-[#0C1220]/80"
                >
                  <div
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5"
                    style={{
                      boxShadow: `0 0 24px ${sol.gradientFrom}15`,
                    }}
                  >
                    <sol.icon size={22} style={{ color: sol.gradientFrom }} />
                  </div>

                  <h3 className="text-lg font-semibold text-white">{sol.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#8892A6]">{sol.description}</p>

                  <ul className="mt-5 space-y-2.5">
                    {sol.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-[#A6B0C4]">
                        <Check size={15} className="mt-0.5 shrink-0 text-cyan-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </MagicCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="relative overflow-hidden border-t border-white/5 bg-[#080D18]/60 py-24 sm:py-32">
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-purple-500/5 blur-[120px]" />
          <div className="absolute right-1/4 top-1/3 h-[300px] w-[300px] rounded-full bg-cyan-500/5 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">How Kepler Works</h2>
            <p className="mx-auto mt-4 max-w-xl text-[#8892A6]">
              From data ingestion to autonomous action — a seamless pipeline.
            </p>
          </motion.div>

          <div className="relative mt-16 grid gap-8 md:grid-cols-4">
            {[
              { step: "01", title: "Ingest", desc: "Real-time TLE, radar, and telemetry data from global sources." },
              { step: "02", title: "Analyse", desc: "AI models screen for conjunctions and predict trajectories." },
              { step: "03", title: "Decide", desc: "Autonomous planner generates optimal manoeuvre sequences." },
              { step: "04", title: "Execute", desc: "Commands sent to operators or directly to flight software." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="relative text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 font-display-lg text-lg font-bold text-cyan-300">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-[#8892A6]">{item.desc}</p>
                {i < 3 && (
                  <div className="absolute left-[calc(50%+40px)] top-7 hidden w-[calc(100%-80px)] border-t border-dashed border-white/10 md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Use Cases ─── */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Built For</h2>
            <p className="mx-auto mt-4 max-w-xl text-[#8892A6]">
              Whether you're operating a mega-constellation or launching your first satellite.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {useCases.map((uc, i) => (
              <motion.div
                key={uc.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className="group flex items-start gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/20 hover:bg-cyan-400/[0.03]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <uc.icon size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{uc.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#8892A6]">{uc.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden border-t border-white/5 py-24 sm:py-32">
        <Particles className="absolute inset-0" color="#8B5CF6" quantity={60} refresh={false} />
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <motion.div initial={fadeIn.hidden} whileInView={fadeIn.show} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to secure your orbital assets?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[#8892A6]">
              Join the next generation of space operators using AI to protect their missions.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/dashboard">
                <ShimmerButton className="rounded-full px-8 py-3 text-sm font-semibold">
                  Get Started
                  <ArrowRight size={16} className="ml-2 inline" />
                </ShimmerButton>
              </Link>
              <Link
                to="/docs"
                className="rounded-full border border-white/15 bg-white/5 px-8 py-3 text-sm font-medium text-white backdrop-blur transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-400/10"
              >
                Read the Docs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default SolutionsPage;
