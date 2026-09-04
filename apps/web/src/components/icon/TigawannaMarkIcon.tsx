import { cn } from "@/lib/utils";

const VIEWBOX_WIDTH = 220;
const VIEWBOX_HEIGHT = 140;
const ASPECT_RATIO = VIEWBOX_HEIGHT / VIEWBOX_WIDTH;

interface TigawannaMarkIconProps extends React.ComponentProps<"svg"> {
  size?: number;
}

export function TigawannaMarkIcon({ className, size, ...props }: TigawannaMarkIconProps) {
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size ? Math.round(size * ASPECT_RATIO) : undefined}
      className={cn("text-current", className)}
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
      <path
        d="M114 42L132 28L148 36L138 52L114 42Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M106 98L88 112L72 104L82 88L106 98Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M76 70H144"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="3 5"
      />
      <circle cx="110" cy="70" r="3" fill="currentColor" />
      <path
        d="M62 58L48 70L62 82"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M158 58L172 70L158 82"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
