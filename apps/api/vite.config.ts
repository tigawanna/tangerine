import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite-plus";

const apiRoot = fileURLToPath(new URL(".", import.meta.url));
const boaRoot = join(apiRoot, ".vercel/output");
const funcDir = join(boaRoot, "functions/index.func");

/**
 * Vercel Build Output API v3 files that tsdown does not emit on its own.
 * @see https://vercel.com/docs/build-output-api/v3/primitives#serverless-function
 */
function writeBuildOutputApi(handler: string) {
  mkdirSync(join(boaRoot, "static"), { recursive: true });
  writeFileSync(join(funcDir, "package.json"), `${JSON.stringify({ type: "module" }, null, 2)}\n`);
  writeFileSync(
    join(funcDir, ".vc-config.json"),
    `${JSON.stringify(
      {
        runtime: "nodejs22.x",
        handler,
        launcherType: "Nodejs",
        // Helpers parse `req.body` and consume the stream. Better Auth then
        // hangs forever on `request.json()` for POST /api/auth/* (300s timeout,
        // UI stuck on "Redirecting…"). GET still worked because it has no body.
        shouldAddHelpers: false,
        shouldAddSourcemapSupport: true,
        supportsResponseStreaming: true,
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(boaRoot, "config.json"),
    `${JSON.stringify(
      {
        version: 3,
        routes: [{ handle: "filesystem" }, { src: "/(.*)", dest: "/index" }],
      },
      null,
      2,
    )}\n`,
  );
}

/**
 * Single Node ESM function via Vite+ `vp pack` (tsdown / Rolldown).
 * Vercel’s Hono preset transpiles files one-by-one and leaves `@api/*` /
 * workspace `.ts` imports broken (vercel/vercel#14910).
 *
 * Pack aliases `@libsql/client` to the Web-standard client so the function
 * stays a JS-only bundle (Turso `libsql://` / `https:`). Local `file:` DBs
 * still use the Node client through `tsx` / `src/index.ts`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@api": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  pack: {
    entry: {
      index: "src/vercel-entry.ts",
    },
    platform: "node",
    format: ["esm"],
    outDir: ".vercel/output/functions/index.func",
    dts: false,
    sourcemap: true,
    clean: true,
    nodeProtocol: true,
    alias: {
      "@libsql/client": "@libsql/client/web",
    },
    deps: {
      alwaysBundle: () => true,
      onlyBundle: false,
    },
    outputOptions: {
      codeSplitting: false,
    },
    hooks: {
      "build:done": () => {
        const handler = readdirSync(funcDir).find(
          (name) => /\.(mjs|js)$/.test(name) && !name.endsWith(".map"),
        );
        writeBuildOutputApi(handler ?? "index.js");
      },
    },
  },
});
