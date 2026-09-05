import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  directionOptions,
  repositoryOrderOptions,
  resolveUserSearch,
} from "@/routes/_dashboard/$user/layout";
import { getRouteApi } from "@tanstack/react-router";
import { type ReactNode, startTransition } from "react";

const userRoute = getRouteApi("/_dashboard/$user/");

/**
 * Shared sticky chrome for tab filters (stays outside list Suspense).
 */
export function TabFilterBar({
  children,
  testId,
}: {
  children: ReactNode;
  testId: string;
}) {
  return (
    <div
      className="border-base-300 bg-base-200/30 sticky top-0 z-20 flex flex-wrap items-center justify-end gap-3 rounded-xl border px-3 py-2 backdrop-blur-sm"
      data-test={testId}
    >
      {children}
    </div>
  );
}

/**
 * Sort field + direction for the Repos tab.
 */
export function RepoOrderSelect() {
  const search = resolveUserSearch(userRoute.useSearch());
  const navigate = userRoute.useNavigate();
  const field = search.orderField;
  const direction = search.orderDir;

  return (
    <div className="flex items-center gap-2" data-test="repo-order-filters">
      <Select
        value={field}
        onValueChange={(value) => {
          startTransition(() => {
            void navigate({
              search: (prev) => ({
                ...prev,
                orderField: value as (typeof repositoryOrderOptions)[number],
              }),
              replace: true,
            });
          });
        }}
      >
        <SelectTrigger className="w-35" size="sm">
          <SelectValue placeholder="Order by" />
        </SelectTrigger>
        <SelectContent>
          {repositoryOrderOptions.map((item) => (
            <SelectItem key={item} value={item}>
              {item.replaceAll("_", " ").toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={direction}
        onValueChange={(value) => {
          startTransition(() => {
            void navigate({
              search: (prev) => ({
                ...prev,
                orderDir: value as (typeof directionOptions)[number],
              }),
              replace: true,
            });
          });
        }}
      >
        <SelectTrigger className="w-25" size="sm">
          <SelectValue placeholder="Dir" />
        </SelectTrigger>
        <SelectContent>
          {directionOptions.map((item) => (
            <SelectItem key={item} value={item}>
              {item.toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Toggle forks vs sources for the Repos tab.
 */
export function RepoIsForkSwitch() {
  const { isFork } = resolveUserSearch(userRoute.useSearch());
  const navigate = userRoute.useNavigate();

  return (
    <div className="flex items-center gap-2" data-test="repo-fork-switch">
      <Switch
        id="is_fork_switch"
        checked={isFork}
        onCheckedChange={(value) => {
          startTransition(() => {
            void navigate({
              search: (prev) => ({ ...prev, isFork: value }),
              replace: true,
            });
          });
        }}
      />
      <Label htmlFor="is_fork_switch" className="text-sm">
        Forks only
      </Label>
    </div>
  );
}

/**
 * Starred-at direction (GitHub only exposes `STARRED_AT`).
 */
export function StarOrderSelect() {
  const { starDir } = resolveUserSearch(userRoute.useSearch());
  const navigate = userRoute.useNavigate();

  return (
    <div className="flex items-center gap-2" data-test="star-order-filters">
      <Select
        value={starDir}
        onValueChange={(value) => {
          startTransition(() => {
            void navigate({
              search: (prev) => ({
                ...prev,
                starDir: value as (typeof directionOptions)[number],
              }),
              replace: true,
            });
          });
        }}
      >
        <SelectTrigger className="w-40" size="sm">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="DESC">Newest starred</SelectItem>
          <SelectItem value="ASC">Oldest starred</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Limit starred list to repos owned by the signed-in viewer.
 */
export function StarOwnedByViewerSwitch() {
  const { ownedByViewer } = resolveUserSearch(userRoute.useSearch());
  const navigate = userRoute.useNavigate();

  return (
    <div className="flex items-center gap-2" data-test="star-owned-switch">
      <Switch
        id="owned_by_viewer_switch"
        checked={ownedByViewer}
        onCheckedChange={(value) => {
          startTransition(() => {
            void navigate({
              search: (prev) => ({ ...prev, ownedByViewer: value }),
              replace: true,
            });
          });
        }}
      />
      <Label htmlFor="owned_by_viewer_switch" className="text-sm">
        Owned by me
      </Label>
    </div>
  );
}

/**
 * Client-side name/login filter for followers / following.
 */
export function PeopleSearchInput({ placeholder }: { placeholder: string }) {
  const { peopleQ } = resolveUserSearch(userRoute.useSearch());
  const navigate = userRoute.useNavigate();

  return (
    <Input
      value={peopleQ}
      placeholder={placeholder}
      className="h-8 max-w-xs"
      data-test="people-search"
      onChange={(event) => {
        const value = event.target.value;
        startTransition(() => {
          void navigate({
            search: (prev) => ({ ...prev, peopleQ: value }),
            replace: true,
          });
        });
      }}
    />
  );
}
