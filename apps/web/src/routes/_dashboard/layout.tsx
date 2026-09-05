import { getSession } from "@/data-access-layer/auth/auth.functions";
import { getGithubRelayEnvironment } from "@/lib/relay/create-environment";
import { getClientGithubAccessToken } from "@/lib/relay/github-access-token";
import { fetchGithubLogin } from "@/lib/relay/resolve-github-login";
import { RouterErrorComponent } from "@/lib/tanstack/router/routerErrorComponent";
import { RouterNotFoundComponent } from "@/lib/tanstack/router/RouterNotFoundComponent";
import { RouterPendingComponent } from "@/lib/tanstack/router/RouterPendingComponent";
import { AppConfig } from "@/utils/system";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { RelayEnvironmentProvider } from "react-relay";
import { DashboardLayout } from "./-components/dashboard-sidebar/DashboardLayout";
import { dashboard_account_routes } from "./-components/dashboard-sidebar/dashboard_routes";

export const Route = createFileRoute("/_dashboard")({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: "/auth", search: { returnTo: location.pathname } });
    }

    const fromSession = session.user.githubUsername?.trim();
    // Prefer session login so we skip `/get-access-token` on every nav.
    // Relay still resolves the token (cached) when it queries GitHub.
    const githubLogin =
      fromSession || (await fetchGithubLogin(await getClientGithubAccessToken()));

    return {
      githubLogin,
      // Reuse the same Environment across dashboard navigations so
      // loadQuery refs stay valid for usePreloadedQuery.
      relayEnvironment: getGithubRelayEnvironment(context.relayEnvironment),
    };
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
  const { relayEnvironment } = Route.useRouteContext();

  if (!relayEnvironment) {
    throw new Error("Relay environment missing on /_dashboard");
  }

  return (
    <RelayEnvironmentProvider environment={relayEnvironment}>
      <Suspense fallback={<RouterPendingComponent />}>
        <DashboardLayout
          sidebarLabel="Menu"
          accountRoutes={dashboard_account_routes}
          accountLabel="Account"
        />
      </Suspense>
    </RelayEnvironmentProvider>
  );
}
