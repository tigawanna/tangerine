import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { defaultUserSearch } from "@/routes/_dashboard/$user/layout";
import { AppConfig } from "@/utils/system";
import { Link } from "@tanstack/react-router";

interface DashboardSidebarHeaderProps {
  /** Active dashboard user login — home links to their profile. */
  user?: string;
}

export function DashboardSidebarHeader({ user }: DashboardSidebarHeaderProps) {
  const { state, setOpenMobile, isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
          onClick={() => setOpenMobile(false)}
          data-test="dashboard-sidebar-home"
        >
          {user ? (
            <Link
              to="/$user"
              params={{ user }}
              search={defaultUserSearch}
              className="hover:bg-primary/10 flex w-full justify-center"
            >
              <HeaderBrand expanded={state === "expanded" || isMobile} />
            </Link>
          ) : (
            <Link to="/viewer" className="hover:bg-primary/10 flex w-full justify-center">
              <HeaderBrand expanded={state === "expanded" || isMobile} />
            </Link>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function HeaderBrand({ expanded }: { expanded: boolean }) {
  return (
    <>
      <span className="flex aspect-square size-5 items-center justify-center rounded-lg">
        <AppConfig.icon className="text-sidebar-foreground size-5" />
      </span>
      {expanded ? (
        <span className="font-serif text-xl tracking-tight">
          {AppConfig.name}
          <span className="text-primary">.</span>
        </span>
      ) : null}
    </>
  );
}
