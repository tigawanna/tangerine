import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { githubLanguages } from "@/routes/_dashboard/-components/search/github-languages";
import {
  POPULAR_GITHUB_LANGUAGES,
  countGithubSearchFilters,
  emptyGithubSearchFilterDraft,
  parseGithubSearchFilters,
  serializeGithubSearchFilters,
  type GithubSearchFilterDraft,
  type RangeValue,
  type TriState,
} from "@/routes/_dashboard/-components/search/github-search-filters";
import { GitFork, ListFilterPlus, Star, X } from "lucide-react";
import { useState } from "react";

interface GithubSearchFiltersDialogProps {
  /** Current committed / live query string. */
  query: string;
  /** Profile login — quick-fill for `user:`. */
  profileLogin: string;
  /** Search type — repo-only sections hide for USER. */
  searchType: "REPOSITORY" | "USER";
  /** Commit the composed query into the search input + URL. */
  onApply: (nextQuery: string) => void;
}

/**
 * Compose GitHub search qualifiers in one modal, then merge into `q`.
 */
export function GithubSearchFiltersDialog({
  query,
  profileLogin,
  searchType,
  onApply,
}: GithubSearchFiltersDialogProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<GithubSearchFilterDraft>(() =>
    parseGithubSearchFilters(query),
  );
  const preview = serializeGithubSearchFilters(draft);
  const activeCount = countGithubSearchFilters(parseGithubSearchFilters(query));
  const isRepo = searchType === "REPOSITORY";

  function openDialog(next: boolean) {
    if (next) {
      setDraft(parseGithubSearchFilters(query));
    }
    setOpen(next);
  }

  function patchDraft(patch: Partial<GithubSearchFilterDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function patchRange(
    field: "stars" | "forks" | "size" | "created" | "pushed",
    patch: Partial<RangeValue>,
  ) {
    setDraft((prev) => ({
      ...prev,
      [field]: { ...prev[field], ...patch },
    }));
  }

  return (
    <Dialog open={open} onOpenChange={openDialog}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="xs"
          variant={activeCount > 0 ? "default" : "outline"}
          data-test="github-search-filters-trigger"
        >
          <ListFilterPlus className="size-3.5" aria-hidden />
          Filters
          {activeCount > 0 ? (
            <Badge variant="secondary" className="bg-primary-content/15 text-primary-content h-4 px-1.5">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        data-test="github-search-filters-dialog"
      >
        <DialogHeader className="border-base-300 shrink-0 space-y-1 border-b px-6 py-4 text-left">
          <DialogTitle>Compose filters</DialogTitle>
          <DialogDescription>
            Build GitHub search syntax visually. Apply merges into the query box.
          </DialogDescription>
        </DialogHeader>

        <div className="border-base-300 bg-base-200/40 shrink-0 border-b px-6 py-3">
          <p className="text-base-content/50 mb-1 text-[11px] tracking-wide uppercase">Preview</p>
          <code
            className="text-base-content block max-h-16 overflow-auto font-mono text-xs break-all"
            data-test="github-search-filters-preview"
          >
            {preview || "—"}
          </code>
        </div>

        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          <div className="flex flex-col gap-6 px-6 py-5">
            <FilterSection title="Keywords" hint="Free text kept outside structured tokens">
              <Input
                value={draft.keywords}
                placeholder="react hooks…"
                data-test="github-search-filter-keywords"
                onChange={(event) => {
                  patchDraft({ keywords: event.target.value });
                }}
              />
            </FilterSection>

            <FilterSection title="Owner" hint="user: and org:">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="filter-user">User</Label>
                  <div className="flex gap-2">
                    <Input
                      id="filter-user"
                      value={draft.user}
                      placeholder={profileLogin}
                      data-test="github-search-filter-user"
                      onChange={(event) => {
                        patchDraft({ user: event.target.value });
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      data-test="github-search-filter-user-fill"
                      onClick={() => {
                        patchDraft({ user: profileLogin });
                      }}
                    >
                      @{profileLogin}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="filter-org">Org</Label>
                  <Input
                    id="filter-org"
                    value={draft.org}
                    placeholder="vercel"
                    data-test="github-search-filter-org"
                    onChange={(event) => {
                      patchDraft({ org: event.target.value });
                    }}
                  />
                </div>
              </div>
            </FilterSection>

            {isRepo ? (
              <>
                <FilterSection title="Flags" hint="is: / NOT is:">
                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                    <TriStateRow
                      label="Fork"
                      value={draft.fork}
                      testId="github-search-filter-fork"
                      onChange={(fork) => {
                        patchDraft({ fork });
                      }}
                    />
                    <TriStateRow
                      label="Archived"
                      value={draft.archived}
                      testId="github-search-filter-archived"
                      onChange={(archived) => {
                        patchDraft({ archived });
                      }}
                    />
                  </div>
                </FilterSection>

                <FilterSection title="Search in" hint="in:name description topics readme">
                  <div className="flex flex-wrap gap-4">
                    <CheckRow
                      id="in-name"
                      label="Name"
                      checked={draft.inName}
                      onCheckedChange={(inName) => {
                        patchDraft({ inName });
                      }}
                    />
                    <CheckRow
                      id="in-description"
                      label="Description"
                      checked={draft.inDescription}
                      onCheckedChange={(inDescription) => {
                        patchDraft({ inDescription });
                      }}
                    />
                    <CheckRow
                      id="in-topics"
                      label="Topics"
                      checked={draft.inTopics}
                      onCheckedChange={(inTopics) => {
                        patchDraft({ inTopics });
                      }}
                    />
                    <CheckRow
                      id="in-readme"
                      label="README"
                      checked={draft.inReadme}
                      onCheckedChange={(inReadme) => {
                        patchDraft({ inReadme });
                      }}
                    />
                  </div>
                </FilterSection>

                <FilterSection title="Language" hint="language:typescript">
                  <LanguagePicker
                    value={draft.language}
                    onChange={(language) => {
                      patchDraft({ language });
                    }}
                  />
                </FilterSection>

                <FilterSection title="Ranges" hint="Leave blank to skip. Exact wins over min/max.">
                  <div className="space-y-4">
                    <NumericRangeRow
                      label="Stars"
                      icon={<Star className="size-3.5" aria-hidden />}
                      range={draft.stars}
                      onChange={(patch) => {
                        patchRange("stars", patch);
                      }}
                    />
                    <NumericRangeRow
                      label="Forks"
                      icon={<GitFork className="size-3.5" aria-hidden />}
                      range={draft.forks}
                      onChange={(patch) => {
                        patchRange("forks", patch);
                      }}
                    />
                    <NumericRangeRow
                      label="Size (KB)"
                      range={draft.size}
                      onChange={(patch) => {
                        patchRange("size", patch);
                      }}
                    />
                  </div>
                </FilterSection>

                <FilterSection title="Dates" hint="created: / pushed: as YYYY-MM-DD" last>
                  <div className="space-y-4">
                    <DateRangeRow
                      label="Created"
                      range={draft.created}
                      onChange={(patch) => {
                        patchRange("created", patch);
                      }}
                    />
                    <DateRangeRow
                      label="Pushed"
                      range={draft.pushed}
                      onChange={(patch) => {
                        patchRange("pushed", patch);
                      }}
                    />
                  </div>
                </FilterSection>
              </>
            ) : (
              <p className="text-base-content/50 text-sm">
                Repo-only filters (fork, language, stars…) hide while searching users. Owner +
                keywords still apply.
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-base-300 shrink-0 border-t px-6 py-4 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            data-test="github-search-filters-clear"
            onClick={() => {
              setDraft({
                ...emptyGithubSearchFilterDraft,
                stars: {},
                forks: {},
                size: {},
                created: {},
                pushed: {},
              });
            }}
          >
            Clear all
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              data-test="github-search-filters-apply"
              onClick={() => {
                onApply(preview);
                setOpen(false);
              }}
            >
              Apply to query
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FilterSection({
  title,
  hint,
  last = false,
  children,
}: {
  title: string;
  hint?: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium">{title}</h3>
        {hint ? <p className="text-base-content/45 font-mono text-[11px]">{hint}</p> : null}
      </div>
      {children}
      {last ? null : <Separator className="bg-base-300" />}
    </section>
  );
}

function TriStateRow({
  label,
  value,
  testId,
  onChange,
}: {
  label: string;
  value: TriState;
  testId: string;
  onChange: (value: TriState) => void;
}) {
  return (
    <div className="flex flex-col gap-2" data-test={testId}>
      <span className="text-sm">{label}</span>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={value}
        onValueChange={(next) => {
          if (next === "any" || next === "yes" || next === "no") onChange(next);
        }}
      >
        <ToggleGroupItem value="any">Any</ToggleGroupItem>
        <ToggleGroupItem value="yes">Yes</ToggleGroupItem>
        <ToggleGroupItem value="no">Not</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

function CheckRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => {
          onCheckedChange(next === true);
        }}
      />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  );
}

function LanguagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [needle, setNeedle] = useState("");
  const q = needle.trim().toLowerCase();
  const matches = q
    ? githubLanguages.filter((lang) => lang.toLowerCase().includes(q)).slice(0, 12)
    : [...POPULAR_GITHUB_LANGUAGES];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={value || needle}
          placeholder="Type to search languages…"
          data-test="github-search-filter-language"
          onChange={(event) => {
            const next = event.target.value;
            setNeedle(next);
            onChange(next);
          }}
        />
        {value ? (
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Clear language"
            onClick={() => {
              setNeedle("");
              onChange("");
            }}
          >
            <X />
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {matches.map((lang) => {
          const selected = value.toLowerCase() === lang.toLowerCase();
          return (
            <Button
              key={lang}
              type="button"
              size="xs"
              variant={selected ? "default" : "outline"}
              className="rounded-full"
              onClick={() => {
                setNeedle("");
                onChange(lang);
              }}
            >
              {lang}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function NumericRangeRow({
  label,
  icon,
  range,
  onChange,
}: {
  label: string;
  icon?: React.ReactNode;
  range: RangeValue;
  onChange: (patch: Partial<RangeValue>) => void;
}) {
  const exactMode = Boolean(range.exact?.trim());
  return (
    <div className="space-y-2">
      <div className="text-base-content/70 flex items-center gap-1.5 text-sm">
        {icon}
        {label}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          type="number"
          min={0}
          placeholder="Exact"
          value={range.exact ?? ""}
          onChange={(event) => {
            onChange({ exact: event.target.value, min: undefined, max: undefined });
          }}
        />
        <Input
          type="number"
          min={0}
          placeholder="Min ≥"
          disabled={exactMode}
          value={range.min ?? ""}
          onChange={(event) => {
            onChange({ min: event.target.value, exact: undefined });
          }}
        />
        <Input
          type="number"
          min={0}
          placeholder="Max ≤"
          disabled={exactMode}
          value={range.max ?? ""}
          onChange={(event) => {
            onChange({ max: event.target.value, exact: undefined });
          }}
        />
      </div>
    </div>
  );
}

function DateRangeRow({
  label,
  range,
  onChange,
}: {
  label: string;
  range: RangeValue;
  onChange: (patch: Partial<RangeValue>) => void;
}) {
  const exactMode = Boolean(range.exact?.trim());
  return (
    <div className="space-y-2">
      <div className="text-base-content/70 text-sm">{label}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          type="date"
          value={range.exact ?? ""}
          onChange={(event) => {
            onChange({ exact: event.target.value, min: undefined, max: undefined });
          }}
        />
        <Input
          type="date"
          disabled={exactMode}
          value={range.min ?? ""}
          onChange={(event) => {
            onChange({ min: event.target.value, exact: undefined });
          }}
        />
        <Input
          type="date"
          disabled={exactMode}
          value={range.max ?? ""}
          onChange={(event) => {
            onChange({ max: event.target.value, exact: undefined });
          }}
        />
      </div>
      <p className="text-base-content/40 text-[11px]">Exact · After (≥) · Before (≤)</p>
    </div>
  );
}
