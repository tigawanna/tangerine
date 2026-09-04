import { twMerge } from "tailwind-merge";
import type { ReactNode, SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children?: ReactNode;
};

/**
 * Minimal select used by the shared projects topic filter.
 */
export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={twMerge(
        "rounded-none border border-landing-cream/15 bg-transparent px-3 py-2 text-sm text-landing-cream outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ className, children, ...props }: SelectProps) {
  return (
    <Select className={className} {...props}>
      {children}
    </Select>
  );
}

export function SelectValue(_props: { placeholder?: string }) {
  return null;
}

export function SelectContent({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }: { value: string; children?: ReactNode }) {
  return <option value={value}>{children}</option>;
}
