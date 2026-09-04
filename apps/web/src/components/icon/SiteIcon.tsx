import { AppBrandIcon } from "@/components/icon/AppBrandIcon";

interface SiteIconProps extends React.ComponentProps<typeof AppBrandIcon> {
  size?: number;
}

export function SiteIcon({ className, size = 24, ...props }: SiteIconProps) {
  return <AppBrandIcon size={size} className={className} {...props} />;
}
