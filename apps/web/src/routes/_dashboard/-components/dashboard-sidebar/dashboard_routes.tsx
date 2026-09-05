import type { SidebarItem } from "@/components/sidebar/types";
import { defaultUserSearch } from "@/routes/_dashboard/$user/layout";
import { Star, User, Users } from "lucide-react";

/**
 * Sidebar links scoped to the active `/$user` login (tabs live on the profile page).
 */
export function dashboardPrimaryRoutes(user: string): SidebarItem[] {
  const params = { user };
  return [
    {
      title: "Profile",
      href: "/$user",
      params,
      search: { ...defaultUserSearch, tab: "repos" },
      icon: User,
    },
    {
      title: "Starred",
      href: "/$user",
      params,
      search: { ...defaultUserSearch, tab: "starred" },
      icon: Star,
    },
    {
      title: "Followers",
      href: "/$user",
      params,
      search: { ...defaultUserSearch, tab: "followers" },
      icon: Users,
    },
  ];
}

export const dashboard_account_routes = [] satisfies SidebarItem[];
