import Hero from "@/components/Hero";
import React from "react";


/* How it works */

function HowItWorks() {
  const steps = [
    {
      title: "Ingest",
      body: "Kepler pulls tracking data from public and partner catalogs, normalizing ephemerides in real time.",
    },
    {
      title: "Predict",
      body: "A conjunction model flags close approaches days out, ranked by probability and consequence.",
    },
    {
      title: "Resolve",
      body: "Autonomous maneuver planning proposes — or executes — the smallest safe correction.",
    },
    {
      title: "Record",
      body: "Every decision is logged with the telemetry and reasoning behind it, for operators and regulators alike.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-24 px-6 section-rule bg-[#0C1220]"
    >
      <div className="max-w-[1180px] mx-auto">
        <h2 className="font-display-lg font-semibold text-3xl text-[#E7EBF3] mb-3">
          From tracked object to resolved conflict
        </h2>
        <p className="font-body-ui text-[#8892A6] max-w-[560px] mb-14 leading-relaxed">
          A closed loop that runs continuously, not a dashboard you have to
          babysit.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="bg-[#0C1220] border border-[#1B2436] rounded-xl p-6 flex flex-col"
            >
              <div className="font-technical-data text-xs text-[#4FE0C8] mb-3">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-display-lg font-semibold text-lg text-[#E7EBF3] mb-2">
                {s.title}
              </h3>
              <p className="font-body-ui text-sm text-[#8892A6] leading-relaxed m-0">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Reliability strip */



/* Page */

export const LandingPage: React.FC = () => {
  return (
    <div className="select-none">
      <Hero />
      <HowItWorks />
      
    </div>
  );
};

export default LandingPage;
