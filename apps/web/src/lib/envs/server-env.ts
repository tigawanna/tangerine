import { authEnvSchema, type AuthEnv } from "@repo/auth";

export type ServerEnv = AuthEnv;

export const serverEnv = authEnvSchema.parse(process.env);
