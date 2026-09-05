import { Checkbox } from "@/components/ui/checkbox";
import { Edit } from "lucide-react";
import { useState } from "react";
import { DeleteRepositories } from "./DeleteRepositories";
import type { SelectableRepo } from "./use-repo-selector";

type RepoBulkEditControlsProps = {
  editing: boolean;
  selected: SelectableRepo[];
  adminCount: number;
  isAllSelected: boolean;
  onToggleEditing: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  setSelected: (selected: SelectableRepo[]) => void;
};

/**
 * Bulk-edit chrome for the repos filter bar (edit toggle, select-all, delete).
 */
export function RepoBulkEditControls({
  editing,
  selected,
  adminCount,
  isAllSelected,
  onToggleEditing,
  onSelectAll,
  onDeselectAll,
  setSelected,
}: RepoBulkEditControlsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (adminCount === 0 && !editing) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3" data-test="repo-bulk-toolbar">
      <button
        type="button"
        className={`text-base-content/70 hover:text-primary inline-flex size-8 items-center justify-center rounded-lg transition-colors ${editing ? "bg-primary/15 text-primary" : ""}`}
        aria-pressed={editing}
        aria-label={editing ? "Exit bulk edit" : "Edit repositories"}
        data-test="repo-bulk-edit-toggle"
        onClick={onToggleEditing}
      >
        <Edit className="size-5" />
      </button>

      {editing && selected.length > 0 ? (
        <DeleteRepositories
          open={deleteOpen}
          setOpen={setDeleteOpen}
          selected={selected}
          setSelected={setSelected}
        />
      ) : null}

      {editing ? (
        <div className="flex items-center gap-2">
          <span className="text-base-content/55 text-xs">Select all admin</span>
          <Checkbox
            className="size-5"
            checked={isAllSelected}
            disabled={adminCount === 0}
            data-test="repo-bulk-select-all"
            onCheckedChange={(checked) => {
              if (checked === true) {
                onSelectAll();
              } else {
                onDeselectAll();
              }
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
