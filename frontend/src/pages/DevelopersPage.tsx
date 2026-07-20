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

const contributors = [
  {
    name: "Alex Chen",
    role: "Lead AI Engineer",
    avatar: "AC",
    color: "#00e5ff",
    contributions: ["Collision prediction models", "Autonomous agent system", "Orbital propagation engine"],
    github: "https://github.com/alexchen",
  },
  {
    name: "Maria Santos",
    role: "Full-Stack Developer",
    avatar: "MS",
    color: "#7c3aed",
    contributions: ["Dashboard UI & frontend", "Real-time data pipelines", "WebSocket integration"],
    github: "https://github.com/mariasantos",
  },
  {
    name: "James Okafor",
    role: "Space Systems Engineer",
    avatar: "JO",
    color: "#a855f7",
    contributions: ["Space weather integration", "TLE data ingestion", "Conjunction screening algorithms"],
    github: "https://github.com/jamesokafor",
  },
  {
    name: "Priya Patel",
    role: "DevOps & Infrastructure",
    avatar: "PP",
    color: "#00e5ff",
    contributions: ["CI/CD pipelines", "Docker & cloud deployment", "Monitoring & observability"],
    github: "https://github.com/priyapatel",
  },
  {
    name: "Yuki Tanaka",
    role: "Data Scientist",
    avatar: "YT",
    color: "#7c3aed",
    contributions: ["Risk scoring models", "Anomaly detection", "Data visualization & analytics"],
    github: "https://github.com/yukitanaka",
  },
  {
    name: "Sarah Williams",
    role: "Frontend Engineer",
    avatar: "SW",
    color: "#a855f7",
    contributions: ["Component library & design system", "Animation & interaction design", "Accessibility audit"],
    github: "https://github.com/sarahwilliams",
  },
];

const sdks = [
  {
    name: "Kepler API",
    description: "RESTful API for satellite tracking, collision data, and orbital analytics.",
    icon: "api",
    color: "#00e5ff",
    endpoint: "/api/v1",
  },
  {
    name: "Python SDK",
    description: "Native Python library for integrating Kepler data into your ML pipelines and scripts.",
    icon: "code",
    color: "#7c3aed",
    endpoint: "pip install kepler-sdk",
  },
  {
    name: "WebSocket Stream",
    description: "Real-time event stream for live conjunctions, alerts, and telemetry updates.",
    icon: "stream",
    color: "#a855f7",
    endpoint: "wss://api.kepler.space/events",
  },
  {
    name: "CLI Tool",
    description: "Command-line interface for querying the catalog, triggering evaluations, and managing agents.",
    icon: "terminal",
    color: "#00e5ff",
    endpoint: "npm install -g @kepler/cli",
  },
];

const apiEndpoints = [
  { method: "GET", path: "/api/v1/dashboard/summary", description: "Dashboard KPI summary" },
  { method: "GET", path: "/api/v1/catalog/objects", description: "List catalog objects" },
  { method: "GET", path: "/api/v1/collisions", description: "Collision events" },
  { method: "POST", path: "/api/v1/agents/trigger/:id", description: "Trigger agent workflow" },
  { method: "GET", path: "/api/v1/weather/status", description: "Space weather status" },
  { method: "PATCH", path: "/api/v1/collisions/:id/status", description: "Update collision status" },
];

