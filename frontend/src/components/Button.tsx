import type { ButtonHTMLAttributes } from "react";
import { Button as BaseButton } from "./ui/button";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { tone?: "primary" | "secondary" };

export function Button({ tone = "secondary", ...props }: ButtonProps) {
  return <BaseButton type="button" variant={tone === "primary" ? "default" : "secondary"} {...props} data-tone={tone} />;
}
