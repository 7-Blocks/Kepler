import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Code2,
  Rocket,
  Shield,
  Settings,
  Database,
  FileText,
  ChevronRight,
  ExternalLink,
  Search,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { MagicCard } from "@/components/ui/magic-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

/* ------------------------------------------------------------------ */
/*  Doc Categories                                                     */
/* ------------------------------------------------------------------ */

interface DocCategory {
  icon: LucideIcon;
  title: string;
  description: string;
  gradientFrom: string;
  articles: { title: string; description: string }[];
}

const categories: DocCategory[] = [
  {
    icon: Rocket,
    title: "Getting Started",
    description: "Quick start guides to get your Kepler integration running in minutes.",
    gradientFrom: "#4FE0C8",
    articles: [
      { title: "Quick Start Guide", description: "Set up your Kepler account and connect your first satellite in under 10 minutes." },
      { title: "Platform Overview", description: "A high-level tour of the Kepler dashboard and its core capabilities." },
      { title: "Authentication", description: "API keys, OAuth 2.0, and service account configuration." },
      { title: "Your First Conjunction", description: "Walk through screening, assessing, and responding to a conjunction event." },
    ],
  },
  {
    icon: Code2,
    title: "API Reference",
    description: "Complete REST and WebSocket API documentation with code examples.",
    gradientFrom: "#8B5CF6",
    articles: [
      { title: "REST API Reference", description: "Full endpoint documentation with request/response schemas." },
      { title: "WebSocket Streams", description: "Real-time telemetry, conjunction alerts, and status feeds." },
      { title: "SDKs & Libraries", description: "Official client libraries for Python, TypeScript, Go, and Rust." },
      { title: "Rate Limits & Quotas", description: "Understanding API limits, throttling, and enterprise allowances." },
    ],
  },
  {
    icon: Shield,
    title: "Collision Avoidance",
    description: "Deep dives into Kepler's AI-driven conjunction assessment and manoeuvre planning.",
    gradientFrom: "#FFB454",
    articles: [
      { title: "Conjunction Assessment", description: "How Kepler screens for conjunctions and scores risk levels." },
      { title: "Manoeuvre Planning", description: "Autonomous and manual manoeuvre generation with constraint solving." },
      { title: "Probability of Collision", description: "Understanding Pc calculations, monte carlo methods, and thresholds." },
      { title: "Multi-Object Conjunctions", description: "Handling simultaneous conjunction events across your constellation." },
    ],
  },
  {
    icon: Settings,
    title: "Configuration",
    description: "Customise Kepler to match your operational requirements and workflows.",
    gradientFrom: "#5EE7FF",
    articles: [
      { title: "Organisation Settings", description: "Manage teams, permissions, and notification preferences." },
      { title: "Alert Configuration", description: "Set up custom conjunction thresholds and escalation rules." },
      { title: "Integrations", description: "Connect Kepler with your existing flight software and ground systems." },
      { title: "Webhook Events", description: "Subscribe to real-time event notifications for downstream processing." },
    ],
  },
  {
    icon: Database,
    title: "Data & Telemetry",
    description: "Understanding Kepler's data pipeline, storage, and export capabilities.",
    gradientFrom: "#34D399",
    articles: [
      { title: "TLE Management", description: "Ingest, validate, and propagate TLE data within Kepler." },
      { title: "Telemetry Pipeline", description: "How satellite telemetry flows through the Kepler platform." },
      { title: "Data Export", description: "CSV, JSON, and streaming exports for custom analysis." },
      { title: "Historical Data", description: "Access and query historical conjunction and manoeuvre records." },
    ],
  },
  {
    icon: FileText,
    title: "Guides & Tutorials",
    description: "Step-by-step tutorials for common workflows and advanced use cases.",
    gradientFrom: "#FB7185",
    articles: [
      { title: "Constellation Management", description: "Managing large fleets with automated screening and response." },
      { title: "Compliance Reporting", description: "Generating regulatory compliance reports for FCC, ESA, and IADC." },
      { title: "End-of-Life Disposal", description: "Planning and executing compliant disposal manoeuvres." },
      { title: "Advanced Analytics", description: "Building custom dashboards and analytics with the Kepler API." },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Quick Links                                                        */
/* ------------------------------------------------------------------ */

const quickLinks = [
  { icon: Code2, label: "API Reference", href: "#api" },
  { icon: Rocket, label: "Quick Start", href: "#getting-started" },
  { icon: BookOpen, label: "Guides", href: "#guides" },
  { icon: Shield, label: "Collision Avoidance", href: "#collision-avoidance" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      articles: cat.articles.filter(
        (a) =>
          !searchQuery ||
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((cat) => cat.articles.length > 0);

  return (
    <div className="relative min-h-screen bg-[#0C1220] text-[#E7EBF3] selection:bg-[#4FE0C8]/30">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pt-36 pb-20 sm:pt-44 sm:pb-24">
        <Particles className="absolute inset-0" color="#4FE0C8" quantity={100} refresh={false} />
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/6 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">
              <BookOpen size={12} />
              Documentation
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-8 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl"
          >
            Kepler{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-[#5EE7FF] to-[#8B5CF6] bg-clip-text text-transparent">
              Documentation
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-4 max-w-xl text-[#8892A6]"
          >
            Everything you need to build, integrate, and scale with Kepler's orbital intelligence platform.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-10 max-w-lg"
          >
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7690]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation..."
                aria-label="Search documentation"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-12 pr-4 text-sm text-white placeholder-[#6B7690] outline-none backdrop-blur-xl transition-all duration-300 focus:border-cyan-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-cyan-400/10"
              />
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-3"
          >
            {quickLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-[#A6B0C4] backdrop-blur transition-all duration-300 hover:border-cyan-400/30 hover:bg-cyan-400/[0.05] hover:text-white"
              >
                <link.icon size={14} />
                {link.label}
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Categories Grid ─── */}
      <section className="relative pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl px-6">
          <AnimatePresence mode="wait">
            {filteredCategories.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-20 text-center"
              >
                <p className="text-lg text-[#6B7690]">No results found for "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Clear search
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredCategories.map((cat, ci) => (
                  <motion.div
                    key={cat.title}
                    custom={ci}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-30px" }}
                    variants={fadeUp}
                    id={cat.title.toLowerCase().replace(/\s+/g, "-").replace("&", "")}
                  >
                    <MagicCard
                      gradientColor={`${cat.gradientFrom}50`}
                      className="group h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl"
                      fillClassName="bg-[#0C1220]/80"
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"
                          style={{ boxShadow: `0 0 20px ${cat.gradientFrom}12` }}
                        >
                          <cat.icon size={18} style={{ color: cat.gradientFrom }} />
                        </div>
                        <h3 className="font-semibold text-white">{cat.title}</h3>
                      </div>

                      <p className="mb-5 text-sm text-[#8892A6]">{cat.description}</p>

                      <div className="space-y-3">
                        {cat.articles.map((article) => (
                          <div
                            key={article.title}
                            className="group/link flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.04]"
                          >
                            <ChevronRight size={14} className="shrink-0 text-[#6B7690] transition-transform group-hover/link:translate-x-0.5 group-hover/link:text-cyan-400" />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-[#C8D0E0] group-hover/link:text-white transition-colors">
                                {article.title}
                              </div>
                              <div className="mt-0.5 truncate text-xs text-[#6B7690]">
                                {article.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </MagicCard>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ─── Developer Resources ─── */}
      <section className="relative overflow-hidden border-t border-white/5 bg-[#080D18]/60 py-24 sm:py-32">
        <div className="absolute inset-0">
          <div className="absolute left-1/3 top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-purple-500/5 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Developer Resources</h2>
            <p className="mx-auto mt-4 max-w-xl text-[#8892A6]">
              Tools and references to integrate Kepler into your workflows.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Code2,
                title: "API Reference",
                description: "Complete REST and WebSocket API documentation.",
                gradientFrom: "#4FE0C8",
              },
              {
                icon: Database,
                title: "SDKs",
                description: "Official client libraries for Python, TypeScript, Go, and Rust.",
                gradientFrom: "#8B5CF6",
              },
              {
                icon: Shield,
                title: "Security",
                description: "Authentication, encryption, and compliance documentation.",
                gradientFrom: "#FFB454",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className="group flex h-full flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/20 hover:bg-cyan-400/[0.03]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <item.icon size={20} style={{ color: item.gradientFrom }} />
                  </div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-[#8892A6]">{item.description}</p>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 transition-colors group-hover:text-cyan-300">
                      Explore <ExternalLink size={13} />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden border-t border-white/5 py-24 sm:py-32">
        <Particles className="absolute inset-0" color="#8B5CF6" quantity={50} refresh={false} />
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Can't find what you're looking for?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[#8892A6]">
              Our team is here to help. Reach out and we'll get you sorted.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/dashboard">
                <ShimmerButton className="rounded-full px-8 py-3 text-sm font-semibold">
                  Open Dashboard
                  <ArrowRight size={16} className="ml-2 inline" />
                </ShimmerButton>
              </Link>
              <a
                href="mailto:contact@kepler.ai"
                className="rounded-full border border-white/15 bg-white/5 px-8 py-3 text-sm font-medium text-white backdrop-blur transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-400/10"
              >
                Contact Support
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default DocsPage;
