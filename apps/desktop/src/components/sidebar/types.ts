import type { UserSearch } from "@/routes/_dashboard/$user/layout";
import type { LucideIcon } from "lucide-react";

/**
 * Sidebar icons are Lucide components.
 * Avoid `ComponentType<SVGProps<…>>` — under Deno it resolves a different
 * `@types/react` than Lucide (CSSProperties / `--radix-*` clash).
 */
export type SidebarIcon = LucideIcon;

export type SidebarItem = {
  title: string;
  href: string;
  /** Route params when `href` includes `$param` segments (e.g. `/$user`). */
  params?: Record<string, string>;
  /** Optional search params (e.g. profile `tab` + repo filters). */
  search?: UserSearch | Record<string, string | boolean | number | undefined>;
  /**
   * Replace the current history entry (use for same-profile tab switches so Back
   * leaves the profile in one step instead of walking Repos → Starred → …).
   */
  replace?: boolean;
  icon?: SidebarIcon;
  isActive?: boolean;
  sublinks?: SidebarItem[];
};
