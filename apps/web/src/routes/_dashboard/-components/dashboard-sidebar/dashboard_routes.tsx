import type { SidebarItem } from "@/components/sidebar/types";
import { GitFork, Star, User } from "lucide-react";

export const dashboard_primary_routes = [
  { title: "Viewer", href: "/viewer", icon: User },
  { title: "Repos", href: "/repos", icon: GitFork },
  { title: "Stars", href: "/stars", icon: Star },
] satisfies SidebarItem[];

export const dashboard_account_routes = [] satisfies SidebarItem[];
