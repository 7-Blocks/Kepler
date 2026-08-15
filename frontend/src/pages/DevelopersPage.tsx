/**
 * DevelopersPage — Kepler Development Network
 *
 * Showcases all real GitHub contributors to the Kepler project.
 * Data lives in src/data/developers.ts; this file only handles presentation.
 */

import React, { useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MagicCard } from '@/components/ui/magic-card';
import { Particles } from '@/components/ui/particles';
import { MaterialIcon } from '@/components/MaterialIcon';
import {
  DEVELOPERS,
  DEVELOPER_STATS,
  type Developer,
  type FilterArea,
} from '@/data/developers';

// ─── Animation Variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

// ─── Filter Config ─────────────────────────────────────────────────────────────

const FILTERS: { key: FilterArea; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'core', label: 'CORE TEAM' },
  { key: 'contributor', label: 'CONTRIBUTORS' },
  { key: 'frontend', label: 'FRONTEND' },
  { key: 'backend', label: 'BACKEND' },
  { key: 'full-stack', label: 'FULL-STACK' },
  { key: 'ai-ml', label: 'AI / ML' },
  { key: 'docs', label: 'DOCS' },
];

// ─── Avatar Helper ─────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getAccentColor(id: string): string {
  const colors = [
    '#00e5ff', '#a855f7', '#7c3aed', '#06b6d4', '#8b5cf6',
    '#22d3ee', '#6366f1', '#3b82f6', '#10b981',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

// ─── DeveloperCard Component ───────────────────────────────────────────────────

interface DeveloperCardProps {
  dev: Developer;
}

function DeveloperCard({ dev }: DeveloperCardProps) {
  const reduce = useReducedMotion();
  const accent = getAccentColor(dev.id);
  const initials = getInitials(dev.name);

  return (
    <motion.div
      variants={fadeUp}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      <MagicCard
        gradientColor={`${accent}40`}
        gradientSize={180}
        className="h-full rounded-xl border border-white/8 group"
        fillClassName="bg-[#080D18]"
      >
        <article
          className="p-5 flex flex-col h-full"
          aria-label={`Developer card for ${dev.name}`}
        >
          {/* ── Header ── */}
          <div className="flex items-start gap-3 mb-4">
            {/* Avatar */}
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold font-mono text-sm transition-all duration-300 group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${accent}18, ${accent}35)`,
                border: `1px solid ${accent}30`,
                color: accent,
              }}
              aria-hidden="true"
            >
              {initials}
            </div>

            {/* Name & username */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white text-sm leading-tight truncate">
                {dev.name}
              </h3>
              <p className="text-[#5A6478] text-xs font-mono mt-0.5">@{dev.username}</p>
              <p className="text-[#8892A6] text-xs mt-0.5 leading-tight">{dev.role}</p>
            </div>

            {/* Tier badge */}
            <span
              className="shrink-0 text-[9px] font-bold font-mono uppercase tracking-[0.14em] px-2 py-0.5 rounded"
              style={{
                background: dev.tier === 'core' ? '#00e5ff15' : '#a855f715',
                color: dev.tier === 'core' ? '#00e5ff' : '#a855f7',
                border: `1px solid ${dev.tier === 'core' ? '#00e5ff25' : '#a855f725'}`,
              }}
            >
              {dev.tier === 'core' ? 'CORE' : 'CONTRIB'}
            </span>
          </div>

          {/* ── Bio ── */}
          <p className="text-[#8892A6] text-xs leading-relaxed mb-4 flex-1">{dev.bio}</p>

          {/* ── Tech tags ── */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {dev.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-white/8 text-[#5A6478] bg-white/4"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* ── Commit stats ── */}
          <div className="flex items-center gap-4 mb-4 py-3 border-t border-b border-white/6">
            <div className="text-center">
              <p
                className="text-base font-bold font-mono leading-none"
                style={{ color: accent }}
              >
                {dev.commits}
              </p>
              <p className="text-[9px] text-[#5A6478] uppercase tracking-wider mt-0.5">COMMITS</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold font-mono text-emerald-400 leading-none">
                +{dev.additions >= 1000 ? `${(dev.additions / 1000).toFixed(1)}k` : dev.additions}
              </p>
              <p className="text-[9px] text-[#5A6478] uppercase tracking-wider mt-0.5">ADDED</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold font-mono text-red-400 leading-none">
                -{dev.deletions >= 1000 ? `${(dev.deletions / 1000).toFixed(1)}k` : dev.deletions}
              </p>
              <p className="text-[9px] text-[#5A6478] uppercase tracking-wider mt-0.5">REMOVED</p>
            </div>
          </div>

          {/* ── Links ── */}
          <div className="flex items-center gap-2">
            <a
              href={dev.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold font-mono transition-all duration-200"
              style={{
                background: `${accent}12`,
                border: `1px solid ${accent}25`,
                color: accent,
              }}
              aria-label={`Visit ${dev.name}'s GitHub profile`}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = `${accent}22`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = `${accent}12`;
              }}
            >
              <MaterialIcon name="open_in_new" className="text-xs" />
              GITHUB
            </a>
            {dev.linkedin && (
              <a
                href={dev.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/8 text-[#5A6478] hover:text-white hover:border-white/20 transition-all duration-200 bg-white/4"
                aria-label={`Visit ${dev.name}'s LinkedIn profile`}
              >
                <MaterialIcon name="work" className="text-sm" />
              </a>
            )}
          </div>
        </article>
      </MagicCard>
    </motion.div>
  );
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { value: String(DEVELOPER_STATS.totalDevelopers), label: 'DEVELOPERS' },
    { value: String(DEVELOPER_STATS.coreTeam), label: 'CORE TEAM' },
    { value: String(DEVELOPER_STATS.contributors), label: 'CONTRIBUTORS' },
    {
      value: `${(DEVELOPER_STATS.totalAdditions / 1000).toFixed(0)}k`,
      label: 'LINES ADDED',
    },
    { value: 'MIT', label: 'LICENSE' },
  ];

  return (
    <div className="border-t border-b border-white/6 py-5 bg-[#060B14]">
      <div className="max-w-[1180px] mx-auto px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold font-mono text-[#00e5ff]">{s.value}</p>
              <p className="text-[9px] font-mono text-[#5A6478] uppercase tracking-[0.18em] mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Hero Section ──────────────────────────────────────────────────────────────

function DevelopersHero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative min-h-[68vh] flex items-center justify-center overflow-hidden bg-[#050811] px-6 pt-28 pb-16">
      <Particles className="absolute inset-0" quantity={90} color="#00e5ff" />

      {/* Ambient glows */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#00e5ff]/4 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#7c3aed]/4 blur-[90px]" />
      </div>

      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="relative z-10 max-w-3xl mx-auto text-center"
      >
        {/* System label */}
        <div className="inline-flex items-center gap-2.5 rounded-sm border border-[#00e5ff]/20 bg-[#00e5ff]/6 px-4 py-1.5 mb-8 font-mono text-[10px] uppercase tracking-[0.22em] text-[#00e5ff]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00e5ff] animate-pulse" aria-hidden="true" />
          KEPLER DEVELOPMENT NETWORK ONLINE
        </div>

        <h1 className="text-[clamp(2.8rem,7vw,5rem)] font-bold leading-[1.04] text-white mb-4">
          DEVELOPERS
        </h1>

        <p className="text-[#8892A6] text-lg leading-relaxed max-w-xl mx-auto mb-10">
          Meet the people building the future of space situational awareness.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="https://github.com/7-Blocks/Kepler"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-sm border border-[#00e5ff]/30 bg-[#00e5ff]/8 px-6 py-2.5 font-mono text-xs uppercase tracking-widest text-[#00e5ff] hover:bg-[#00e5ff]/15 transition-all duration-200"
            aria-label="View Kepler on GitHub"
          >
            <MaterialIcon name="code" className="text-sm" />
            View on GitHub
          </a>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-sm border border-white/12 bg-white/5 px-6 py-2.5 font-mono text-xs uppercase tracking-widest text-white hover:border-white/25 hover:bg-white/8 transition-all duration-200"
          >
            <MaterialIcon name="person_add" className="text-sm" />
            Join the Team
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Catalog Section (cards + search + filter) ─────────────────────────────────

function DeveloperCatalog() {
  const reduce = useReducedMotion();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterArea>('all');
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return DEVELOPERS.filter((d) => {
      const matchesTier =
        activeFilter === 'all' ||
        activeFilter === d.tier ||
        (d.areas as string[]).includes(activeFilter);
      if (!matchesTier) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.username.toLowerCase().includes(q) ||
        d.role.toLowerCase().includes(q) ||
        d.technologies.some((t) => t.toLowerCase().includes(q)) ||
        d.bio.toLowerCase().includes(q)
      );
    });
  }, [search, activeFilter]);

  return (
    <section className="relative py-20 px-6 bg-[#050811]" aria-label="Developer catalog">
      <div className="max-w-[1280px] mx-auto">

        {/* ── Section header ── */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="mb-10"
        >
          <motion.div
            variants={fadeUp}
            className="font-mono text-[10px] text-[#00e5ff] uppercase tracking-[0.22em] mb-3"
          >
            CONTRIBUTOR REGISTRY
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold text-white mb-2">
            All contributors
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[#8892A6] text-sm">
            {DEVELOPER_STATS.totalDevelopers} developers · ordered by contribution volume
          </motion.p>
        </motion.div>

        {/* ── Controls ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <label htmlFor="dev-search" className="sr-only">
              Search developers
            </label>
            <MaterialIcon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6478] text-sm pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="dev-search"
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search developers..."
              className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-sm text-sm text-white placeholder-[#5A6478] font-mono focus:outline-none focus:border-[#00e5ff]/40 focus:bg-[#00e5ff]/5 transition-all duration-200"
              aria-label="Search developers by name, username, role, or technology"
            />
          </div>

          {/* Filter pills */}
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter developers by area"
          >
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setActiveFilter(f.key)}
                aria-pressed={activeFilter === f.key}
                className={`px-3 py-1.5 rounded-sm font-mono text-[9px] uppercase tracking-[0.16em] border transition-all duration-200 ${
                  activeFilter === f.key
                    ? 'bg-[#00e5ff]/12 border-[#00e5ff]/35 text-[#00e5ff]'
                    : 'bg-white/4 border-white/8 text-[#5A6478] hover:text-white hover:border-white/20'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Grid ── */}
        {filtered.length > 0 ? (
          <motion.div
            key={`${activeFilter}-${search}`}
            initial={reduce ? undefined : 'hidden'}
            animate="show"
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filtered.map((dev) => (
              <DeveloperCard key={dev.id} dev={dev} />
            ))}
          </motion.div>
        ) : (
          /* ── Empty state ── */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
            role="status"
            aria-live="polite"
          >
            <div className="h-12 w-12 rounded-xl border border-white/10 bg-white/4 flex items-center justify-center mb-4">
              <MaterialIcon name="signal_disconnected" className="text-[#5A6478] text-xl" />
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#5A6478] mb-1">
              NO DEVELOPER SIGNAL FOUND
            </p>
            <p className="text-[#5A6478] text-sm mb-6">
              No developers match the current search parameters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveFilter('all');
              }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-sm border border-white/12 bg-white/5 font-mono text-xs uppercase tracking-widest text-white hover:border-white/25 transition-all duration-200"
            >
              CLEAR FILTERS
            </button>
          </motion.div>
        )}

        {/* ── Result count ── */}
        {filtered.length > 0 && (
          <p
            className="mt-6 font-mono text-[10px] text-[#5A6478] uppercase tracking-[0.14em]"
            aria-live="polite"
          >
            SHOWING {filtered.length} / {DEVELOPER_STATS.totalDevelopers} CONTRIBUTORS
          </p>
        )}
      </div>
    </section>
  );
}

// ─── Contribute CTA ────────────────────────────────────────────────────────────

function ContributeCTA() {
  const steps = [
    { num: '01', title: 'Fork the Repo', desc: 'Clone the repository and set up your local development environment.' },
    { num: '02', title: 'Pick an Issue', desc: 'Browse open issues and find one that matches your skills and interests.' },
    { num: '03', title: 'Submit a PR', desc: 'Make your changes and submit a pull request for review.' },
    { num: '04', title: 'Join the Network', desc: 'Get feedback, collaborate, and appear on this page as a contributor.' },
  ];

  return (
    <section className="relative py-20 px-6 border-t border-white/6 bg-[#050811]" aria-label="How to contribute">
      <Particles className="absolute inset-0" quantity={50} color="#7c3aed" />

      <div className="relative z-10 max-w-[1180px] mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-14"
        >
          <motion.div variants={fadeUp} className="font-mono text-[10px] text-[#7c3aed] uppercase tracking-[0.22em] mb-3">
            OPEN SOURCE PROTOCOL
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold text-white mb-2">
            Contribute to Kepler
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[#8892A6] text-sm max-w-xl mx-auto">
            Kepler is open source and welcomes contributions from developers, engineers and space enthusiasts worldwide.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {steps.map((step) => (
            <motion.div
              key={step.num}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
            >
              <MagicCard
                gradientColor="#7c3aed40"
                gradientSize={160}
                className="h-full rounded-xl border border-white/8"
                fillClassName="bg-[#080D18]"
              >
                <div className="p-5">
                  <p className="font-mono text-2xl font-bold text-[#7c3aed]/40 mb-3">{step.num}</p>
                  <h3 className="font-semibold text-white text-sm mb-2">{step.title}</h3>
                  <p className="text-[#8892A6] text-xs leading-relaxed">{step.desc}</p>
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
            className="inline-flex items-center gap-2 rounded-sm border border-[#7c3aed]/30 bg-[#7c3aed]/8 px-8 py-3 font-mono text-xs uppercase tracking-widest text-[#a855f7] hover:bg-[#7c3aed]/15 transition-all duration-200"
            aria-label="Start contributing to Kepler on GitHub"
          >
            <MaterialIcon name="rocket_launch" className="text-sm" />
            START CONTRIBUTING
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Page Root ─────────────────────────────────────────────────────────────────

export const DevelopersPage: React.FC = () => {
  return (
    <div className="bg-[#050811] min-h-screen">
      <DevelopersHero />
      <StatsBar />
      <DeveloperCatalog />
      <ContributeCTA />
    </div>
  );
};

export default DevelopersPage;
