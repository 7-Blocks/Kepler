import type { ReactNode } from "react";
import AnimationWrapper from "./AnimationWrapper";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export default function FadeIn(props: FadeInProps) {
  return <AnimationWrapper {...props} type="fade" />;
}