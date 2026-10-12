import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva("carbon-button button", {
  variants: {
    variant: { default: "button-primary", secondary: "button-secondary", outline: "button-secondary", ghost: "button-ghost", destructive: "button-destructive", link: "button-link" },
    size: { default: "", sm: "", xs: "", lg: "button-lg", icon: "button-icon", "icon-sm": "button-icon", "icon-xs": "button-icon", "icon-lg": "button-icon" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export function Button({ className, variant = "default", size = "default", asChild = false, ...props }:
  ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot.Root : "button";
  return <Component data-slot="button" data-variant={variant} data-size={size}
    className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
export { buttonVariants };
