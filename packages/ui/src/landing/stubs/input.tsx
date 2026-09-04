import { twMerge } from "tailwind-merge";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Minimal text input for shared landing search/filter controls.
 */
export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={twMerge(
        "w-full rounded-none border border-landing-cream/15 bg-transparent px-3 py-2 text-sm text-landing-cream outline-none",
        className,
      )}
      {...props}
    />
  );
}
