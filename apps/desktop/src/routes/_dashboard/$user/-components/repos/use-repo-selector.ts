import { useState } from "react";

export type SelectableRepo = {
  id: string;
  name: string;
  nameWithOwner: string;
};

type AdminRepoEdge = {
  node?: {
    id: string;
    name: string;
    nameWithOwner: string;
    viewerPermission?: string | null;
  } | null;
} | null | undefined;

/**
 * Multi-select state for bulk repository deletion.
 * Only repos with `viewerPermission === "ADMIN"` may be selected.
 */
export function useRepoSelector() {
  const [selected, setSelected] = useState<SelectableRepo[]>([]);

  const selectItem = (item: SelectableRepo) => {
    setSelected((prev) => {
      if (prev.some((repo) => repo.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const unselectItem = (item: SelectableRepo) => {
    setSelected((prev) => prev.filter((repo) => repo.id !== item.id));
  };

  const selectAll = (edges: ReadonlyArray<AdminRepoEdge>) => {
    setSelected(
      edges
        .filter((edge) => edge?.node?.viewerPermission === "ADMIN" && edge.node != null)
        .map((edge) => ({
          id: edge!.node!.id,
          name: edge!.node!.name,
          nameWithOwner: edge!.node!.nameWithOwner,
        })),
    );
  };

  const deselectAll = () => {
    setSelected([]);
  };

  return {
    selected,
    selectItem,
    unselectItem,
    selectAll,
    deselectAll,
    setSelected,
  };
}
