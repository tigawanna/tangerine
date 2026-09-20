/* eslint-disable node/no-process-env */
import { authEnvSchema } from "@repo/auth";
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import path from "node:path";
import { z } from "zod";

expand(
  config({
    path: path.resolve(process.cwd(), process.env.NODE_ENV === "test" ? ".env.test" : ".env"),
  }),
);

const EnvSchema = authEnvSchema
  .extend({
    NODE_ENV: z.string().default("development"),
    PORT: z.coerce.number().default(5000),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    DB_LOG_LEVEL: z.enum(["info", "silent"]).default("info"),
    /** Turso / libsql URL (`libsql://…` or `file:local.db`). */
    DATABASE_URL: z.string().min(1),
    DATABASE_AUTH_TOKEN: z.string().optional(),
    FRONTEND_URL: z.url().optional(),
    CRUD_BEARER_TOKEN: z.string().optional(),
  })
  .transform((env) => ({
    ...env,
    DATABASE_URL: env.DATABASE_URL.trim(),
    DATABASE_AUTH_TOKEN: env.DATABASE_AUTH_TOKEN?.trim() || undefined,
    BETTER_AUTH_TRUSTED_ORIGINS_LIST: env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  }));

export type env = z.infer<typeof EnvSchema>;

const { data: env, error } = EnvSchema.safeParse(process.env);

if (error) {
  console.error("❌ Invalid env:");
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const envVariables = env;

export const isProductionEnv = envVariables.NODE_ENV === "production";

export const AUTHORIZED_ORIGINS = [
  ...new Set(
    [
      ...envVariables.BETTER_AUTH_TRUSTED_ORIGINS_LIST,
      envVariables.FRONTEND_URL,
      envVariables.BETTER_AUTH_URL,
    ].filter((origin): origin is string => Boolean(origin)),
  ),
];
