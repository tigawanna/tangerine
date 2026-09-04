import type { SidebarItem } from "@/components/sidebar/types";
import { GitFork, Star } from "lucide-react";

export const dashboard_primary_routes = [
  { title: "Repos", href: "/repos", icon: GitFork },
  { title: "Stars", href: "/stars", icon: Star },
] satisfies SidebarItem[];

export const dashboard_account_routes = [] satisfies SidebarItem[];
