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
  { label: "Product", to: "/product" },
  { label: "Solutions", to: "/solutions" },
  { label: "Developers", to: "/developers" },
  { label: "Docs", to: "/docs" },
  { label: "Dashboard", to: "/dashboard" },
];

function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0 group">
      <div className="relative flex items-center justify-center h-8 w-8 rounded-xl bg-black transition-transform group-hover:scale-105 shadow-sm">
        <img
          src="/Logo.svg"
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 object-contain"
        />
      </div>
      <span className="font-necosmic text-[16px] text-[#0C1220] tracking-wide font-medium">
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
    `relative font-body-ui text-[14px] font-medium transition-all no-underline px-3 py-2 rounded-full ${
      active 
        ? "text-[#0C1220] bg-gray-100" 
        : "text-[#5F6A80] hover:text-[#0C1220] hover:bg-gray-50"
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none pt-4 sm:pt-6">
      <motion.div
        initial={reduce ? false : { y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto w-[calc(100%-32px)] max-w-[1100px] mx-auto bg-white/95 backdrop-blur-md rounded-full border border-black/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
      >
        <div className="flex items-center justify-between gap-3 px-3 py-2 sm:py-2.5 sm:px-4">
          <BrandMark />

          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) => linkClass(isActive)}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/signin")}
              className="hidden sm:inline-flex font-body-ui font-medium text-[14px] text-white bg-[#7E56D9] hover:bg-[#6941C6] border border-transparent rounded-full px-5 py-2 cursor-pointer transition-all shadow-[0_2px_8px_rgba(126,86,217,0.3)] hover:shadow-[0_4px_12px_rgba(126,86,217,0.4)] hover:-translate-y-0.5 active:translate-y-0"
            >
              Sign In
            </button>

            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-[#0C1220] cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <span className="sr-only">Menu</span>
              <span className="flex flex-col gap-[5px]" aria-hidden="true">
                <span
                  className={`block h-[1.5px] w-[18px] bg-current transition-transform duration-300 ${
                    menuOpen ? "translate-y-[6.5px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`block h-[1.5px] w-[18px] bg-current transition-opacity duration-300 ${
                    menuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`block h-[1.5px] w-[18px] bg-current transition-transform duration-300 ${
                    menuOpen ? "-translate-y-[6.5px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[#0C1220]/40 backdrop-blur-sm z-[-1] pointer-events-auto md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full mt-3 left-4 right-4 bg-white rounded-3xl p-4 shadow-xl border border-black/[0.04] md:hidden pointer-events-auto z-10"
            >
              <div className="flex flex-col gap-1">
                {navLinks.map((l) => (
                  <NavLink
                    key={l.label}
                    to={l.to}
                    className={({ isActive }) =>
                      `font-body-ui text-[15px] font-medium transition-all px-4 py-3 rounded-2xl ${
                        isActive
                          ? "text-[#0C1220] bg-gray-50"
                          : "text-[#5F6A80] hover:text-[#0C1220] hover:bg-gray-50"
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
                <div className="mt-2 pt-3 border-t border-gray-100 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/signin");
                    }}
                    className="w-full font-body-ui font-medium text-[15px] text-white bg-[#7E56D9] hover:bg-[#6941C6] rounded-2xl px-5 py-3.5 transition-colors text-center"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
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
