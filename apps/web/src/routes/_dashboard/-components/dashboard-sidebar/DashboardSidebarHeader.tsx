import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { defaultUserSearch } from "@/routes/_dashboard/$user/layout";
import { AppConfig } from "@/utils/system";
import { Link, useParams } from "@tanstack/react-router";
import { CircleUser } from "lucide-react";

interface DashboardSidebarHeaderProps {
  /** Signed-in GitHub login — “My profile” opens their `/$user` route. */
  githubLogin?: string;
}

export function DashboardSidebarHeader({ githubLogin }: DashboardSidebarHeaderProps) {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const expanded = state === "expanded" || isMobile;
  const params = useParams({ strict: false }) as { user?: string };
  const viewedUser = params.user?.trim();
  const viewingOther = Boolean(
    githubLogin && viewedUser && viewedUser.toLowerCase() !== githubLogin.toLowerCase(),
  );
  const myProfileLabel = viewingOther ? "Back to my profile" : "My profile";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
          tooltip="Landing"
          onClick={() => setOpenMobile(false)}
          data-test="dashboard-sidebar-landing"
        >
          <Link to="/" className="hover:bg-primary/10 flex w-full justify-center">
            <HeaderBrand expanded={expanded} />
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      {githubLogin ? (
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            asChild
            tooltip={myProfileLabel}
            isActive={!viewingOther && Boolean(viewedUser)}
            onClick={() => setOpenMobile(false)}
            data-test="dashboard-sidebar-my-profile"
          >
            <Link
              to="/$user"
              params={{ user: githubLogin }}
              search={defaultUserSearch}
              className={
                expanded
                  ? "hover:bg-primary/10"
                  : "hover:bg-primary/10 flex w-full justify-center"
              }
            >
              <span className="flex aspect-square size-5 items-center justify-center">
                <CircleUser className="size-5 shrink-0" aria-hidden />
              </span>
              {expanded ? <span className="truncate">{myProfileLabel}</span> : null}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ) : null}
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
