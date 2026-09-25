import { Button } from "@/components/ui/button.tsx";
import { getClientGithubAccessToken } from "@/lib/relay/github-access-token";
import {
  enqueueStarredFn,
  getRepoEmbedQueueStatusFn,
} from "./two.functions.ts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader } from "lucide-react";

/** Display-only — keep the queue string here so the route stays client-safe. */
const REPO_EMBED_QUEUE = "repo-embed";

export const Route = createFileRoute("/_dashboard/$user/scratchpad/two")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user: login } = Route.useParams();

  const enqueue = useMutation({
    mutationFn: async (pages?: number) => {
      const token = await getClientGithubAccessToken();
      return enqueueStarredFn({ data: { token, login, pages } });
    },
  });

  const queueStatus = useQuery({
    queryKey: ["scratchpad", "repo-embed-queue"],
    queryFn: () => getRepoEmbedQueueStatusFn(),
    refetchInterval: 5_000,
  });

  return (
    <div className="min-h-screen w-full h-full flex flex-col gap-2">
      <div className="flex flex-col h-full gap-6">
        <h1 className="text-2xl font-bold">Starred enqueue scratchpad</h1>
        <p className="text-sm text-muted-foreground">
          Enqueue starred repos for <code>{login}</code>, then watch{" "}
          <code>{REPO_EMBED_QUEUE}</code> grow (polls every 5s).
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            data-test="scratchpad-enqueue-1-page"
            disabled={enqueue.isPending}
            onClick={() => enqueue.mutate(1)}
          >
            Enqueue 1 page
          </Button>
          <Button
            data-test="scratchpad-enqueue-2-pages"
            disabled={enqueue.isPending}
            variant="secondary"
            onClick={() => enqueue.mutate(2)}
          >
            Enqueue 2 pages
          </Button>
          <Button
            data-test="scratchpad-enqueue-all"
            disabled={enqueue.isPending}
            variant="outline"
            onClick={() => enqueue.mutate(undefined)}
          >
            Enqueue all
          </Button>
        </div>

        {enqueue.isPending && <Loader className="animate-spin" />}
        {enqueue.isError && (
          <pre className="text-destructive whitespace-pre-wrap">
            {enqueue.error instanceof Error ? enqueue.error.message : String(enqueue.error)}
          </pre>
        )}
        {enqueue.data && (
          <pre className="whitespace-pre-wrap rounded-md border p-3 text-sm">
            {JSON.stringify(enqueue.data, null, 2)}
          </pre>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Queue status</h2>
            {queueStatus.isFetching && <Loader className="size-4 animate-spin" />}
          </div>
          {queueStatus.isError && (
            <pre className="text-destructive whitespace-pre-wrap">
              {queueStatus.error instanceof Error
                ? queueStatus.error.message
                : String(queueStatus.error)}
            </pre>
          )}
          {queueStatus.data && (
            <pre className="whitespace-pre-wrap rounded-md border p-3 text-sm">
              {JSON.stringify(queueStatus.data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
