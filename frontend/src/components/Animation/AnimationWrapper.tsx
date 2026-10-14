import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { fadeIn, slideUp, slideLeft, scaleIn } from "@/utils/animationConfig";
import { useInViewAnimation } from "@/hooks/useInViewAnimation";

type AnimationType = "fade" | "slideUp" | "slideLeft" | "scale";

interface AnimationWrapperProps {
  children: ReactNode;
  type?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

const variantsMap = {
  fade: fadeIn,
  slideUp: slideUp,
  slideLeft: slideLeft,
  scale: scaleIn,
};

export default function AnimationWrapper({
  children,
  type = "fade",
  delay = 0,
  duration,
  className,
  once = true,
}: AnimationWrapperProps) {
  const { ref, isInView, prefersReducedMotion } =
    useInViewAnimation({ once });

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants = variantsMap[type];

  return (
    <motion.div
      ref={ref as React.Ref<HTMLDivElement>}
      className={className}
      variants={variants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{
        delay,
        ...(duration ? { duration } : {}),
      }}
    >
      {children}
    </motion.div>
  );
}