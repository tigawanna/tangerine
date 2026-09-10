import { authClient, type BetterAuthSession } from "@/lib/auth-client";

export type Session = BetterAuthSession;

/**
 * Current session from apps/api (dishi-style: client → remote Better Auth).
 * No local `/api/auth` mount on web.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data } = await authClient.getSession();
    return data ?? null;
  } catch {
    return null;
  }
}
