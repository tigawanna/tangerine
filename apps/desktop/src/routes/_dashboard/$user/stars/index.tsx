import { createFileRoute, redirect } from "@tanstack/react-router";
import { defaultUserSearch } from "../layout";

/**
 * Legacy `/stars` path — send into the profile Starred tab.
 */
export const Route = createFileRoute("/_dashboard/$user/stars/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$user",
      params: { user: params.user },
      search: { ...defaultUserSearch, tab: "starred" },
      replace: true,
    });
  },
});
