import { getAuth } from "@/lib/auth.server";
import { getUserAppRole, hasAppRole, type AppRole } from "@repo/auth";
import { getRequestHeaders } from "@tanstack/react-start/server";

/** Reads the session and throws unless the viewer's role is in `allowed`. */
export async function requireSessionRoles(allowed: readonly AppRole[]) {
  const headers = getRequestHeaders();
  const session = await getAuth().api.getSession({ headers });

  if (!session?.user) {
    throw new Error("You must be signed in.");
  }

  const role = getUserAppRole(session.user);
  if (!hasAppRole(role, allowed)) {
    throw new Error("You do not have permission to perform this action.");
  }

  return { session, role };
}

/** Reads the session and throws unless the viewer is signed in. */
export async function requireSession() {
  const headers = getRequestHeaders();
  const session = await getAuth().api.getSession({ headers });

  if (!session?.user) {
    throw new Error("You must be signed in.");
  }

  return session;
}
