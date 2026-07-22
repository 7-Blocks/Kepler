import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ButtonBackToTop() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > window.innerHeight * 0.5);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {showButton && (
        <motion.button
          onClick={scrollToTop}
          aria-label="Back to top"
          initial={{
            opacity: 0,
            scale: 0.5,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.5,
          }}
          transition={{
            duration: 0.25,
          }}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border 
          border-white/10 bg-white/5 backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 
          hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.45)]"
        >
          <ArrowUp size={16} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
