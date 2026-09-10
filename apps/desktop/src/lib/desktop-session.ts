import { authClient, type BetterAuthSession } from "@/lib/auth-client";
import {
  hasDesktopBindings,
  type DesktopAuthUser,
} from "@/lib/desktop-bindings";
import { useEffect, useState } from "react";

type SessionUser = BetterAuthSession["user"] | DesktopAuthUser;

/**
 * Session user for the sidebar: Deno Desktop bindings when present, else Better Auth React client.
 */
export function useDesktopOrBrowserUser(): {
  user: SessionUser | null | undefined;
  isPending: boolean;
} {
  const browserSession = authClient.useSession();
  const [desktopUser, setDesktopUser] = useState<DesktopAuthUser | null | undefined>(undefined);
  const isDesktop = hasDesktopBindings();

  useEffect(() => {
    if (!isDesktop || !globalThis.bindings) {
      setDesktopUser(undefined);
      return;
    }

    let cancelled = false;
    void globalThis.bindings.getSession().then((session) => {
      if (!cancelled) setDesktopUser(session?.user ?? null);
    });

    const onAuthenticated = (event: Event) => {
      const user = (event as CustomEvent<DesktopAuthUser>).detail;
      setDesktopUser(user ?? null);
    };
    window.addEventListener("tangerine:authenticated", onAuthenticated);
    return () => {
      cancelled = true;
      window.removeEventListener("tangerine:authenticated", onAuthenticated);
    };
  }, [isDesktop]);

  if (isDesktop) {
    return {
      user: desktopUser === undefined ? undefined : desktopUser,
      isPending: desktopUser === undefined,
    };
  }

  return {
    user: browserSession.data?.user,
    isPending: browserSession.isPending,
  };
}

export async function desktopOrBrowserSignOut(): Promise<void> {
  if (hasDesktopBindings() && globalThis.bindings?.signOut) {
    await globalThis.bindings.signOut();
    return;
  }
  await authClient.signOut();
}