function DevelopersHero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  return (
    <section ref={ref} className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-[#050811] px-6 pt-28 pb-16">
      <Particles className="absolute inset-0" quantity={120} color="#7c3aed" />

      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[#7c3aed]/5 blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#00e5ff]/5 blur-[100px]" />
      </div>

      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="relative z-10 max-w-4xl mx-auto text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-[#7c3aed]/20 bg-[#7c3aed]/10 px-5 py-2 text-xs uppercase tracking-[0.22em] text-[#a855f7] mb-8">
          <span className="h-2 w-2 rounded-full bg-[#a855f7] animate-pulse" />
          Developers & Contributors
        </div>

        <h1 className="font-display-lg text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] text-white mb-6">
          Build with
          <br />
          <span className="bg-gradient-to-r from-[#00e5ff] via-[#7c3aed] to-[#a855f7] bg-clip-text text-transparent">
            Kepler
          </span>
        </h1>

        <p className="font-body-ui text-lg text-[#8892A6] max-w-2xl mx-auto mb-10 leading-relaxed">
          APIs, SDKs, and tools for integrating Kepler's orbital intelligence into your applications.
          Join our community of developers and contributors shaping the future of space traffic management.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/signup">
            <ShimmerButton
              shimmerColor="#7c3aed"
              background="rgba(124,58,237,0.15)"
              className="rounded-full px-8 py-3 text-base font-semibold border border-[#7c3aed]/30"
            >
              Get API Access
            </ShimmerButton>
          </Link>
          <a
            href="https://github.com/7-Blocks/Kepler"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 bg-white/5 px-8 py-3 font-medium text-white backdrop-blur transition-all duration-300 hover:border-[#a855f7]/40 hover:bg-[#a855f7]/10 inline-flex items-center gap-2"
          >
            <MaterialIcon name="code" className="text-sm" />
            View on GitHub
          </a>
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-10 text-center">
          {[
            { value: "6+", label: "Core Contributors" },
            { value: "24+", label: "API Endpoints" },
            { value: "4", label: "SDKs & Tools" },
            { value: "Open Source", label: "MIT License" },
          ].map((stat) => (
            <div key={stat.label}>
              <h3 className="text-3xl font-bold font-technical-data text-[#a855f7]">{stat.value}</h3>
              <p className="text-[#8892A6] text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function ApiSection() {
  const reduce = useReducedMotion();

  return (
    <section className="relative py-24 px-6 section-rule bg-[#050811]">
      <Particles className="absolute inset-0" quantity={80} color="#00e5ff" />

      <div className="relative z-10 max-w-[1180px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} className="font-technical-data text-xs text-[#00e5ff] tracking-[0.22em] mb-4">
            API REFERENCE
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display-lg text-[clamp(1.8rem,4vw,3rem)] font-bold text-white mb-4">
            Simple, powerful APIs
          </motion.h2>
          <motion.p variants={fadeUp} className="font-body-ui text-[#8892A6] max-w-2xl mx-auto">
            Every endpoint returns structured JSON with consistent error handling. Your API key unlocks the full platform.
          </motion.p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <MagicCard gradientColor="#00e5ff" className="rounded-2xl" fillClassName="bg-[#0A0F1A]">
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <MaterialIcon name="terminal" className="text-[#00e5ff] text-lg" />
                <span className="font-technical-data text-sm text-[#00e5ff]">Base URL: https://api.kepler.space</span>
              </div>
              <div className="space-y-3">
                {apiEndpoints.map((ep) => (
                  <div
                    key={ep.path}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 border-t border-white/5"
                  >
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-1 rounded text-[10px] font-bold font-technical-data uppercase tracking-wider w-16 shrink-0 ${
                        ep.method === "GET"
                          ? "bg-[#00e5ff]/10 text-[#00e5ff]"
                          : ep.method === "POST"
                          ? "bg-[#7c3aed]/10 text-[#a855f7]"
                          : "bg-[#a855f7]/10 text-[#a855f7]"
                      }`}
                    >
                      {ep.method}
                    </span>
                    <code className="font-technical-data text-sm text-white/80 flex-1">{ep.path}</code>
                    <span className="font-body-ui text-xs text-[#8892A6] sm:text-right">{ep.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </MagicCard>
        </div>
      </div>
    </section>
  );
}

function SdksSection() {
  const reduce = useReducedMotion();

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
          <motion.div variants={fadeUp} className="font-technical-data text-xs text-[#7c3aed] tracking-[0.22em] mb-4">
            SDKs & TOOLS
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display-lg text-[clamp(1.8rem,4vw,3rem)] font-bold text-white mb-4">
            Integrate in minutes
          </motion.h2>
          <motion.p variants={fadeUp} className="font-body-ui text-[#8892A6] max-w-2xl mx-auto">
            Language-native libraries and tools for every workflow.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {sdks.map((sdk) => (
            <motion.div
              key={sdk.name}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
            >
              <MagicCard
                mode="orb"
                glowFrom={sdk.color}
                glowTo={sdk.color}
                glowOpacity={0.4}
                glowSize={300}
                glowBlur={40}
                className="h-full rounded-2xl border border-white/10"
                fillClassName="bg-[#0A0F1A]"
              >
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{
                        background: `${sdk.color}15`,
                        border: `1px solid ${sdk.color}25`,
                      }}
                    >
                      <MaterialIcon name={sdk.icon} className="text-xl" style={{ color: sdk.color }} />
                    </div>
                    <div>
                      <h3 className="font-display-lg text-lg font-semibold text-white">{sdk.name}</h3>
                      <code className="font-technical-data text-xs text-[#8892A6]">{sdk.endpoint}</code>
                    </div>
                  </div>
                  <p className="font-body-ui text-sm text-[#8892A6] leading-relaxed">{sdk.description}</p>
                </div>
              </MagicCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContributorsSection() {
  const reduce = useReducedMotion();

  return (
    <section className="relative py-24 px-6 section-rule bg-[#050811]">
      <Particles className="absolute inset-0" quantity={100} color="#a855f7" />

      <div className="relative z-10 max-w-[1180px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} className="font-technical-data text-xs text-[#a855f7] tracking-[0.22em] mb-4">
            TEAM
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display-lg text-[clamp(1.8rem,4vw,3rem)] font-bold text-white mb-4">
            Meet the contributors
          </motion.h2>
          <motion.p variants={fadeUp} className="font-body-ui text-[#8892A6] max-w-2xl mx-auto">
            The people building Kepler — open source contributors committed to safer skies.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {contributors.map((person) => (
            <motion.div
              key={person.name}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
            >
              <MagicCard
                gradientColor={person.color}
                gradientSize={200}
                className="h-full rounded-2xl border border-white/10"
                fillClassName="bg-[#0A0F1A]"
              >
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-4 mb-5">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl font-bold text-lg font-technical-data"
                      style={{
                        background: `linear-gradient(135deg, ${person.color}20, ${person.color}40)`,
                        border: `1px solid ${person.color}30`,
                        color: person.color,
                      }}
                    >
                      {person.avatar}
                    </div>
                    <div>
                      <h3 className="font-display-lg text-base font-semibold text-white">{person.name}</h3>
                      <p className="font-body-ui text-sm text-[#8892A6]">{person.role}</p>
                    </div>
                  </div>
                  <ul className="space-y-2" role="list">
                    {person.contributions.map((c) => (
                      <li key={c} className="flex items-center gap-2 text-sm text-[#8892A6]">
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: person.color }} />
                        {c}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={person.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium transition-colors"
                    style={{ color: person.color }}
                  >
                    <MaterialIcon name="open_in_new" className="text-sm" />
                    GitHub Profile
                  </a>
                </div>
              </MagicCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContributeSection() {
  const reduce = useReducedMotion();

  const steps = [
    { icon: "fork_right", title: "Fork the Repo", description: "Clone the repository and set up your local development environment." },
    { icon: "code", title: "Pick an Issue", description: "Browse open issues and find one that matches your skills and interests." },
    { icon: "merge_type", title: "Submit a PR", description: "Make your changes and submit a pull request for review." },
    { icon: "groups", title: "Join the Community", description: "Get feedback, collaborate, and grow with the Kepler community." },
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
            CONTRIBUTE
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display-lg text-[clamp(1.8rem,4vw,3rem)] font-bold text-white mb-4">
            Help us build the future
          </motion.h2>
          <motion.p variants={fadeUp} className="font-body-ui text-[#8892A6] max-w-2xl mx-auto">
            Kepler is open source and welcomes contributions from developers, engineers, and space enthusiasts.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto mb-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
            >
              <MagicCard
                mode="orb"
                glowFrom="#00e5ff"
                glowTo="#a855f7"
                glowOpacity={0.3}
                glowSize={280}
                glowBlur={40}
                className="h-full rounded-2xl border border-white/10"
                fillClassName="bg-[#0A0F1A]"
              >
                <div className="p-6 text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 mb-4">
                    <span className="font-technical-data text-lg font-bold text-[#00e5ff]">{i + 1}</span>
                  </div>
                  <h3 className="font-display-lg text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="font-body-ui text-sm text-[#8892A6]">{step.description}</p>
                </div>
              </MagicCard>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center"
        >
          <a
            href="https://github.com/7-Blocks/Kepler"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-3 font-medium text-white backdrop-blur transition-all duration-300 hover:border-[#00e5ff]/40 hover:bg-[#00e5ff]/10"
          >
            <MaterialIcon name="code" className="text-sm" />
            Start Contributing
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export const DevelopersPage: React.FC = () => {
  return (
    <div className="bg-[#050811]">
      <DevelopersHero />
      <ApiSection />
      <SdksSection />
      <ContributorsSection />
      <ContributeSection />
    </div>
  );
};

export default DevelopersPage;
