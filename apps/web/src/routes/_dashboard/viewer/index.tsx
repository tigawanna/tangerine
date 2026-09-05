import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Post-login entry: send the signed-in user to `/$user` with their GitHub login.
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
