import { authClient, type BetterAuthSession } from "@/lib/auth-client";

export type Session = BetterAuthSession;

/**
 * Current session via same-origin `/api/auth` (proxied to apps/api).
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data } = await authClient.getSession();
    return data ?? null;
  } catch {
    return null;
  }
}
