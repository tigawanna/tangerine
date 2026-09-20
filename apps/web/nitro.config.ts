import { defineConfig } from "nitro";
import evlog from "evlog/nitro/v3";

const isVercel = Boolean(process.env.VERCEL);
const isProd = process.env.NODE_ENV === "production";

/** Upstream Hono API — auth cookies must be set on the web origin via this proxy. */
const apiOrigin = (process.env.VITE_API_URL ?? "http://localhost:5000").replace(/\/$/, "");

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
  /**
   * Same-origin `/api/*` → apps/api so Better Auth Set-Cookie is first-party
   * (cross-host `*.vercel.app` cannot share cookies).
   */
  routeRules: {
    "/api/**": { proxy: `${apiOrigin}/api/**` },
  },
  devProxy: {
    "/api": { target: apiOrigin, changeOrigin: true },
  },
  /** Local FS drains are not available on Vercel Functions. */
  plugins: isVercel || isProd ? [] : ["./src/lib/evlog/fs-drain.ts"],
  modules: [
    evlog({
      env: { service: "tangerine-web" },
      enabled: !isProd,
    }),
  ],
});
