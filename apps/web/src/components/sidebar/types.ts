import type { UserSearch } from "@/routes/_dashboard/$user/layout";
import type { ComponentType, SVGProps } from "react";

/** Icon component accepted by sidebar links (Lucide, react-icons, etc.). */
export type SidebarIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

export type SidebarItem = {
  title: string;
  href: string;
  /** Route params when `href` includes `$param` segments (e.g. `/$user`). */
  params?: Record<string, string>;
  /** Optional search params (e.g. profile `tab` + repo filters). */
  search?: UserSearch | Record<string, string | boolean | number | undefined>;
  icon?: SidebarIcon;
  isActive?: boolean;
  sublinks?: SidebarItem[];
};
