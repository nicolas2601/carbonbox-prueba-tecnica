"use client";

import type { ComponentProps } from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export function TooltipProvider({ delayDuration = 250, ...props }: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={0} {...props} />;
}
export function TooltipContent({ className, sideOffset = 8, children, ...props }: ComponentProps<typeof TooltipPrimitive.Content>) {
  return <TooltipPrimitive.Portal><TooltipPrimitive.Content sideOffset={sideOffset} className={cn("carbon-tooltip", className)} {...props}>
    {children}<TooltipPrimitive.Arrow className="fill-graphite" />
  </TooltipPrimitive.Content></TooltipPrimitive.Portal>;
}
