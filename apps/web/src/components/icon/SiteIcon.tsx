import { TigawannaMarkIcon } from "@/components/icon/TigawannaMarkIcon";

interface SiteIconProps extends React.ComponentProps<typeof TigawannaMarkIcon> {
  size?: number;
}

export function SiteIcon({ className, size = 24, ...props }: SiteIconProps) {
  return <TigawannaMarkIcon size={size} className={className} {...props} />;
}
