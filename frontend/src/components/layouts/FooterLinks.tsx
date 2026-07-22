import { Link } from "react-router-dom";
import { MagicCard } from "@/components/ui/magic-card";

const platformLinks = [
  { label: "Product", to: "/product" },
  { label: "Solutions", to: "/solutions" },
  { label: "Developers", to: "/developers" },
  { label: "Technology", to: "/technologies" },
  { label: "Dashboard", to: "/dashboard" },
];

const companyLinks = [
  { label: "About", to: "/about" },
  { label: "Careers", to: "#" },
  { label: "Blog", to: "#" },
  { label: "Contact", to: "/#contact" },
];

const resourceLinks = [
  { label: "Documentation", to: "/docs" },
  { label: "FAQs", to: "#" },
  { label: "Support", to: "/#contact" },
];

export default function FooterLinks() {
  return (
    <section className="relative py-24">

      {/* Huge Background Wordmark */}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <img
          src="/Logo.svg"
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 object-contain"
        />
        <h1 className="select-none text-[180px] md:text-[260px] lg:text-[340px] font-black tracking-[0.2em] text-white/[0.03]">
          KEPLER
        </h1>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">

        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">

          {/* Brand */}

          <div className="max-w-md">
            
            <div className="flex items-center gap-4">

              <img
                src="/Logo.svg"
                alt="Kepler"
                className="h-12 w-12"
              />

              <div>

                <h2 className="font-necosmic text-[26px] text-white tracking-wide font-medium">
                  KEPLER
                </h2>

                <p className="mt-1 text-sm uppercase tracking-[0.22em] text-cyan-300">
                  AI-Powered Space Traffic Platform
                </p>

              </div>

            </div>

            <p className="mt-7 text-slate-400 leading-9">
              Kepler delivers intelligent orbital monitoring,
              autonomous collision avoidance, mission planning,
              and real-time traffic management for the next
              generation of space operations.
            </p>

            <div className="mt-10 flex items-center gap-3">

              <span className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse"></span>

              <span className="text-cyan-300">
                All Systems Operational
              </span>

            </div>

          </div>

          {/* Navigation */}

          <div className="grid gap-6 md:grid-cols-3">

            <FooterCard
              title="Platform"
              links={platformLinks}
            />

            <FooterCard
              title="Company"
              links={companyLinks}
            />

            <FooterCard
              title="Resources"
              links={resourceLinks}
            />

          </div>

        </div>

      </div>

    </section>
  );
}

function FooterCard({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string }[];
}) {
  return (
    <MagicCard
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl"
    >
      <h3 className="mb-6 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
        {title}
      </h3>

      <div className="space-y-4">

        {links.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="
              block
              text-slate-400
              transition-all
              duration-300
              hover:translate-x-2
              hover:text-white
            "
          >
            {link.label}
          </Link>
        ))}

      </div>
    </MagicCard>
  );
}