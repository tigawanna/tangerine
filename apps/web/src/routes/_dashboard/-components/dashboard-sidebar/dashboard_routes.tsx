import type { SidebarItem } from "@/components/sidebar/types";
import { GitFork, Star, User } from "lucide-react";

/**
 * Sidebar links scoped to the active `/$user` login.
 */
export function dashboardPrimaryRoutes(user: string): SidebarItem[] {
  const params = { user };
  return [
    { title: "Profile", href: "/$user", params, icon: User },
    { title: "Repos", href: "/$user/repos", params, icon: GitFork },
    { title: "Stars", href: "/$user/stars", params, icon: Star },
  ];
}

export const dashboard_account_routes = [] satisfies SidebarItem[];
