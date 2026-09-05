import { UserInfo } from "./UserInfo";
import { userQuery } from "../../layout";
import type { layoutUserPageLoaderQuery } from "../../__generated__/layoutUserPageLoaderQuery.graphql";
import { getRouteApi } from "@tanstack/react-router";
import { usePreloadedQuery } from "react-relay";

const userRoute = getRouteApi("/_dashboard/$user");

export function UserPage() {
  const queryRef = userRoute.useLoaderData();
  const query = usePreloadedQuery<layoutUserPageLoaderQuery>(userQuery, queryRef);

  if (!query.user) {
    return (
      <div
        className="border-error/30 bg-error/10 text-base-content rounded-xl border p-4"
        data-test="user-not-found"
      >
        <p className="font-medium">User not found</p>
        <p className="text-base-content/70 mt-1 text-sm">
          GitHub returned no profile for this login.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-test="user-page">
      <UserInfo user={query.user} />
    </div>
  );
}
