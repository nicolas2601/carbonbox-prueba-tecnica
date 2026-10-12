"use client";

// Adapted from React Bits CountUp. License: ./LICENSE.
import { useEffect } from "react";
import { useMotionValue, useMotionValueEvent, useReducedMotion, useSpring } from "motion/react";
import { numberFormatter } from "@/lib/format";
import { useVisibility } from "@/lib/useVisibility";

export function CountUp({ value, className }: { value: number; className?: string }) {
  const reduced = useReducedMotion();
  const { ref, visible } = useVisibility<HTMLSpanElement>(!reduced);
  const counter = useMotionValue(0);
  const spring = useSpring(counter, { stiffness: 100, damping: 30 });
  useMotionValueEvent(spring, "change", current => {
    if (ref.current && !reduced) ref.current.textContent = numberFormatter.format(Math.round(current));
  });
  useEffect(() => {
    if (reduced || !visible) return;
    counter.set(value);
  }, [counter, reduced, value, visible]);
  return <span ref={ref} aria-hidden="true" className={className}>{numberFormatter.format(value)}</span>;
}
