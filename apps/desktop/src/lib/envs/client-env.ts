import { z } from "zod";

const clientEnvSchema = z.object({
  VITE_APP_URL: z.url(),
  VITE_API_URL: z.url(),
});

export const clientEnv = clientEnvSchema.parse({
  VITE_APP_URL: import.meta.env.VITE_APP_URL,
  VITE_API_URL: import.meta.env.VITE_API_URL,
});
