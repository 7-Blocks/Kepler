"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { MonitorSmartphone, ServerCog, BrainCircuit, RadioTower, Database, Boxes } from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { MagicCard } from "@/components/ui/magic-card";
import { TechLogo } from "@/components/ui/TechLogo";

type Category = "Frontend" | "Backend" | "AI" | "Space APIs" | "Database" | "Infrastructure";

interface TechItem {
  name: string;
  description: string;
  slug?: string;
  colorHex: string;
}

interface CategoryMeta {
  Icon: LucideIcon;
  glowHex: string;
  accentClass: string;
  items: TechItem[];
}

const CATEGORIES: Record<Category, CategoryMeta> = {
  Frontend: {
    Icon: MonitorSmartphone,
    glowHex: "#4CD6F0",
    accentClass: "border-[#4CD6F0]/30 bg-[#4CD6F0]/10 text-[#4CD6F0]",
    items: [
      { name: "React", slug: "react", colorHex: "4CD6F0", description: "Component-based UI for the dashboard and hero." },
      { name: "TypeScript", slug: "typescript", colorHex: "4CD6F0", description: "Type safety across the whole frontend." },
      { name: "Tailwind CSS", slug: "tailwindcss", colorHex: "4CD6F0", description: "Utility-first styling, no custom CSS files." },
      { name: "Framer Motion", slug: "framer", colorHex: "4CD6F0", description: "Page-load and interaction animation." },
    ],
  },
  Backend: {
    Icon: ServerCog,
    glowHex: "#9D7BFF",
    accentClass: "border-[#9D7BFF]/30 bg-[#9D7BFF]/10 text-[#9D7BFF]",
    items: [
      { name: "FastAPI", slug: "fastapi", colorHex: "9D7BFF", description: "Python API layer for orbital computations." },
      { name: "Node.js", slug: "nodedotjs", colorHex: "9D7BFF", description: "Realtime services and the WebSocket layer." },
      { name: "Express", slug: "express", colorHex: "9D7BFF", description: "REST routing for the Node services." },
      { name: "Python", slug: "python", colorHex: "9D7BFF", description: "Core language for the prediction pipeline." },
    ],
  },
  AI: {
    Icon: BrainCircuit,
    glowHex: "#FFB454",
    accentClass: "border-[#FFB454]/30 bg-[#FFB454]/10 text-[#FFB454]",
    items: [
      { name: "PyTorch", slug: "pytorch", colorHex: "FFB454", description: "Collision-risk prediction models." },
      { name: "scikit-learn", slug: "scikitlearn", colorHex: "FFB454", description: "Baseline models and feature pipelines." },
      { name: "NumPy", slug: "numpy", colorHex: "FFB454", description: "Numerical core for orbital math." },
      { name: "Pandas", slug: "pandas", colorHex: "FFB454", description: "Telemetry data wrangling." },
    ],
  },
  "Space APIs": {
    Icon: RadioTower,
    glowHex: "#5B8DEF",
    accentClass: "border-[#5B8DEF]/30 bg-[#5B8DEF]/10 text-[#5B8DEF]",
    items: [
      { name: "NASA Open APIs", slug: "nasa", colorHex: "5B8DEF", description: "Public spaceflight and imagery data." },
      { name: "Celestrak", colorHex: "5B8DEF", description: "TLE orbital element sets." },
      { name: "Space-Track.org", colorHex: "5B8DEF", description: "Authoritative satellite catalog data." },
    ],
  },
  Database: {
    Icon: Database,
    glowHex: "#34D399",
    accentClass: "border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399]",
    items: [
      { name: "MongoDB", slug: "mongodb", colorHex: "34D399", description: "Document store for satellite records." },
      { name: "PostgreSQL", slug: "postgresql", colorHex: "34D399", description: "Relational store for structured telemetry." },
      { name: "Redis", slug: "redis", colorHex: "34D399", description: "Caching and realtime pub/sub." },
    ],
  },
  Infrastructure: {
    Icon: Boxes,
    glowHex: "#FB7185",
    accentClass: "border-[#FB7185]/30 bg-[#FB7185]/10 text-[#FB7185]",
    items: [
      { name: "Docker", slug: "docker", colorHex: "FB7185", description: "Containerized services across environments." },
      { name: "AWS", slug: "amazonaws", colorHex: "FB7185", description: "Compute and storage backbone." },
      { name: "Nginx", slug: "nginx", colorHex: "FB7185", description: "Reverse proxy and load balancing." },
      { name: "GitHub Actions", slug: "githubactions", colorHex: "FB7185", description: "CI/CD for every merged PR." },
    ],
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function Technologies() {
  return (
    <section className="relative w-full overflow-hidden bg-[radial-gradient(120%_60%_at_50%_0%,#0B111F_0%,#05070C_55%)] py-20 font-[Inter] sm:py-28">
      <Particles className="absolute inset-0" quantity={120} />

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-6 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="mx-auto max-w-[640px] text-center">
          <div className="mb-5 inline-flex items-center gap-2 font-[JetBrains_Mono] text-xs tracking-[0.2em] text-[#8793AC]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4CD6F0] shadow-[0_0_8px_#4CD6F0]" />
            THE STACK
          </div>
          <h1 className="m-0 bg-[linear-gradient(100deg,#EAF1FC_20%,#4CD6F0_55%,#9D7BFF_90%)] bg-clip-text font-[Space_Grotesk] text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em] text-transparent">
            What powers Kepler.
          </h1>
          <p className="mx-auto mt-4 max-w-[480px] text-[15px] leading-relaxed text-[#A6B0C4] sm:text-[16px]">
            Every layer, from the models predicting collision risk to the
            proxy routing traffic — real tools, not a marketing list.
          </p>
        </div>

        {/* Category sections */}
        <div className="mt-16 flex flex-col gap-16 sm:mt-20 sm:gap-20">
          {(Object.entries(CATEGORIES) as [Category, CategoryMeta][]).map(([category, meta]) => (
            <div key={category}>
              <div className="mb-6 flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${meta.accentClass}`}>
                  <meta.Icon size={17} />
                </span>
                <h2 className="m-0 font-[Space_Grotesk] text-lg font-semibold text-[#EAF1FC] sm:text-xl">
                  {category}
                </h2>
                <span className="font-[JetBrains_Mono] text-xs text-[#6B7690]">
                  {String(meta.items.length).padStart(2, "0")}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {meta.items.map((item) => (
                  <motion.div
                    key={item.name}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-40px" }}
                    variants={fadeUp}
                  >
                    <MagicCard gradientColor={meta.glowHex} className="h-full p-5 rounded-lg">
                      <div className="flex items-start gap-3">
                        <TechLogo name={item.name} slug={item.slug} colorHex={item.colorHex} accentClass={meta.accentClass} />
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-semibold text-[#EAF1FC]">{item.name}</div>
                        </div>
                      </div>
                      <p className="mt-3 text-[12.5px] leading-relaxed text-[#8793AC]">{item.description}</p>
                    </MagicCard>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Technologies