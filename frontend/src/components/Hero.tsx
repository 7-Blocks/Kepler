import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { Globe } from "@/components/ui/globe";
import { OrbitSatellites } from "@/components/ui/OrbitSatellites";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Link } from "react-router-dom";

const TELEMETRY = [
  { label: "OBJECTS TRACKED", value: "34,900+" },
  { label: "ACTIVE CONJUNCTIONS", value: "128" },
  { label: "AVG. LEAD TIME", value: "36 HRS" },
  { label: "MODEL CONFIDENCE", value: "97.2%" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function Hero() {
  return (
    <section className="relative flex min-h-screen w-full items-center overflow-hidden bg-[radial-gradient(120%_90%_at_50%_10%,#0B111F_0%,#05070C_60%)] font-[Inter]">
      <Particles className="absolute inset-0" quantity={220} />
      <div
        className="absolute left-1/2 top-[32%] h-[240px] w-[240px] max-w-[85vw] -translate-x-1/2 -translate-y-1/2 opacity-40
                   sm:left-auto sm:right-[3%] sm:top-1/2 sm:h-[380px] sm:w-[380px] sm:translate-x-0 sm:-translate-y-1/2 sm:opacity-70
                   lg:right-[5%] lg:h-[520px] lg:w-[520px] lg:opacity-90"
      >
        <OrbitSatellites />
        <div className="absolute inset-0 flex items-center justify-center">
          <Globe className="h-max-[480px] w-max-[480px]" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#05070C_0%,rgba(5,7,12,0.85)_38%,rgba(5,7,12,0.25)_62%,transparent_85%)] sm:bg-[linear-gradient(90deg,#05070C_0%,rgba(5,7,12,0.85)_38%,rgba(5,7,12,0.25)_62%,transparent_85%)]" />

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-10">
        <div className="max-w-[620px]">
          <motion.div
            initial="hidden"
            animate="show"
            custom={0}
            variants={fadeUp}
            className="mb-5 inline-flex items-center gap-2 font-[JetBrains_Mono] text-xs tracking-[0.2em] text-[#8793AC]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#4CD6F0] shadow-[0_0_8px_#4CD6F0]" />
            ORBITAL INTELLIGENCE PLATFORM
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            custom={0.1}
            variants={fadeUp}
            className="m-0 bg-[linear-gradient(100deg,#EAF1FC_20%,#4CD6F0_55%,#9D7BFF_90%)] bg-clip-text font-[Space_Grotesk] text-[clamp(2.1rem,6vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.02em] text-transparent"
          >
            See every object in orbit before it becomes a problem.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            custom={0.22}
            variants={fadeUp}
            className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-[#A6B0C4] sm:text-[17px]"
          >
            Kepler tracks satellites and debris in real time, predicts
            collision risk with AI, and recommends autonomous avoidance
            maneuvers — built in the open, for anyone managing what's
            actually up there.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            custom={0.34}
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Link to="/dashboard">
              <ShimmerButton shimmerColor="#4CDfF0">
                <span className="inline-flex items-center gap-2">
                  Continue to dashboard
                  <ArrowRight size={15} />
                </span>
              </ShimmerButton>
        </Link>
            <a
              href="https://github.com/7-Blocks/Kepler"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.03] px-5 py-[11px] text-sm font-semibold text-[#C7CEDD] hover:text-white no-underline transition-ui backdrop-blur-md"
            >
              <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.1-3.16.69-3.83-1.34-3.83-1.34-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.73 2.65 1.23 3.3.94.1-.73.4-1.23.72-1.51-2.52-.29-5.17-1.26-5.17-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.16a10.9 10.9 0 0 1 5.72 0c2.18-1.47 3.14-1.16 3.14-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.8 1.17 3.04 0 4.35-2.65 5.31-5.18 5.59.41.35.77 1.04.77 2.1 0 1.52-.01 2.74-.01 3.11 0 .3.2.66.79.55A11.26 11.26 0 0 0 23.25 11.75C23.25 5.48 18.27.5 12 .5Z" />
              </svg>
              View source
            </a>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            custom={0.48}
            variants={fadeUp}
            className="mt-10 grid max-w-[560px] grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-white/10 bg-white/[0.07] backdrop-blur-md sm:mt-12 sm:grid-cols-4"
          >
            {TELEMETRY.map((item) => (
              <div key={item.label} className="bg-[#0B111F]/70 px-4 py-3.5">
                <div className="font-[JetBrains_Mono] text-[15px] font-semibold text-[#EAF1FC] sm:text-[17px]">
                  {item.value}
                </div>
                <div className="mt-1 font-[JetBrains_Mono] text-[9px] tracking-[0.05em] text-[#6B7690] sm:text-[9.5px]">
                  {item.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;