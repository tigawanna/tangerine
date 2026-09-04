import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

/**
 * TanStack Start global config. When this file exists, CSRF protection for
 * server functions must be registered explicitly (Start no longer auto-installs it).
 */
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware],
}));
