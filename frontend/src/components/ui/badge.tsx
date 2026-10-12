import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const badgeVariants = cva("carbon-badge inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium", {
  variants: { variant: { default: "bg-primary text-primary-foreground", secondary: "bg-secondary text-secondary-foreground", destructive: "bg-failed-bg text-failed", outline: "border border-border text-foreground", ghost: "text-foreground", link: "text-accent-strong underline" } },
  defaultVariants: { variant: "default" },
});
export function Badge({ className, variant = "default", asChild = false, ...props }:
  ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot.Root : "span";
  return <Component data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}
export { badgeVariants };
