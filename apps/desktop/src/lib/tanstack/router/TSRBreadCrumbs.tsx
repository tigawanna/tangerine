import { Link } from "@tanstack/react-router";
import { useTSRBreadCrumbs } from "./use-tsr-breadcrumbs";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { defaultUserSearch, type UserSearch } from "@/routes/_dashboard/$user/layout";

interface TSRBreadCrumbsProps {}

/**
 * Path crumbs for the dashboard. Maps legacy `/repos` + `/stars` segments to the
 * profile tab URLs so we never link into the redirect-only routes (back-button yoyo).
 */
export function TSRBreadCrumbs(_props: TSRBreadCrumbsProps) {
  const { breadcrumb_routes } = useTSRBreadCrumbs();
  if (breadcrumb_routes.length < 2) return null;

  return (
    <div className="gap-0.1 flex w-full flex-wrap p-1 px-3 md:justify-end">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumb_routes.map((crumb, index) => {
            const isLast = index === breadcrumb_routes.length - 1;
            if (isLast) {
              return (
                <BreadcrumbItem key={crumb.path}>
                  <BreadcrumbPage className="hover:text-accent-text hover:animate-in hover:fade-in line-clamp-1 cursor-pointer text-xs hover:max-w-fit hover:duration-300">
                    {crumb.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              );
            }

            const link = crumbLink(crumb.path, breadcrumb_routes[0]?.name);

            return (
              <div className="flex items-center gap-2" key={crumb.path}>
                <BreadcrumbItem>
                  {link.kind === "profile" ? (
                    <Link
                      to="/$user"
                      params={{ user: link.user }}
                      search={link.search}
                      className="hover:text-accent-text hover:animate-in hover:fade-in line-clamp-1 cursor-pointer text-xs hover:max-w-fit hover:duration-300"
                    >
                      {crumb.name}
                    </Link>
                  ) : (
                    <Link
                      to={link.path}
                      className="hover:text-accent-text hover:animate-in hover:fade-in line-clamp-1 cursor-pointer text-xs hover:max-w-fit hover:duration-300"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
              </div>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

function crumbLink(
  path: string,
  userLogin: string | undefined,
): { kind: "profile"; user: string; search: UserSearch } | { kind: "path"; path: string } {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 1 && userLogin) {
    return { kind: "profile", user: userLogin, search: defaultUserSearch };
  }
  if (parts.length === 2 && userLogin && parts[0] === userLogin) {
    if (parts[1] === "repos") {
      return { kind: "profile", user: userLogin, search: defaultUserSearch };
    }
    if (parts[1] === "stars") {
      return {
        kind: "profile",
        user: userLogin,
        search: { ...defaultUserSearch, tab: "starred" },
      };
    }
  }
  return { kind: "path", path };
}
