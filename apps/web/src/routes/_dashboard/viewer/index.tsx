import { githubViewerQueryOptions } from "@/data-access-layer/github/viewer-query-options";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_dashboard/viewer/")({
  loader: async ({ context }) => {
    await context.queryClient.query({ ...githubViewerQueryOptions, staleTime: "static" });
  },
  component: ViewerPage,
});

function ViewerPage() {
  const { data } = useSuspenseQuery(githubViewerQueryOptions);
  const viewer = data.data;
  const error = data.error;

  if (error || !viewer) {
    return (
      <div
        className="border-error/30 bg-error/10 text-base-content flex items-start gap-3 rounded-xl border p-4"
        data-test="viewer-error"
      >
        <AlertCircle className="text-error mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium">Could not load your GitHub profile</p>
          <p className="text-base-content/70 mt-1 text-sm">
            {error ?? "No viewer data returned from GitHub."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-test="viewer-page">
      <section className="space-y-3">
        <p className="text-base-content/60 text-sm tracking-[0.24em] uppercase">Dashboard</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {viewer.name ?? viewer.login}
        </h1>
        <p className="text-base-content/70 max-w-2xl text-base leading-7">
          Signed in as @{viewer.login}. Jump to repos and stars from the sidebar.
        </p>
      </section>

      <div className="flex items-center gap-4">
        <img
          src={viewer.avatarUrl}
          alt=""
          className="border-base-300 size-16 rounded-full border"
          data-test="viewer-avatar"
        />
        <div>
          <p className="text-lg font-semibold">{viewer.name ?? viewer.login}</p>
          <p className="text-base-content/60 text-sm">@{viewer.login}</p>
        </div>
      </div>
    </div>
  );
}
