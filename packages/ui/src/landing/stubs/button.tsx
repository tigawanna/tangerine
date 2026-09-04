import { twMerge } from "tailwind-merge";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost";
  size?: "default" | "sm";
};

/**
 * Minimal button used by the shared landing package (avoids app shadcn coupling).
 */
export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={twMerge(
        "inline-flex items-center justify-center gap-1.5 text-sm transition-colors",
        variant === "ghost" && "bg-transparent hover:bg-base-content/5",
        size === "sm" && "h-auto px-2 py-1",
        className,
      )}
      {...props}
    />
  );
}
