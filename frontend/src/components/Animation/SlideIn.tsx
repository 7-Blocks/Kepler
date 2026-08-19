import type { ReactNode } from "react";
import AnimationWrapper from "./AnimationWrapper";

interface SlideInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export default function SlideIn(props: SlideInProps) {
  return <AnimationWrapper {...props} type="slideUp" />;
}