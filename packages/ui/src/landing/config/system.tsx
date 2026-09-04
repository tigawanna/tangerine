import {
  siteConfig,
  siteSeoDescription,
  siteSeoKeywords,
  siteSeoOgImageAlt,
  siteSeoTitle,
} from "@repo/site-constants";
import { Code2 } from "lucide-react";

/**
 * Resolves a site asset path against the configured website origin.
 */
function absoluteAsset(path: string) {
  return `${siteConfig.links.website}${path}`;
}

export const AppConfig = {
  name: siteConfig.name,
  brand: siteConfig.brand,
  brief: siteConfig.role,
  description: siteConfig.description,
  locationLabel: siteConfig.locationLabel,
  location: siteConfig.location,
  tagline: siteConfig.tagline,
  contactBlurb: siteConfig.contactBlurb,
  icon: Code2,
  logo: {
    src: siteConfig.assets.ogImage,
    alt: siteSeoOgImageAlt,
    href: "/",
  },
  themeStorageKey: `${siteConfig.brand}.theme`,
  links: siteConfig.links,
  navItems: siteConfig.navItems,
  contactHeading: siteConfig.contactHeading,
  techSkills: siteConfig.techSkills,
  assets: siteConfig.assets,
  absoluteAsset,
  seo: {
    title: siteSeoTitle,
    description: siteSeoDescription,
    keywords: siteSeoKeywords,
    ogImageAlt: siteSeoOgImageAlt,
  },
};
