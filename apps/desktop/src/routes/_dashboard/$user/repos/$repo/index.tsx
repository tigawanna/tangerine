import { createFileRoute } from "@tanstack/react-router";
import { loadQuery } from "react-relay";
import { z } from "zod";
import {
  RepoDetailPage,
  repoDetailPageQuery,
} from "./-components/RepoDetailPage";
import type { RepoDetailPageQuery } from "./-components/__generated__/RepoDetailPageQuery.graphql";

const repoSearchSchema = z.object({
  tab: z.enum(["readme", "branches"]).optional(),
});

export const Route = createFileRoute("/_dashboard/$user/repos/$repo/")({
  validateSearch: (search) => repoSearchSchema.parse(search),
  loader: ({ context, params }) =>
    loadQuery<RepoDetailPageQuery>(
      context.relayEnvironment!,
      repoDetailPageQuery,
      { owner: params.user, name: params.repo },
      { fetchPolicy: "store-or-network" },
    ),
  component: RepoDetailRoute,
});

function RepoDetailRoute() {
  const queryRef = Route.useLoaderData();
  return <RepoDetailPage queryRef={queryRef} />;
}
