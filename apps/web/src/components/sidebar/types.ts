import type { ComponentType, SVGProps } from "react";

/** Icon component accepted by sidebar links (Lucide, react-icons, etc.). */
export type SidebarIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

export type SidebarItem = {
  title: string;
  href: string;
  icon?: SidebarIcon;
  isActive?: boolean;
  sublinks?: SidebarItem[];
};
