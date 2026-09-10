import { defineConfig } from "nitro";
import evlog from "evlog/nitro/v3";

const isVercel = Boolean(process.env.VERCEL);
const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  /**
   * Vercel sets `VERCEL=1` during build/runtime. Explicit preset keeps the
   * Build Output API layout stable for TanStack Start + Nitro.
   */
  preset: isVercel ? "vercel" : undefined,
  /**
   * libsql uses dynamic `require('@libsql/<platform>')` for local file DB.
   * Force-trace native bindings so Vercel serverless functions can load them when needed.
   */
  traceDeps: ["@libsql/linux-x64-gnu", "@libsql/linux-x64-musl"],
  experimental: {
    asyncContext: true,
  },
  /** Local FS drains are not available on Vercel Functions. */
  plugins: isVercel || isProd ? [] : ["./server/plugins/evlog-fs-drain.ts"],
  modules: [
    evlog({
      env: { service: "tangerine" },
      enabled: !isProd,
    }),
  ],
});
