export const ROLE = {
  admin: "admin",
  user: "user",
} as const;

export type AppRole = keyof typeof ROLE;

type ViewerUser = { role?: string | null; email?: string | null } | undefined;

/**
 * Parses a `user.role` string into the highest matching app role.
 */
export function parseAppRole(rawRole: string | null | undefined): AppRole {
  if (rawRole?.split(",").some((part) => part.trim().toLowerCase() === ROLE.admin)) {
    return ROLE.admin;
  }
  return ROLE.user;
}

/** Returns the viewer's app role, defaulting to `user`. */
export function getUserAppRole(user: ViewerUser): AppRole {
  return parseAppRole(user?.role);
}

export function hasAppRole(role: AppRole, allowed: readonly AppRole[]): boolean {
  return allowed.includes(role);
}

export function isAdminRole(role: AppRole): boolean {
  return role === ROLE.admin;
}
