import { LoadMoreButton } from "@/lib/relay/LoadMoreButton";
import { getRelativeTimeString } from "@/utils/date-helpers";
import { Code2, Github } from "lucide-react";
import { graphql, usePaginationFragment } from "react-relay";
import type { Commits_history$key } from "./__generated__/Commits_history.graphql";
import type { CommitsPaginationQuery } from "./__generated__/CommitsPaginationQuery.graphql";

type CommitsProps = {
  data: Commits_history$key | null | undefined;
};

/**
 * Paginated commit history for a branch tip (`Commit.history`).
 */
export function Commits({ data }: CommitsProps) {
  const frag = usePaginationFragment<CommitsPaginationQuery, Commits_history$key>(
    CommitsOnBranchFragment,
    data ?? null,
  );
  const history = frag.data?.history;
  if (!history) return null;

  const edges = history.edges ?? [];
  if (edges.length === 0) {
    return (
      <p className="text-base-content/50 px-1 py-3 text-sm" data-test="repo-commits-empty">
        No commits on this branch.
      </p>
    );
  }

  return (
    <div className="space-y-2" data-test="repo-commits-list">
      <p className="text-base-content/45 px-1 text-xs">
        Showing {edges.length} of {history.totalCount} commits
      </p>

      <ul className="space-y-2">
        {edges.map((edge) => {
          const commit = edge?.node;
          if (!commit) return null;
          return <CommitRow key={commit.oid} commit={commit} />;
        })}
      </ul>

      <LoadMoreButton frag={frag} />
    </div>
  );
}

type CommitNode = {
  readonly oid: string;
  readonly abbreviatedOid: string;
  readonly committedDate: string;
  readonly message: string;
  readonly url: string;
  readonly author: {
    readonly name: string | null | undefined;
    readonly email: string | null | undefined;
  } | null | undefined;
};

function CommitRow({ commit }: { commit: CommitNode }) {
  const when = getRelativeTimeString(new Date(commit.committedDate));
  const vscodeUrl = `https://vscode.dev/${commit.url}`;
  const subject = commit.message.split("\n")[0] ?? commit.message;

  return (
    <li
      className="border-base-300/80 bg-base-200/25 hover:bg-base-200/45 flex flex-col gap-2 rounded-lg border px-3 py-2.5 transition-colors sm:flex-row sm:items-center sm:justify-between"
      data-test="repo-commit-row"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="text-base-content/50 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className="text-base-content/80 font-medium">
            {commit.author?.name ?? "Unknown"}
          </span>
          <span aria-hidden>·</span>
          <time dateTime={commit.committedDate}>{when}</time>
          <span aria-hidden>·</span>
          <span className="font-mono text-[11px] tracking-tight">{commit.abbreviatedOid}</span>
        </div>
        <p className="text-base-content/85 truncate text-sm leading-snug" title={subject}>
          {subject}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <a
          href={vscodeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-base-content/45 hover:text-base-content hover:bg-base-300/50 inline-flex size-8 items-center justify-center rounded-md transition-colors"
          aria-label="Open in VS Code"
          data-test="repo-commit-vscode"
        >
          <Code2 className="size-4" />
        </a>
        <a
          href={commit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-base-content/45 hover:text-base-content hover:bg-base-300/50 inline-flex size-8 items-center justify-center rounded-md transition-colors"
          aria-label="Open on GitHub"
          data-test="repo-commit-github"
        >
          <Github className="size-4" />
        </a>
      </div>
    </li>
  );
}

export const CommitsOnBranchFragment = graphql`
  fragment Commits_history on Commit
  @argumentDefinitions(first: { type: "Int", defaultValue: 5 }, after: { type: "String" })
  @refetchable(queryName: "CommitsPaginationQuery") {
    history(first: $first, after: $after) @connection(key: "Commits_history") {
      totalCount
      edges {
        node {
          oid
          abbreviatedOid
          committedDate
          authoredDate
          message
          url
          author {
            name
            email
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
`;
