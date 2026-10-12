"use client";

import type { ComponentProps } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({ children, className, side = "left", showCloseButton = true, ...props }:
  ComponentProps<typeof DialogPrimitive.Content> & { side?: "left" | "right" | "top" | "bottom"; showCloseButton?: boolean }) {
  return <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="carbon-sheet-overlay" />
    <DialogPrimitive.Content data-slot="sheet-content" data-side={side} className={cn("carbon-sheet", className)} {...props}>
      {children}
      {showCloseButton && <DialogPrimitive.Close asChild>
        <Button variant="ghost" size="icon" className="sheet-close" aria-label="Close navigation"><X aria-hidden="true" size={20} /></Button>
      </DialogPrimitive.Close>}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>;
}
export function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("sheet-heading", className)} {...props} />;
}
export function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="sheet-footer" className={cn("sheet-footer", className)} {...props} />;
}
export function SheetTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("font-display text-xl font-semibold", className)} {...props} />;
}
export function SheetDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
