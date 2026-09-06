import type { SidebarItem } from "@/components/sidebar/types";
import { defaultGithubSearch } from "@/routes/_dashboard/-components/search/github-search";
import { defaultUserSearch } from "@/routes/_dashboard/$user/layout";
import { Search, Star, User, Users } from "lucide-react";

/**
 * Sidebar links for the profile in the URL.
 * `replace: true` so tab switches don’t stack history — Back leaves the profile
 * in one step (username / home navigations still push).
 */
export function dashboardPrimaryRoutes(user: string): SidebarItem[] {
  const params = { user };
  return [
    {
      title: "Profile",
      href: "/$user",
      params,
      search: { ...defaultUserSearch, tab: "repos" },
      replace: true,
      icon: User,
    },
    {
      title: "Starred",
      href: "/$user",
      params,
      search: { ...defaultUserSearch, tab: "starred" },
      replace: true,
      icon: Star,
    },
    {
      title: "Followers",
      href: "/$user",
      params,
      search: { ...defaultUserSearch, tab: "followers" },
      replace: true,
      icon: Users,
    },
    {
      title: "Search",
      href: "/$user/search",
      params,
      search: defaultGithubSearch,
      icon: Search,
    },
  ];
}

export const dashboard_account_routes = [] satisfies SidebarItem[];
