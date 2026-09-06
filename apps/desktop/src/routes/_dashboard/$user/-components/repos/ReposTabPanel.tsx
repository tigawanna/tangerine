import { Suspense, useRef, useState } from "react";
import {
  RepoIsForkSwitch,
  RepoOrderSelect,
  TabFilterBar,
} from "./RepoFilters";
import { DeleteRepoScopeDialog } from "./DeleteRepoScopeDialog";
import { RepoBulkEditControls } from "./RepoBulkEditControls";
import { UserRepos, type RepoListEdge } from "./UserRepos";
import { useRepoSelector } from "./use-repo-selector";
import type { UserRepos_repositories$key } from "./__generated__/UserRepos_repositories.graphql";

type ReposTabPanelProps = {
  owner: UserRepos_repositories$key;
};

/**
 * Repos tab: sticky filters + bulk-edit chrome outside Suspense; list inside.
 */
export function ReposTabPanel({ owner }: ReposTabPanelProps) {
  const [editing, setEditing] = useState(false);
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const { deselectAll, selectAll, selected, unselectItem, selectItem, setSelected } =
    useRepoSelector();
  const edgesRef = useRef<ReadonlyArray<RepoListEdge>>([]);
  const [adminCount, setAdminCount] = useState(0);

  const isAllSelected = editing && adminCount > 0 && selected.length === adminCount;

  return (
    <div role="tabpanel" className="mt-0 space-y-4" data-test="user-tabpanel-repos">
      <TabFilterBar testId="repo-filters">
        <RepoOrderSelect />
        <RepoIsForkSwitch />
        <RepoBulkEditControls
          editing={editing}
          selected={selected}
          adminCount={adminCount}
          isAllSelected={isAllSelected}
          setSelected={setSelected}
          onNeedsDeleteRepoScope={() => {
            setScopeDialogOpen(true);
          }}
          onToggleEditing={() => {
            setEditing((prev) => {
              if (prev) deselectAll();
              return !prev;
            });
          }}
          onSelectAll={() => {
            selectAll(edgesRef.current);
          }}
          onDeselectAll={deselectAll}
        />
      </TabFilterBar>
      <Suspense fallback={<ReposFallback />}>
        <UserRepos
          userReposKey={owner}
          editing={editing}
          selected={selected}
          selectItem={selectItem}
          unselectItem={unselectItem}
          onEdgesReady={(edges) => {
            edgesRef.current = edges;
            const nextAdminCount = edges.filter(
              (edge) => edge?.node?.viewerPermission === "ADMIN",
            ).length;
            setAdminCount(nextAdminCount);
          }}
        />
      </Suspense>
      <DeleteRepoScopeDialog open={scopeDialogOpen} onOpenChange={setScopeDialogOpen} />
    </div>
  );
}

function ReposFallback() {
  return (
    <div className="border-base-300 bg-base-200/20 text-base-content/50 rounded-xl border border-dashed p-10 text-center text-sm">
      Loading repos…
    </div>
  );
}
