import {useRef, type ReactNode} from "react";
import {motion, useMotionValue, useSpring} from "framer-motion"

interface MouseParallaxProps {
    children: ReactNode;
    strength?: number;
    className?: string;
    springConfig?: {
      stiffness?: number;
      damping?: number;
      mass?: number;
    };
  }

export function MouseParallax({
    children,
    strength = 20,
    className="",
    springConfig = {stiffness: 150, damping: 15, mass: 0.1},
}: MouseParallaxProps) {
    const ref = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const offsetX = (e.clientX - centerX) / (rect.width / 2);
        const offsetY = (e.clientY - centerY) / (rect.height / 2);

        x.set(offsetX * strength);
        y.set(offsetY * strength);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
          ref={ref}
          className={className}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{x: springX, y: springY}}
        >
            {children}
        </motion.div>
    )
}