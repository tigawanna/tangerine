import { twMerge } from "tailwind-merge";
import type { ComponentProps } from "react";

const VIEWBOX_WIDTH = 220;
const VIEWBOX_HEIGHT = 140;
const ASPECT_RATIO = VIEWBOX_HEIGHT / VIEWBOX_WIDTH;

interface TigawannaMarkIconProps extends ComponentProps<"svg"> {
  size?: number;
}

/**
 * Brand mark used in the shared landing hero illustration.
 */
export function TigawannaMarkIcon({ className, size, ...props }: TigawannaMarkIconProps) {
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size ? Math.round(size * ASPECT_RATIO) : undefined}
      className={twMerge("text-current", className)}
      {...props}
    >
      <path
        d="M28 70C28 42 48 22 76 22C92 22 106 30 114 42"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M192 70C192 98 172 118 144 118C128 118 114 110 106 98"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="110" cy="70" r="18" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
