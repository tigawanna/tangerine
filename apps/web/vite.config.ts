import babel from "@rolldown/plugin-babel";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite-plus";

import tailwindcss from "@tailwindcss/vite";
import evlog from "evlog/vite";

const config = defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  server: {
    host: true,
  },
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "@tanstack/react-query",
      "@tanstack/react-router",
      "react-relay",
      "relay-runtime",
    ],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    devtools(),
    evlog({ service: "github", sourceLocation: "dev" }),
    tanstackStart({
      router: {
        routeToken: "layout",
        routeFileIgnorePattern:"__generated__/*",
      },
      // sitemap: {
      //   enabled: true,
      //   host: "https://www.tigawanna.vip",
      // },
      // prerender: {
      //   enabled: true,
      //   autoSubfolderIndex: true,
      //   autoStaticPathsDiscovery: true,
      //   crawlLinks: true,
      //   concurrency: 14,
      //   retryCount: 2,
      //   retryDelay: 1000,
      //   maxRedirects: 5,
      //   failOnError: true,
      //   // Skip OG image endpoint if crawled
      //   filter: ({ path }) => !path.startsWith("/og"),
      // },
    }),
    nitro(),
    tailwindcss(),
    viteReact(),
    babel({ plugins: ["relay"] }),
  ],
});

export default config;
