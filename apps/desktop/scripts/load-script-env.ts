import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

config({ path: resolve(rootDir, ".env") });
config({ path: resolve(rootDir, ".env.local"), override: true });

const scriptEnvSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    DATABASE_AUTH_TOKEN: z.string().optional(),
    GH_PAT: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1).optional(),
    OPENROUTER_API_KEY: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.OPENAI_API_KEY || value.OPENROUTER_API_KEY), {
    message: "OPENAI_API_KEY or OPENROUTER_API_KEY is required",
    path: ["OPENAI_API_KEY"],
  });

export const scriptEnv = scriptEnvSchema.parse(process.env);
