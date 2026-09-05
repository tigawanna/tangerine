import { betterAuth, type BetterAuthPlugin } from "better-auth";
import type { GithubProfile } from "better-auth/social-providers";
import type { AuthEnv } from "./env";
import { DEFAULT_GITHUB_SCOPES } from "./env";
import { ROLE } from "./roles";

export type CreateAuthOptions = {
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  github: {
    clientId: string;
    clientSecret: string;
    /** OAuth scopes. Defaults to `read:user user:email repo read:org`. */
    scope?: string[];
  };
  adminEmail?: string;
  /** Extra plugins. TanStack Start must pass `tanstackStartCookies()` last. */
  plugins?: BetterAuthPlugin[];
};

/**
 * Shared Better Auth factory — GitHub OAuth only, no database.
 *
 * Better Auth stores the session and GitHub account in signed cookies
 * (`storeAccountCookie`) when `database` is omitted.
 */
export function createAuth(options: CreateAuthOptions) {
  const { secret, baseURL, trustedOrigins, github, adminEmail, plugins = [] } = options;

  return betterAuth({
    secret,
    baseURL,
    basePath: "/api/auth",
    trustedOrigins,
    user: {
      additionalFields: {
        githubUsername: {
          type: "string",
          required: false,
          input: false,
        },
        role: {
          type: "string",
          required: false,
          input: false,
          defaultValue: ROLE.user,
        },
      },
    },
    socialProviders: {
      github: {
        clientId: github.clientId,
        clientSecret: github.clientSecret,
        scope: github.scope ?? [...DEFAULT_GITHUB_SCOPES],
        mapProfileToUser: (profile: GithubProfile) => ({
          githubUsername: profile.login,
          role: adminEmail && profile.email === adminEmail ? ROLE.admin : ROLE.user,
        }),
      },
    },
    plugins,
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["x-real-ip", "x-forwarded-for"],
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

/**
 * Builds auth from parsed env. Pass framework plugins (TanStack Start cookies)
 * as the second argument so they stay last in the plugin list.
 */
export function createAuthFromEnv(env: AuthEnv, plugins: BetterAuthPlugin[] = []) {
  return createAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS.split(","),
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    adminEmail: env.ADMIN_EMAIL,
    plugins,
  });
}
