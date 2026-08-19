import type { ReactNode } from "react";
import AnimationWrapper from "./AnimationWrapper";

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function AnimatedCard(props: AnimatedCardProps) {
  return <AnimationWrapper {...props} type="scale" />;
}