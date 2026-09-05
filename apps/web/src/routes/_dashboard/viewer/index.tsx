import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Entry for "me" — resolves login from dashboard auth context and
 * redirects into the shared `/$user` Relay preload route.
 */
export const Route = createFileRoute("/_dashboard/viewer/")({
  beforeLoad: ({ context }) => {
    const login = context.githubLogin;
    if (!login) {
      throw new Error("githubLogin missing on /_dashboard context");
    }
    throw redirect({
      to: "/$user",
      params: { user: login },
      replace: true,
    });
  },
});
