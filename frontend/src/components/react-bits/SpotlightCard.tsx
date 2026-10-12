"use client";

// Minimal React Bits SpotlightCard adaptation. License: ./LICENSE.
import type { ComponentProps, PointerEvent } from "react";
import { motion, useMotionTemplate, useReducedMotion, useSpring } from "motion/react";
import { Card } from "@/components/ui/card";

export function SpotlightCard({ children, className, ...props }: ComponentProps<typeof Card>) {
  const reduced = useReducedMotion();
  const x = useSpring(0, { stiffness: 180, damping: 30 });
  const y = useSpring(0, { stiffness: 180, damping: 30 });
  const transform = useMotionTemplate`translate3d(${x}px, ${y}px, 0)`;
  function move(event: PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - bounds.left - 120);
    y.set(event.clientY - bounds.top - 120);
  }
  return <Card className={`spotlight-card ${className ?? ""}`} onPointerMove={move} {...props}>
    {!reduced && <motion.span aria-hidden="true" className="spotlight-glow" style={{ transform }} />}
    {children}
  </Card>;
}
