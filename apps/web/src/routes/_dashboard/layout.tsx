import { getSession } from "@/data-access-layer/auth/auth.functions";
import { RouterErrorComponent } from "@/lib/tanstack/router/routerErrorComponent";
import { RouterNotFoundComponent } from "@/lib/tanstack/router/RouterNotFoundComponent";
import { RouterPendingComponent } from "@/lib/tanstack/router/RouterPendingComponent";
import { AppConfig } from "@/utils/system";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { DashboardLayout } from "./-components/dashboard-sidebar/DashboardLayout";
import { dashboard_account_routes } from "./-components/dashboard-sidebar/dashboard_routes";

export const Route = createFileRoute("/_dashboard")({
  beforeLoad: async ({ location }) => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: "/auth", search: { returnTo: location.pathname } });
    }
  },
  pendingComponent: RouterPendingComponent,
  notFoundComponent: () => <RouterNotFoundComponent />,
  errorComponent: ({ error }) => <RouterErrorComponent error={error} />,
  component: DashboardShell,
  head: () => ({
    meta: [
      {
        title: `${AppConfig.name} | Dashboard`,
      },
    ],
  }),
});

function DashboardShell() {
  return (
    <Suspense fallback={<RouterPendingComponent />}>
      <DashboardLayout
        sidebarLabel="Menu"
        accountRoutes={dashboard_account_routes}
        accountLabel="Account"
      />
    </Suspense>
  );
}
