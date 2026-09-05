import { createFileRoute, redirect } from "@tanstack/react-router";
import { defaultUserSearch } from "../layout";

/**
 * Legacy `/repos` path — send into the profile Repos tab.
 */
export const Route = createFileRoute("/_dashboard/$user/repos/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$user",
      params: { user: params.user },
      search: defaultUserSearch,
      replace: true,
    });
  },
});
