import { getSession } from "@/data-access-layer/auth/auth.functions";
import { authClient, type BetterAuthSession } from "@/lib/auth-client";
import {
  getUserAppRole,
  hasAppRole,
  isAdminRole,
  type AppRole,
} from "@repo/auth";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { redirect, useRouter } from "@tanstack/react-router";

type ViewerUser = BetterAuthSession["user"];
type ViewerSession = BetterAuthSession["session"];

export type TViewer = {
  user?: ViewerUser;
  session?: ViewerSession;
};

export { getUserAppRole, ROLE, type AppRole } from "@repo/auth";

export function isAdminUser(user: ViewerUser | undefined): boolean {
  return isAdminRole(getUserAppRole(user));
}

export function requireAppRole(user: ViewerUser | undefined, allowed: readonly AppRole[]): AppRole {
  const role = getUserAppRole(user);
  if (!hasAppRole(role, allowed)) {
    throw redirect({ to: "/auth", search: { returnTo: "/" } });
  }
  return role;
}

export const viewerqueryOptions = queryOptions({
  queryKey: ["viewer"],
  queryFn: async () => {
    const session = await getSession();
    if (!session) {
      return { data: null, error: null };
    }
    return {
      data: { user: session.user, session: session.session },
      error: null,
    };
  },
});

export function useViewer() {
  const qc = useQueryClient();
  const router = useRouter();
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authClient.signOut();
      void qc.invalidateQueries(viewerqueryOptions);
      await router.invalidate();
      throw redirect({ to: "/auth", search: { returnTo: "/" } });
    },
  });
  const viewerQuery = useSuspenseQuery(viewerqueryOptions);
  const user = viewerQuery.data.data?.user;

  return {
    viewerQuery,
    viewer: {
      user,
      session: viewerQuery.data.data?.session,
    },
    isAdmin: isAdminUser(user),
    logoutMutation,
  } as const;
}
