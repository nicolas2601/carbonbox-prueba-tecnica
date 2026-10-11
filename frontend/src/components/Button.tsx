import type { ButtonHTMLAttributes } from "react";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { tone?: "primary" | "secondary" };

export function Button({ tone = "secondary", ...props }: ButtonProps) {
  return <button type="button" {...props} className="button" data-tone={tone} />;
}
