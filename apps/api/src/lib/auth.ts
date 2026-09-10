import { apiKey } from "@better-auth/api-key";
import { electron } from "@better-auth/electron";
import {
  DEFAULT_GITHUB_SCOPES,
  ELECTRON_TRUSTED_ORIGIN,
  ROLE,
} from "@repo/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { GithubProfile } from "better-auth/social-providers";
import { admin, bearer, openAPI } from "better-auth/plugins";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { AUTHORIZED_ORIGINS, envVariables } from "../env";

/**
 * Builds the Hono API Better Auth instance — GitHub OAuth + Turso, no email/password.
 * Shared env/roles/AC come from `@repo/auth`; plugins and DB stay app-specific.
 */
function createApiAuth() {
  return betterAuth({
    appName: "Tangerine",
    secret: envVariables.BETTER_AUTH_SECRET,
    baseURL: envVariables.BETTER_AUTH_URL,
    basePath: "/api/auth",
    trustedOrigins: [...AUTHORIZED_ORIGINS, ELECTRON_TRUSTED_ORIGIN],
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        apikey: schema.apikey,
      },
    }),
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
        clientId: envVariables.GITHUB_CLIENT_ID,
        clientSecret: envVariables.GITHUB_CLIENT_SECRET,
        scope: [...DEFAULT_GITHUB_SCOPES],
        mapProfileToUser: (profile: GithubProfile) => ({
          githubUsername: profile.login,
          role:
            envVariables.ADMIN_EMAIL && profile.email === envVariables.ADMIN_EMAIL
              ? ROLE.admin
              : ROLE.user,
        }),
      },
    },
    plugins: [
      openAPI(),
      electron(),
      apiKey({
        defaultPrefix: "tng_",
        apiKeyHeaders: ["x-api-key", "authorization"],
        requireName: true,
        enableMetadata: true,
      }),
      bearer(),
      admin({
        defaultRole: ROLE.user,
      }),
    ],
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
    experimental: {
      joins: true,
    },
  });
}

export type Auth = ReturnType<typeof createApiAuth>;

/** Hono API Better Auth singleton. */
export const auth: Auth = createApiAuth();
