import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import FooterHero from "./FooterHero";
import FooterLinks from "./FooterLinks";
import FooterSocials from "./FooterSocials";

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
      <span className="font-necosmic text-[16px] text-white tracking-wide font-medium">
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  const linkClass = (active?: boolean) =>
    `relative font-body-ui text-[14px] font-medium transition-all duration-300 no-underline px-4 py-2 rounded-full ${active
      ? "text-white bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] after:content-[''] after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-white after:rounded-full after:shadow-[0_0_5px_rgba(255,255,255,0.8)]"
      : "text-neutral-400 hover:text-white hover:bg-white/5"
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none pt-4 sm:pt-6">
      <motion.div
        initial={reduce ? false : { y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto w-[calc(100%-32px)] max-w-[900px] mx-auto bg-black/40 backdrop-blur-lg rounded-full border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
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
              className="hidden sm:inline-flex font-body-ui font-medium text-[14px] text-black bg-white hover:bg-gray-200 border border-transparent rounded-full px-5 py-2 cursor-pointer transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0"
            >
              Sign In
            </button>

            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white cursor-pointer hover:bg-white/10 transition-colors"
            >
              <span className="sr-only">Menu</span>
              <span className="flex flex-col gap-[5px]" aria-hidden="true">
                <span
                  className={`block h-[1.5px] w-[18px] bg-current transition-transform duration-300 ${menuOpen ? "translate-y-[6.5px] rotate-45" : ""
                    }`}
                />
                <span
                  className={`block h-[1.5px] w-[18px] bg-current transition-opacity duration-300 ${menuOpen ? "opacity-0" : ""
                    }`}
                />
                <span
                  className={`block h-[1.5px] w-[18px] bg-current transition-transform duration-300 ${menuOpen ? "-translate-y-[6.5px] -rotate-45" : ""
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
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[-1] pointer-events-auto md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full mt-3 left-4 right-4 bg-[#0A0A0A] rounded-3xl p-4 shadow-2xl border border-white/10 md:hidden pointer-events-auto z-10"
            >
              <div className="flex flex-col gap-1">
                {navLinks.map((l) => (
                  <NavLink
                    key={l.label}
                    to={l.to}
                    className={({ isActive }) =>
                      `relative font-body-ui text-[15px] font-medium transition-all px-4 py-3 rounded-2xl ${isActive
                        ? "text-white bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:right-6 after:w-1 after:h-1 after:bg-white after:rounded-full after:shadow-[0_0_5px_rgba(255,255,255,0.8)]" : "text-neutral-400 hover:text-white hover:bg-white/5"
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
                <div className="mt-2 pt-3 border-t border-white/10 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/signin");
                    }}
                    className="w-full font-body-ui font-medium text-[15px] text-black bg-white hover:bg-gray-200 rounded-2xl px-5 py-3.5 transition-colors text-center shadow-[0_0_15px_rgba(255,255,255,0.1)]"
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


function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#050811]">

      <FooterHero />



      <FooterLinks />
      <FooterSocials />
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
