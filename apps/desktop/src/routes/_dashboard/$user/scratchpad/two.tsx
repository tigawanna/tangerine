import { Button } from "@/components/ui/button.tsx";
import { getClientGithubAccessToken } from "@/lib/relay/github-access-token";
import { createGitHubClient } from "@repo/github";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Loader } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/_dashboard/$user/scratchpad/two")({
  component: RouteComponent,
});

/**
 * Scratchpad: pass the OAuth token in and use it directly.
 * Do not rely on rememberGithubTokenForWorkers — server-fn split can duplicate
 * that module, so getGithubToken() never sees the seeded value.
 */
const testFn = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(1), login: z.string().min(1) }))
  .handler(async ({ data }) => {
    const client = createGitHubClient(data.token);
    const viewer = await client.getViewer();
    const page = await client.getUserStarredReposMinimal({
      login: data.login,
      first: 100,
    });

    if (!page) {
      return {
        ok: false as const,
        viewer: viewer.login,
        reason: "user/starredRepositories was null (bad login or GraphQL returned no user)",
        login: data.login,
      };
    }

    return {
      ok: true as const,
      viewer: viewer.login,
      login: data.login,
      totalCount: page.totalCount,
      repos: page.edges.length,
      sample: page.edges.slice(0, 5).map((e) => ({
        name: e.node.name,
        owner: e.node.owner.login,
        description: e.node.description,
        homepageUrl: e.node.homepageUrl,
        tags: e.node.tags,
      })),
      hasNextPage: page.pageInfo.hasNextPage,
    };
  });

function RouteComponent() {
  const { mutate, data, error, isPending, isError } = useMutation({
    mutationFn: async () => {
      const token = await getClientGithubAccessToken();
      return testFn({ data: { token, login: "tigawanna" } });
    },
  });

  return (
    <div className="min-h-screen w-full h-full flex flex-col gap-2">
      <div className="flex flex-col h-full gap-6">
        <h1 className="text-2xl font-bold">Test</h1>
        {isPending && <Loader className="animate-spin" />}
        {isError && (
          <pre className="text-destructive whitespace-pre-wrap">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        )}
        {data && <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>}
        <Button data-test="scratchpad-starred-test" onClick={() => mutate()}>
          Test
        </Button>
      </div>
    </div>
  );
}
