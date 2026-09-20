import { defineConfig } from "nitro";
import evlog from "evlog/nitro/v3";

const isVercel = Boolean(process.env.VERCEL);

export default defineConfig({
  /**
   * Vercel sets `VERCEL=1` during build/runtime. Explicit preset keeps the
   * Build Output API layout stable for TanStack Start + Nitro.
   */
  preset: isVercel ? "vercel" : undefined,
  experimental: {
    asyncContext: true,
  },
  /** Desktop can always write local NDJSON — shared monorepo `.evlog/logs/`. */
  plugins: ["./src/lib/evlog/fs-drain.ts"],
  modules: [
    evlog({
      env: { service: "tangerine-desktop" },
      enabled: true,
    }),
  ],
});
