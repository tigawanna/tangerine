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
} from "@/routes/_dashboard/$user/layout";
import { getRouteApi } from "@tanstack/react-router";
import { startTransition } from "react";

const userRoute = getRouteApi("/_dashboard/$user");

/**
 * Sort field + direction for the Repos tab (updates `$user` search → Relay reload).
 */
export function RepoOrderSelect() {
  const { orderBy } = userRoute.useSearch();
  const navigate = userRoute.useNavigate();
  const field = orderBy.field;
  const direction = orderBy.direction;

  return (
    <div className="flex items-center gap-2" data-test="repo-order-filters">
      <Select
        value={field}
        onValueChange={(value) => {
          startTransition(() => {
            void navigate({
              search: (prev) => ({
                ...prev,
                orderBy: {
                  field: value as (typeof repositoryOrderOptions)[number],
                  direction,
                },
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
                orderBy: {
                  field,
                  direction: value as (typeof directionOptions)[number],
                },
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
  const { isFork } = userRoute.useSearch();
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
