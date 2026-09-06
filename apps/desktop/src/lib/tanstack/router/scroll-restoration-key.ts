import type { ParsedLocation } from "@tanstack/react-router";

/**
 * Cache scroll positions by pathname so hash changes on the landing page
 * do not create separate restoration entries or override restored scroll.
 */
export function getScrollRestorationKey(location: ParsedLocation) {
  return location.pathname;
}
