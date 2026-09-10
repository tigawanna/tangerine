import { repoReadmeQueryOptions } from "@/data-access-layer/github/repo-readme-query-options";
import { useSuspenseQuery } from "@tanstack/react-query";
import { RepoReadme } from "./RepoReadme";

type RepoReadmePanelProps = {
  owner: string;
  repo: string;
};

/**
 * Loads README over GitHub REST (not GraphQL) and renders it.
 */
export function RepoReadmePanel({ owner, repo }: RepoReadmePanelProps) {
  const { data } = useSuspenseQuery(repoReadmeQueryOptions(owner, repo));

  if (!data.content) {
    return (
      <p className="text-base-content/50 text-sm" data-test="repo-detail-no-readme">
        No README for this repository.
      </p>
    );
  }

  return <RepoReadme source={data.content} path={data.path} />;
}
