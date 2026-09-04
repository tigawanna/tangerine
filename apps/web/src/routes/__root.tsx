import { rootServerMiddleware } from "@/middleware/root.server";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";

import appCss from "../styles.css?url";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TanstackDevtools } from "@/lib/tanstack/devtools/devtools";
import { ThemeProvider } from "@/lib/tanstack/router/theme-provider";
import { AppConfig } from "@/utils/system";
import type { QueryClient } from "@tanstack/react-query";
import { z } from "zod";

interface MyRouterContext {
  queryClient: QueryClient;
}

const searchparams = z.object({
  globalPage: z.number().optional(),
  globalSearch: z.string().optional(),
});

export const Route = createRootRouteWithContext<MyRouterContext>()({
  server: {
    middleware: [...rootServerMiddleware],
  },

  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: AppConfig.seo.title },
      { name: "description", content: AppConfig.seo.description },
      { name: "keywords", content: AppConfig.seo.keywords },
      { name: "author", content: AppConfig.name },
      { name: "robots", content: "index, follow" },
      { property: "og:site_name", content: AppConfig.name },
      { property: "og:title", content: AppConfig.seo.title },
      { property: "og:description", content: AppConfig.seo.description },
      { property: "og:url", content: AppConfig.links.website },
      { property: "og:type", content: "website" },
      {
        property: "og:image",
        content: AppConfig.absoluteAsset(AppConfig.assets.ogImage),
      },
      { property: "og:image:alt", content: AppConfig.seo.ogImageAlt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@tigawanna" },
      { name: "twitter:creator", content: "@tigawanna" },
      { name: "twitter:title", content: AppConfig.seo.title },
      { name: "twitter:description", content: AppConfig.seo.description },
      {
        name: "twitter:image",
        content: AppConfig.absoluteAsset(AppConfig.assets.ogImage),
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: AppConfig.assets.iconSvg, type: "image/svg+xml" },
      { rel: "icon", href: AppConfig.assets.favicon, sizes: "48x48", type: "image/x-icon" },
      {
        rel: "icon",
        href: "/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        rel: "apple-touch-icon",
        href: AppConfig.assets.appleTouchIcon,
        sizes: "180x180",
      },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "alternate", type: "text/markdown", href: "/llms.txt", title: "LLMs" },
    ],
  }),
  validateSearch: (search) => searchparams.parse(search),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="wanna" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider storageKey={AppConfig.themeStorageKey} defaultTheme="dark">
          <TooltipProvider>
            {children}
            <TanstackDevtools />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
