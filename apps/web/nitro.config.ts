import { defineConfig } from "nitro";
import evlog from "evlog/nitro/v3";

export default defineConfig({
  /**
   * libsql uses dynamic `require('@libsql/<platform>')` for local file DB.
   * Force-trace native bindings so Vercel serverless functions can load them when needed.
   */
  traceDeps: ["@libsql/linux-x64-gnu", "@libsql/linux-x64-musl"],
  experimental: {
    asyncContext: true,
  },
  plugins: ["./server/plugins/evlog-fs-drain.ts"],
  modules: [
    evlog({
      env: { service: "tigawanna-site" },
      enabled: process.env.NODE_ENV !== "production",
    }),
  ],
});
