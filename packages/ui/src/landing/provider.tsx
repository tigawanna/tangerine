import type { QueryKey } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";
import type { ContactFormValues } from "./sections/contact/contact-schema";

/**
 * Minimal query-options shape the landing package reads.
 * Host apps pass full `queryOptions(...)` objects — pick fields at the app boundary.
 *
 * Uses TanStack `QueryKey` (not `readonly unknown[]`) so host `Register` queryKey
 * augmentations still type-check when the package source is checked through the app.
 */
export type LandingQueryOptions = {
  queryKey: QueryKey;
  /** Host staleTime may be a number or TanStack stale-time function. */
  staleTime?: unknown;
  /** Present on host `queryOptions(...)`; typed loosely so arity stays host-owned. */
  queryFn?: unknown;
};

export type LandingRuntime = {
  /** App-owned query options — package calls useQuery against the caller's QueryClient. */
  pinnedReposQueryOptions: LandingQueryOptions;
  recentReposQueryOptions: LandingQueryOptions;
  /** App-owned contact sender (server fn / API). */
  sendContactMessage: (values: ContactFormValues) => Promise<{ success: true }>;
};

const LandingRuntimeContext = createContext<LandingRuntime | null>(null);

/**
 * Provides app-owned data adapters to the shared landing package.
 * QueryClient itself stays in the host app — do not wrap one here.
 */
export function LandingProvider({
  value,
  children,
}: {
  value: LandingRuntime;
  children: ReactNode;
}) {
  return <LandingRuntimeContext.Provider value={value}>{children}</LandingRuntimeContext.Provider>;
}

/**
 * Reads the host app's landing adapters.
 */
export function useLandingRuntime() {
  const value = useContext(LandingRuntimeContext);
  if (!value) {
    throw new Error("useLandingRuntime must be used within LandingProvider");
  }
  return value;
}

/**
 * Adapts a host queryFn (unknown arity) into a zero-arg async fn for useQuery.
 */
export function adaptLandingQueryFn(queryFn: unknown) {
  if (typeof queryFn !== "function") {
    return undefined;
  }

  return async () => Reflect.apply(queryFn, undefined, []);
}

/**
 * Narrows host staleTime to a number when possible for useQuery.
 */
export function adaptLandingStaleTime(staleTime: unknown) {
  return typeof staleTime === "number" ? staleTime : undefined;
}
