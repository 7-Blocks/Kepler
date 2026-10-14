import { useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface UseInViewAnimationOptions {
  once?: boolean;
  amount?: "some" | "all" | number;
}

export const useInViewAnimation = (
  options: UseInViewAnimationOptions = {}
) => {
  const { once = true, amount = 0.2 } = options;

  const ref = useRef<HTMLElement | null>(null);

  const isInView = useInView(ref, {
    once,
    amount,
  });

  const prefersReducedMotion = useReducedMotion();

  return {
    ref,
    isInView,
    prefersReducedMotion,
  };
};