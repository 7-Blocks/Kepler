import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { MagicCard } from "@/components/ui/magic-card";
import { Particles } from "@/components/ui/particles";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { MaterialIcon } from "@/components/MaterialIcon";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

interface Feature {
  icon: string;
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
}

const features: Feature[] = [
  {
    icon: "radar",
    title: "Real-Time Orbital Tracking",
    description: "Monitor thousands of satellites and debris objects with sub-meter precision. Continuous TLE ingestion and ephemeris propagation.",
    gradientFrom: "#00e5ff",
    gradientTo: "#0088ff",
  },
  {
    icon: "cognition",
    title: "AI Collision Prediction",
    description: "Machine learning models trained on historical conjunction data predict collision probabilities with 99.98% recall.",
    gradientFrom: "#7c3aed",
    gradientTo: "#a855f7",
  },
  {
    icon: "psychology",
    title: "Autonomous Decision Agents",
    description: "Multi-agent AI system that evaluates risks, recommends maneuvers, and executes avoidance actions with human oversight.",
    gradientFrom: "#00e5ff",
    gradientTo: "#7c3aed",
  },
  {
    icon: "cloud",
    title: "Space Weather Integration",
    description: "Live solar activity, geomagnetic storm, and radiation data fused into orbital models for accurate decay predictions.",
    gradientFrom: "#0088ff",
    gradientTo: "#00e5ff",
  },
  {
    icon: "timeline",
    title: "Collision Timeline",
    description: "Visual timeline of all predicted conjunctions with probability bars, miss distances, and T-minus countdowns.",
    gradientFrom: "#7c3aed",
    gradientTo: "#a855f7",
  },
  {
    icon: "dashboard",
    title: "Mission Dashboard",
    description: "Comprehensive operational view with KPI widgets, 3D Earth twin, and real-time data streams in one interface.",
    gradientFrom: "#00e5ff",
    gradientTo: "#0088ff",
  },
  {
    icon: "description",
    title: "Audit-Ready Records",
    description: "Every decision logged with full explainability trail — regulator-ready export for compliance and insurance.",
    gradientFrom: "#a855f7",
    gradientTo: "#7c3aed",
  },
  {
    icon: "sync_alt",
    title: "Cross-Operator Coordination",
    description: "Shared conflict corridors and automated coordination between operators to resolve conjunctions collaboratively.",
    gradientFrom: "#0088ff",
    gradientTo: "#00e5ff",
  },
  {
    icon: "auto_graph",
    title: "Maneuver Optimization",
    description: "Minimal-fuel avoidance maneuver proposals computed via constrained optimization, preserving mission life.",
    gradientFrom: "#7c3aed",
    gradientTo: "#a855f7",
  },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "For individual operators and small constellations.",
    features: ["Up to 10 satellites", "Basic tracking & alerts", "Email notifications", "7-day data retention"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Professional",
    price: "$299",
    period: "/month",
    description: "For growing operations with active fleets.",
    features: ["Up to 100 satellites", "AI collision prediction", "Priority support", "30-day data retention", "API access"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large constellations and government agencies.",
    features: ["Unlimited satellites", "Autonomous agent system", "Dedicated support team", "Unlimited data retention", "On-premise deployment", "Custom integrations"],
    cta: "Contact Sales",
    highlight: false,
  },
];

function ProductHero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  return (
    <section ref={ref} className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#050811] px-6 pt-28 pb-16">
      <Particles className="absolute inset-0" quantity={140} color="#00e5ff" />

      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[#00e5ff]/5 blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-[#7c3aed]/5 blur-[120px]" />
      </div>

      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="relative z-10 max-w-4xl mx-auto text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-[#00e5ff]/20 bg-[#00e5ff]/10 px-5 py-2 text-xs uppercase tracking-[0.22em] text-[#00e5ff] mb-8">
          <span className="h-2 w-2 rounded-full bg-[#00e5ff] animate-pulse" />
          Kepler Platform
        </div>

        <h1 className="font-display-lg text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] text-white mb-6">
          Orbital Intelligence
          <br />
          <span className="bg-gradient-to-r from-[#00e5ff] via-[#5EE7FF] to-[#a855f7] bg-clip-text text-transparent">
            for the Autonomous Age
          </span>
        </h1>

        <p className="font-body-ui text-lg text-[#8892A6] max-w-2xl mx-auto mb-10 leading-relaxed">
          From real-time tracking to autonomous collision avoidance — Kepler delivers
          the complete stack for modern space traffic management.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/dashboard">
            <ShimmerButton
              shimmerColor="#00e5ff"
              background="rgba(0,229,255,0.15)"
              className="rounded-full px-8 py-3 text-base font-semibold border border-[#00e5ff]/30"
            >
              Launch Dashboard
            </ShimmerButton>
          </Link>
          <Link
            to="/signup"
            className="rounded-full border border-white/15 bg-white/5 px-8 py-3 font-medium text-white backdrop-blur transition-all duration-300 hover:border-[#00e5ff]/40 hover:bg-[#00e5ff]/10"
          >
            Get Started Free
          </Link>
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-10 text-center">
          {[
            { value: "12,400+", label: "Objects Tracked" },
            { value: "99.98%", label: "Conjunction Recall" },
            { value: "<40ms", label: "Decision Latency" },
            { value: "24/7", label: "Operations" },
          ].map((stat) => (
            <div key={stat.label}>
              <h3 className="text-3xl font-bold font-technical-data text-[#00e5ff]">{stat.value}</h3>
              <p className="text-[#8892A6] text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeUp}
    >
      <MagicCard
        mode="orb"
        glowFrom={feature.gradientFrom}
        glowTo={feature.gradientTo}
        glowOpacity={0.6}
        glowSize={350}
        glowBlur={50}
        className="h-full rounded-2xl border border-white/10"
        fillClassName="bg-[#0A0F1A]"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${feature.gradientFrom}20, ${feature.gradientTo}20)`,
                border: `1px solid ${feature.gradientFrom}30`,
              }}
            >
              <MaterialIcon
                name={feature.icon}
                className="text-xl"
                style={{ color: feature.gradientFrom }}
              />
            </div>
            <h3 className="font-display-lg text-lg font-semibold text-white">{feature.title}</h3>
          </div>
          <p className="font-body-ui text-sm text-[#8892A6] leading-relaxed">{feature.description}</p>
        </div>
      </MagicCard>
    </motion.div>
  );
}

function FeaturesSection() {
  return (
    <section className="relative py-24 px-6 section-rule bg-[#050811]">
      <Particles className="absolute inset-0" quantity={80} color="#7c3aed" />

      <div className="relative z-10 max-w-[1180px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} className="font-technical-data text-xs text-[#00e5ff] tracking-[0.22em] mb-4">
            PLATFORM CAPABILITIES
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display-lg text-[clamp(1.8rem,4vw,3rem)] font-bold text-white mb-4">
            Everything you need to
            <br />
            <span className="bg-gradient-to-r from-[#00e5ff] to-[#a855f7] bg-clip-text text-transparent">
              manage the orbit
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} className="font-body-ui text-[#8892A6] max-w-2xl mx-auto">
            A complete suite of tools for satellite operators, from tracking and prediction to autonomous decision-making.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  const reduce = useReducedMotion();

  const layers = [
    {
      title: "Data Ingestion",
      items: ["TLE Feeds", "Radar Data", "Space Weather API", "Operator Telemetry"],
      color: "#00e5ff",
    },
    {
      title: "Orbital Engine",
      items: ["Propagation Models", "Conjunction Screening", "Debris Correlation", "Decay Forecasting"],
      color: "#7c3aed",
    },
    {
      title: "AI Decision Layer",
      items: ["Risk Assessment Agents", "Maneuver Optimization", "Explainability Engine", "Autonomous Execution"],
      color: "#a855f7",
    },
    {
      title: "Operator Interface",
      items: ["3D Earth Twin", "Dashboard & KPIs", "Alert System", "Audit Trail Export"],
      color: "#00e5ff",
    },
  ];

  return (
    <section className="relative py-24 px-6 section-rule bg-[#050811]">
      <div className="max-w-[1180px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} className="font-technical-data text-xs text-[#00e5ff] tracking-[0.22em] mb-4">
            SYSTEM ARCHITECTURE
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display-lg text-[clamp(1.8rem,4vw,3rem)] font-bold text-white mb-4">
            Built for scale, designed for trust
          </motion.h2>
          <motion.p variants={fadeUp} className="font-body-ui text-[#8892A6] max-w-2xl mx-auto">
            From raw sensor data to autonomous decisions — each layer is modular, auditable, and production-hardened.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
            >
              <MagicCard
                gradientColor={layer.color}
                gradientSize={250}
                className="h-full rounded-2xl"
                fillClassName="bg-[#0A0F1A]"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold font-technical-data"
                      style={{ background: `${layer.color}20`, color: layer.color, border: `1px solid ${layer.color}30` }}
                    >
                      {i + 1}
                    </span>
                    <h3 className="font-display-lg text-base font-semibold text-white">{layer.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {layer.items.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm text-[#8892A6]">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ background: layer.color, boxShadow: `0 0 6px ${layer.color}` }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </MagicCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const reduce = useReducedMotion();

  return (
    <section className="relative py-24 px-6 section-rule bg-[#050811]">
      <Particles className="absolute inset-0" quantity={60} color="#00e5ff" />

      <div className="relative z-10 max-w-[1180px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} className="font-technical-data text-xs text-[#00e5ff] tracking-[0.22em] mb-4">
            PRICING
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display-lg text-[clamp(1.8rem,4vw,3rem)] font-bold text-white mb-4">
            Plans for every mission
          </motion.h2>
          <motion.p variants={fadeUp} className="font-body-ui text-[#8892A6] max-w-2xl mx-auto">
            Start free, scale as your constellation grows. No hidden fees.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
            >
              <MagicCard
                mode={plan.highlight ? "orb" : "gradient"}
                glowFrom="#00e5ff"
                glowTo="#a855f7"
                glowOpacity={0.5}
                className={`h-full rounded-2xl ${plan.highlight ? "border-[#00e5ff]/30" : "border-white/10"}`}
                fillClassName={plan.highlight ? "bg-[#0A0F1A]" : "bg-[#0A0F1A]"}
                gradientColor="#00e5ff"
                gradientSize={plan.highlight ? 250 : 200}
              >
                <div className="p-6 sm:p-8">
                  {plan.highlight && (
                    <div className="inline-flex items-center gap-1 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/20 px-3 py-1 text-[10px] font-technical-data text-[#00e5ff] mb-4">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00e5ff] animate-pulse" />
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="font-display-lg text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="font-display-lg text-3xl font-bold text-white">{plan.price}</span>
                    {plan.period && <span className="text-sm text-[#8892A6]">{plan.period}</span>}
                  </div>
                  <p className="font-body-ui text-sm text-[#8892A6] mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8" role="list">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-[#8892A6]">
                        <MaterialIcon name="check" className="text-sm text-[#00e5ff]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={plan.highlight ? "/signup" : plan.name === "Enterprise" ? "/#contact" : "/signup"}
                    className={`block text-center rounded-full px-6 py-3 font-semibold text-sm transition-all duration-300 ${
                      plan.highlight
                        ? "bg-[#00e5ff] text-[#050811] hover:bg-[#00e5ff]/90 shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                        : "border border-white/15 bg-white/5 text-white hover:border-[#00e5ff]/40 hover:bg-[#00e5ff]/10"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </MagicCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const ProductPage: React.FC = () => {
  return (
    <div className="bg-[#050811]">
      <ProductHero />
      <FeaturesSection />
      <ArchitectureSection />
      <PricingSection />
    </div>
  );
};

export default ProductPage;
