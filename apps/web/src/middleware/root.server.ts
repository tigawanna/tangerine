import { createMiddleware } from "@tanstack/react-start";
import { evlogErrorHandler } from "evlog/nitro/v3";

export const evlogRootMiddleware = createMiddleware().server(evlogErrorHandler);

export const rootServerMiddleware = [evlogRootMiddleware] as const;
