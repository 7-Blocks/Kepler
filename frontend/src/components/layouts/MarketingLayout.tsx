import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";


const FONT_LINK_ID = "kepler-landing-fonts";

function useInjectFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);
}

function useScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = hash.replace("#", "");
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
}

const footerLinkClass =
  "font-body-ui text-[13px] text-[#8892A6] hover:text-[#E7EBF3] no-underline transition-ui";

const navLinks = [
  { label: "Product", to: "/#product" },
  { label: "How it works", to: "/#how-it-works" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/#contact" },
];

function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0">
      <img
        src="/Logo.svg"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 object-contain"
      />
      <span className="font-necosmic text-[15px] text-white tracking-wide">
        Kepler
      </span>
    </Link>
  );
}

function MarketingNavBar() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  const linkClass = (active?: boolean) =>
    `font-body-ui text-[13px] sm:text-sm transition-ui no-underline px-1 ${
      active ? "text-white" : "text-white/65 hover:text-white"
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none">
      <motion.div
        initial={reduce ? false : { y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="marketing-nav-notch pointer-events-auto w-[min(100%,720px)] sm:w-[min(92%,760px)]"
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-3.5">
          <BrandMark />

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((l) =>
              l.to === "/about" ? (
                <NavLink
                  key={l.label}
                  to={l.to}
                  className={({ isActive }) => linkClass(isActive)}
                >
                  {l.label}
                </NavLink>
              ) : (
                <Link key={l.label} to={l.to} className={linkClass()}>
                  {l.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="font-body-ui font-semibold text-[13px] text-black bg-white hover:bg-white/90 border-none rounded-full px-4 sm:px-5 py-2 cursor-pointer transition-ui whitespace-nowrap"
            >
              Launch
            </button>

            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white cursor-pointer"
            >
              <span className="sr-only">Menu</span>
              <span className="flex flex-col gap-1.5" aria-hidden="true">
                <span
                  className={`block h-px w-3.5 bg-white transition-ui ${
                    menuOpen ? "translate-y-[3.5px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`block h-px w-3.5 bg-white transition-ui ${
                    menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden border-t border-white/10"
            >
              <div className="flex flex-col gap-1 px-5 py-3 pb-4">
                {navLinks.map((l) =>
                  l.to === "/about" ? (
                    <NavLink
                      key={l.label}
                      to={l.to}
                      className={({ isActive }) =>
                        `${linkClass(isActive)} py-2`
                      }
                    >
                      {l.label}
                    </NavLink>
                  ) : (
                    <Link
                      key={l.label}
                      to={l.to}
                      className={`${linkClass()} py-2`}
                    >
                      {l.label}
                    </Link>
                  )
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
}

type FooterLink =
  | { label: string; to: string; disabled?: false }
  | { label: string; to?: undefined; disabled: true };

function MarketingFooter() {
  const productLinks = [
    { label: "Overview", to: "/#product" },
    { label: "How it works", to: "/#how-it-works" },
    { label: "Reliability", to: "/#reliability" },
    { label: "Dashboard", to: "/dashboard" },
  ];

  const companyLinks: FooterLink[] = [
    { label: "About", to: "/about" },
    { label: "Careers", disabled: true },
    { label: "Contact", to: "/#contact" },
  ];

  return (
    <footer id="contact" className="relative mt-auto bg-[#0C1220] section-rule section-rule-full">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(79,224,200,0.07), transparent 70%)",
        }}
      />

      <div className="relative max-w-[1180px] mx-auto px-6 pt-16 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 lg:gap-16 pb-12">
          <div className="max-w-[420px]">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/Logo.svg"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="font-necosmic text-xl text-[#E7EBF3] tracking-wide">
                Kepler
              </span>
            </div>
            <p className="font-body-ui text-[15px] text-[#8892A6] leading-relaxed m-0 mb-6">
              Autonomous space traffic management for operators who can't
              afford to guess.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center font-body-ui font-semibold text-[13px] text-black bg-white hover:bg-white/90 no-underline rounded-full px-5 py-2.5 transition-ui"
            >
              Launch Dashboard
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 sm:gap-14">
            <div>
              <div className="font-technical-data text-[11px] text-[#4FE0C8] tracking-[0.16em] mb-4">
                PRODUCT
              </div>
              {productLinks.map((link) => (
                <div key={link.label} className="mb-2.5">
                  <Link to={link.to} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </div>
              ))}
            </div>
            <div>
              <div className="font-technical-data text-[11px] text-[#4FE0C8] tracking-[0.16em] mb-4">
                COMPANY
              </div>
              {companyLinks.map((link) => (
                <div key={link.label} className="mb-2.5">
                  {link.disabled || !link.to ? (
                    <span className="font-body-ui text-[13px] text-[#8892A6]/45 cursor-default select-none">
                      {link.label}
                    </span>
                  ) : (
                    <Link to={link.to} className={footerLinkClass}>
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="font-technical-data text-[11px] text-[#4FE0C8] tracking-[0.16em] mb-4">
                STATUS
              </div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4FE0C8] shadow-[0_0_8px_rgba(79,224,200,0.8)]" />
                <span className="font-body-ui text-[13px] text-[#E7EBF3]">
                  All systems nominal
                </span>
              </div>
              <p className="font-technical-data text-[11px] text-[#8892A6] m-0 leading-relaxed">
                TRACKING · LIVE
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 section-rule section-rule-full">
          <p className="font-technical-data text-[11px] text-[#8892A6] m-0">
            © {new Date().getFullYear()} Kepler. Orbital intelligence platform.
          </p>
          <p className="font-technical-data text-[11px] text-[#8892A6]/70 m-0">
            Built for the crowded sky.
          </p>
        </div>
      </div>
    </footer>
  );
}

export const MarketingLayout: React.FC = () => {
  useInjectFonts();
  useScrollToHash();

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.body.style.overflowX = "hidden";
    return () => {
      document.body.style.overflow = "hidden";
      document.body.style.overflowX = "hidden";
    };
  }, []);

  return (
    <div className="bg-[#0C1220] min-h-screen text-[#E7EBF3] overflow-x-hidden flex flex-col">
      <MarketingNavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
};

export default MarketingLayout;
