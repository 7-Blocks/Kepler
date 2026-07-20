import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Particles } from '@/components/ui/particles';
import { MagicCard } from '@/components/ui/magic-card';
import { OrbitSatellites } from '../ui/OrbitSatellites';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/**
 * Shared visual scaffold for the auth pages: a dark, space-inspired backdrop
 * (star field + orbital rings + radial glows) wrapping a Magic UI glass card.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const reduce = useReducedMotion();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050811] px-4 py-10 text-[#F8FAFC] sm:px-6 selection:bg-[#5EE7FF]/30">
      {/* Base gradient wash */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-30"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(79,125,255,0.16), transparent 60%),' +
            'radial-gradient(ellipse 70% 50% at 85% 110%, rgba(139,92,246,0.14), transparent 55%),' +
            'linear-gradient(180deg, #050811 0%, #0A0F1A 100%)',
        }}
      />

      {/* Star field (Magic UI) */}
      <Particles
        className="absolute inset-0"
        quantity={90}
        ease={70}
        color="#8FB4FF"
        refresh={false}
      />

      <OrbitSatellites />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <MagicCard
          gradientFrom="#5EE7FF"
          gradientTo="#4F7DFF"
          gradientColor="rgba(94, 231, 255, 0.14)"
          gradientOpacity={0.55}
          gradientSize={280}
          fillClassName="bg-[rgba(255,255,255,0.04)] backdrop-blur-xl"
          className="rounded-[24px] border-white/8 p-7 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)] sm:p-9 [--color-background:#0A0F1A] [--color-border:rgba(255,255,255,0.08)]"
        >
          <div className="mb-7 flex flex-col items-center text-center">
            <Link
              to="/"
              aria-label="Kepler home"
              className="mb-6 inline-flex items-center gap-2.5 no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5EE7FF]/50 rounded-xl"
            >
              <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#5EE7FF]/20 to-[#4F7DFF]/20 ring-1 ring-white/10">
                <img
                  src="/Logo.svg"
                  alt=""
                  width={22}
                  height={22}
                  className="h-[22px] w-[22px] object-contain"
                />
              </span>
              <span className="font-necosmic text-[18px] tracking-wide text-[#F8FAFC]">
                Kepler
              </span>
            </Link>

            <h1 className="font-display-lg text-[28px] font-bold leading-tight tracking-tight text-[#F8FAFC] sm:text-[30px]">
              {title}
            </h1>
            <p className="mt-2 max-w-[320px] font-body-ui text-[14.5px] leading-relaxed text-[#94A3B8]">
              {subtitle}
            </p>
          </div>

          {children}
        </MagicCard>

        <div className="mt-6 text-center font-body-ui text-[14px] text-[#94A3B8]">
          {footer}
        </div>
      </motion.div>
    </main>
  );
}
