import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Collection } from "@tanstack/db";
import { type NavigateOptions } from "@tanstack/react-router";
import { ArrowDownAZ, ArrowUpZA, SlidersHorizontal } from "lucide-react";
import { useTransition } from "react";
import { CollectionColumns, ColumnConfig } from "./sortable-columns";

/**
 * Props for TanStack DB column sort controls.
 *
 * Route `validateSearch` must include `sortBy` and `sortDirection`.
 */
interface TanstackDBColumnFiltersProps<
  TCollection extends Collection<object, string | number>,
  TColumns extends CollectionColumns<TCollection> = CollectionColumns<TCollection>,
> {
  collection: TCollection;
  sortableColumns: Array<ColumnConfig<TColumns>>;
  search: {
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    [key: string]: unknown;
  };
  navigate: (opts: NavigateOptions) => void;
  defaultSortBy?: TColumns;
  defaultSortDirection?: "asc" | "desc";
}

/**
 * Popover sort UI: column select + direction toggle. Writes `sortBy` /
 * `sortDirection` into the route search.
 */
export function TanstackDBColumnFilters<
  TCollection extends Collection<object, string | number>,
  TColumns extends CollectionColumns<TCollection> = CollectionColumns<TCollection>,
>({
  sortableColumns,
  search,
  navigate,
  defaultSortBy,
  defaultSortDirection = "desc",
}: TanstackDBColumnFiltersProps<TCollection, TColumns>) {
  const [, startTransition] = useTransition();

  const currentSortBy = (search.sortBy as TColumns) ?? defaultSortBy ?? sortableColumns[0]?.value;
  const currentSortDirection = search.sortDirection ?? defaultSortDirection;

  function setSearch(patch: Record<string, unknown>) {
    startTransition(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          ...patch,
        }),
        replace: true,
      });
    });
  }

  function handleSortByChange(value: string) {
    setSearch({ sortBy: value, page: undefined, offset: 0 });
  }

  function handleSortDirectionToggle() {
    setSearch({
      sortDirection: currentSortDirection === "asc" ? "desc" : "asc",
      page: undefined,
      offset: 0,
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Sort</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort by</label>
            <Select value={currentSortBy} onValueChange={handleSortByChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {sortableColumns.map((column) => (
                  <SelectItem key={column.value} value={column.value}>
                    {column.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Direction</label>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleSortDirectionToggle}
            >
              {currentSortDirection === "asc" ? (
                <>
                  <ArrowDownAZ className="h-4 w-4" />
                  Ascending
                </>
              ) : (
                <>
                  <ArrowUpZA className="h-4 w-4" />
                  Descending
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Compact toolbar sort: column select + icon direction toggle.
 */
export function TanstackDBSortSelect<
  TCollection extends Collection<object, string | number>,
  TColumns extends CollectionColumns<TCollection> = CollectionColumns<TCollection>,
>({
  sortableColumns,
  search,
  navigate,
  defaultSortBy,
  defaultSortDirection = "desc",
}: TanstackDBColumnFiltersProps<TCollection, TColumns>) {
  const [, startTransition] = useTransition();

  const currentSortBy = (search.sortBy as TColumns) ?? defaultSortBy ?? sortableColumns[0]?.value;
  const currentSortDirection = search.sortDirection ?? defaultSortDirection;

  function setSearch(patch: Record<string, unknown>) {
    startTransition(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          ...patch,
        }),
        replace: true,
      });
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Select
        value={currentSortBy}
        onValueChange={(value) => setSearch({ sortBy: value, page: undefined, offset: 0 })}
      >
        <SelectTrigger className="h-9 w-35">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortableColumns.map((column) => (
            <SelectItem key={column.value} value={column.value}>
              {column.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() =>
          setSearch({
            sortDirection: currentSortDirection === "asc" ? "desc" : "asc",
            page: undefined,
            offset: 0,
          })
        }
        title={`Sort ${currentSortDirection === "asc" ? "descending" : "ascending"}`}
      >
        {currentSortDirection === "asc" ? (
          <ArrowDownAZ className="h-4 w-4" />
        ) : (
          <ArrowUpZA className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
