import type { RepoEmbedJob } from "@/server/elysia/routes/embed/helpers/repo-worker.ts";

type StarredPageEdge = {
  node: {
    id: string;
    name: string;
    description?: string | null;
    url: string;
    owner: { login: string };
    languages?: {
      edges?: Array<{ node?: { name?: string | null } | null } | null> | null;
    } | null;
  };
};

/** Conveyor dedup key for a list-page cursor (or the first page). */
export function listDedupKey(login: string, after: string | null): string {
  return `repo-embed-list:${login}:${after ?? "start"}`;
}

/** Maps a starred GraphQL page into per-repo embed job payloads. */
export function mapStarredNodesToJobs(edges: StarredPageEdge[]): RepoEmbedJob[] {
  return edges.map(({ node }) => {
    const languages = (node.languages?.edges ?? [])
      .map((edge) => edge?.node?.name)
      .filter((name): name is string => Boolean(name));

    return {
      repoId: node.id,
      owner: node.owner.login,
      name: node.name,
      description: node.description ?? null,
      url: node.url,
      languages,
    } satisfies RepoEmbedJob;
  });
}
