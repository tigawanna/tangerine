import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LoadMoreButton } from "@/lib/relay/LoadMoreButton";
import { GitBranch } from "lucide-react";
import { graphql, usePaginationFragment } from "react-relay";
import type { FragmentRefs } from "relay-runtime";
import { Commits } from "./Commits";
import type { Branches_refs$key } from "./__generated__/Branches_refs.graphql";
import type { BranchesPaginationQuery } from "./__generated__/BranchesPaginationQuery.graphql";

type BranchesProps = {
  data: Branches_refs$key;
  defaultBranchName: string | null;
};

/**
 * Paginated branch list with nested commit history (Relay, same shape as `.old`).
 */
export function Branches({ data, defaultBranchName }: BranchesProps) {
  const frag = usePaginationFragment<BranchesPaginationQuery, Branches_refs$key>(
    BranchesFragment,
    data,
  );
  const refs = frag.data.refs;
  const edges = refs?.edges ?? [];
  const totalCount = refs?.totalCount ?? 0;

  if (edges.length === 0) {
    return (
      <p className="text-base-content/50 text-sm" data-test="repo-branches-empty">
        No branches found for this repository.
      </p>
    );
  }

  const defaultValue =
    defaultBranchName && edges.some((edge) => edge?.node?.name === defaultBranchName)
      ? defaultBranchName
      : (edges[0]?.node?.name ?? undefined);

  return (
    <section className="space-y-4" data-test="repo-branches">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Branches</h2>
        <p className="text-base-content/45 text-xs">
          {edges.length} of {totalCount}
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        defaultValue={defaultValue}
        className="border-base-300 bg-base-200/20 overflow-hidden rounded-xl border"
      >
        {edges.map((edge) => {
          const branch = edge?.node;
          if (!branch?.name) return null;
          return (
            <BranchItem
              key={branch.id}
              name={branch.name}
              target={branch.target}
              isDefault={branch.name === defaultBranchName}
            />
          );
        })}
      </Accordion>

      <LoadMoreButton frag={frag} />
    </section>
  );
}

type BranchItemProps = {
  name: string;
  isDefault: boolean;
  target:
    | {
        readonly commits:
          | {
              readonly " $fragmentSpreads": FragmentRefs<"Commits_history">;
            }
          | null
          | undefined;
      }
    | null
    | undefined;
};

function BranchItem({ name, target, isDefault }: BranchItemProps) {
  return (
    <AccordionItem value={name} className="border-base-300 px-3 last:border-b-0 sm:px-4">
      <AccordionTrigger
        className="hover:no-underline py-3.5"
        data-test={`repo-branch-trigger-${name}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <GitBranch className="text-base-content/40 size-3.5 shrink-0" aria-hidden />
          <span className="truncate font-mono text-sm font-medium">{name}</span>
          {isDefault ? (
            <span className="bg-primary/15 text-primary rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase">
              default
            </span>
          ) : null}
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <Commits data={target?.commits} />
      </AccordionContent>
    </AccordionItem>
  );
}

export const BranchesFragment = graphql`
  fragment Branches_refs on Repository
  @argumentDefinitions(first: { type: "Int", defaultValue: 5 }, after: { type: "String" })
  @refetchable(queryName: "BranchesPaginationQuery") {
    refs(
      refPrefix: "refs/heads/"
      orderBy: { direction: DESC, field: TAG_COMMIT_DATE }
      first: $first
      after: $after
    ) @connection(key: "Branches_refs") {
      totalCount
      edges {
        node {
          name
          id
          target {
            ...Commits_history @alias(as: "commits")
          }
        }
      }
    }
  }
`;
