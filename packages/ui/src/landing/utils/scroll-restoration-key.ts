import type { ParsedLocation } from "@tanstack/react-router";

/**
 * Unique per page load. Because it changes on every full reload but stays
 * stable for the lifetime of a single JS session, the landing route restores
 * scroll for in-session back/forward navigation yet always starts at the top
 * on reload instead of jumping to a previously cached mid-page position.
 */
const LANDING_SESSION_KEY = `landing-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Provides the key TanStack Router uses to save/restore scroll positions.
 *
 * The landing page ("/") uses a per-session key so a reload never restores a
 * stale scroll offset (e.g. landing mid-page on the "Teams" panel). Every other
 * route keys by pathname so their scroll is restored normally.
 */
export function getScrollRestorationKey(location: ParsedLocation) {
  if (location.pathname === "/") {
    return LANDING_SESSION_KEY;
  }
  return location.pathname;
}
