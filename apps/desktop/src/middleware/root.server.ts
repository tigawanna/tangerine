import { createMiddleware } from "@tanstack/react-start";
import { preferIpv4ForHubFetches } from "@repo/gemma-embedding/prefer-ipv4";
import { evlogErrorHandler } from "evlog/nitro/v3";

// Broken IPv6 RA on some Linux Wi‑Fi stacks breaks undici → HF CDN (ETIMEDOUT).
preferIpv4ForHubFetches();

export const evlogRootMiddleware = createMiddleware().server(evlogErrorHandler);

export const rootServerMiddleware = [evlogRootMiddleware] as const;
