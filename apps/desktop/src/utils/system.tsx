import { AppBrandIcon } from "@/components/icon/AppBrandIcon";
import { clientEnv } from "@/lib/envs/client-env";

const appName = "Tangerine";
const appBrief = "Local-first GitHub browsing";
const appDescription =
  "Tangerine is a local-first dashboard for faster navigation through your GitHub repositories and stars.";
const seoKeywords =
  "tangerine, github, repositories, stars, dashboard, local-first, tigawanna, open source";

const assets = {
  favicon: "/favicon.ico",
  appleTouchIcon: "/apple-touch-icon.png",
  icon: "/icon.png",
  iconSvg: "/icon.svg",
  ogImage: "/opengraph-image.jpg",
  ogImageAlt: "Tangerine GitHub dashboard preview",
} as const;

const links = {
  github: "https://github.com/tigawanna",
  email: "denniskinuthiawaweru@gmail.com",
  emailTo: "mailto:denniskinuthiawaweru@gmail.com",
  website: clientEnv.VITE_APP_URL,
} as const;

/**
 * Resolves a site asset path against this app's configured origin.
 */
function absoluteAsset(path: string) {
  return `${clientEnv.VITE_APP_URL}${path}`;
}

export const AppConfig = {
  name: appName,
  brief: appBrief,
  description: appDescription,
  icon: AppBrandIcon,
  logo: {
    src: assets.ogImage,
    alt: assets.ogImageAlt,
    href: "/",
  },
  themeStorageKey: "tigawanna.tangerine.theme",
  links,
  navItems: [
    { label: "Dashboard", href: "/viewer" },
  ],
  assets,
  absoluteAsset,
  seo: {
    title: `${appName} | local-first GitHub browsing`,
    description: appDescription,
    keywords: seoKeywords,
    ogImageAlt: assets.ogImageAlt,
  },
} as const;
