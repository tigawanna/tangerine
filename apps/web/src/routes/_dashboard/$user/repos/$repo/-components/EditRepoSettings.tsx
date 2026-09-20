import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  updateGithubRepoSettings,
  type UpdateRepoSettingsInput,
} from "@/lib/github/mutations";
import { getRouteApi, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Settings2, X } from "lucide-react";
import { useState } from "react";
import { commitLocalUpdate, graphql, useFragment, useRelayEnvironment } from "react-relay";
import { toast } from "sonner";
import type {
  EditRepoSettings_repository$data,
  EditRepoSettings_repository$key,
} from "./__generated__/EditRepoSettings_repository.graphql";

const repoRoute = getRouteApi("/_dashboard/$user/repos/$repo/");

type EditRepoSettingsProps = {
  repository: EditRepoSettings_repository$key;
};

type RepoSettingsDraft = {
  name: string;
  description: string;
  homepage: string;
  topics: string[];
  topicDraft: string;
  isPrivate: boolean;
  hasIssuesEnabled: boolean;
  hasProjectsEnabled: boolean;
  hasWikiEnabled: boolean;
  hasDiscussionsEnabled: boolean;
  isTemplate: boolean;
  isArchived: boolean;
  squashMergeAllowed: boolean;
  mergeCommitAllowed: boolean;
  rebaseMergeAllowed: boolean;
  autoMergeAllowed: boolean;
  deleteBranchOnMerge: boolean;
  allowUpdateBranch: boolean;
  webCommitSignoffRequired: boolean;
};

type SettingKnob = {
  key: keyof Pick<
    RepoSettingsDraft,
    | "isPrivate"
    | "hasIssuesEnabled"
    | "hasProjectsEnabled"
    | "hasWikiEnabled"
    | "hasDiscussionsEnabled"
    | "isTemplate"
    | "isArchived"
    | "squashMergeAllowed"
    | "mergeCommitAllowed"
    | "rebaseMergeAllowed"
    | "autoMergeAllowed"
    | "deleteBranchOnMerge"
    | "allowUpdateBranch"
    | "webCommitSignoffRequired"
  >;
  label: string;
  hint: string;
  testId: string;
};

const featureKnobs = [
  {
    key: "hasIssuesEnabled",
    label: "Issues",
    hint: "Bug reports and feature tracking",
    testId: "repo-settings-issues",
  },
  {
    key: "hasDiscussionsEnabled",
    label: "Discussions",
    hint: "Community Q&A and ideas",
    testId: "repo-settings-discussions",
  },
  {
    key: "hasProjectsEnabled",
    label: "Projects",
    hint: "Project boards on this repo",
    testId: "repo-settings-projects",
  },
  {
    key: "hasWikiEnabled",
    label: "Wiki",
    hint: "Editable documentation wiki",
    testId: "repo-settings-wiki",
  },
  {
    key: "isTemplate",
    label: "Template",
    hint: "Allow others to generate repos from this",
    testId: "repo-settings-template",
  },
  {
    key: "isArchived",
    label: "Archived",
    hint: "Read-only — freezes pushes and issues",
    testId: "repo-settings-archived",
  },
] as const satisfies readonly SettingKnob[];

const mergeKnobs = [
  {
    key: "squashMergeAllowed",
    label: "Allow squash merge",
    hint: "Combine commits into one on merge",
    testId: "repo-settings-squash",
  },
  {
    key: "mergeCommitAllowed",
    label: "Allow merge commit",
    hint: "Classic merge commit strategy",
    testId: "repo-settings-merge-commit",
  },
  {
    key: "rebaseMergeAllowed",
    label: "Allow rebase merge",
    hint: "Replay commits onto the base branch",
    testId: "repo-settings-rebase",
  },
  {
    key: "autoMergeAllowed",
    label: "Allow auto-merge",
    hint: "Merge when required checks pass",
    testId: "repo-settings-auto-merge",
  },
  {
    key: "deleteBranchOnMerge",
    label: "Delete branch on merge",
    hint: "Clean up head branches automatically",
    testId: "repo-settings-delete-branch",
  },
  {
    key: "allowUpdateBranch",
    label: "Always suggest updating PR branch",
    hint: "Offer update even when not required",
    testId: "repo-settings-update-branch",
  },
  {
    key: "webCommitSignoffRequired",
    label: "Require web commit sign-off",
    hint: "Sign-off checkbox for github.com commits",
    testId: "repo-settings-signoff",
  },
] as const satisfies readonly SettingKnob[];

/**
 * Normalizes a topic string to GitHub's lowercase kebab-ish form.
 */
function normalizeTopic(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Parses free-text topics into a unique list.
 */
function parseTopics(value: string) {
  return [
    ...new Set(
      value
        .split(/[,\s]+/)
        .map(normalizeTopic)
        .filter(Boolean),
    ),
  ];
}

/**
 * Builds editable draft state from the Relay repository snapshot.
 */
function draftFromRepository(repository: EditRepoSettings_repository$data): RepoSettingsDraft {
  const topics =
    repository.repositoryTopics?.nodes
      ?.map((node) => node?.topic.name)
      .filter((name): name is string => Boolean(name)) ?? [];

  return {
    name: repository.name,
    description: repository.description ?? "",
    homepage: repository.homepageUrl ?? "",
    topics,
    topicDraft: "",
    isPrivate: repository.isPrivate,
    hasIssuesEnabled: repository.hasIssuesEnabled,
    hasProjectsEnabled: repository.hasProjectsEnabled,
    hasWikiEnabled: repository.hasWikiEnabled,
    hasDiscussionsEnabled: repository.hasDiscussionsEnabled,
    isTemplate: repository.isTemplate,
    isArchived: repository.isArchived,
    squashMergeAllowed: repository.squashMergeAllowed,
    mergeCommitAllowed: repository.mergeCommitAllowed,
    rebaseMergeAllowed: repository.rebaseMergeAllowed,
    autoMergeAllowed: repository.autoMergeAllowed,
    deleteBranchOnMerge: repository.deleteBranchOnMerge,
    allowUpdateBranch: repository.allowUpdateBranch,
    webCommitSignoffRequired: repository.webCommitSignoffRequired,
  };
}

/**
 * Diffs draft vs current Relay values into a REST settings patch.
 */
function buildSettingsPatch(
  repository: EditRepoSettings_repository$data,
  draft: RepoSettingsDraft,
): UpdateRepoSettingsInput {
  const currentTopics =
    repository.repositoryTopics?.nodes
      ?.map((node) => node?.topic.name)
      .filter((name): name is string => Boolean(name)) ?? [];

  const patch: UpdateRepoSettingsInput = {};
  if (draft.name.trim() && draft.name.trim() !== repository.name) {
    patch.name = draft.name.trim();
  }
  if (draft.description !== (repository.description ?? "")) {
    patch.description = draft.description;
  }
  if (draft.homepage !== (repository.homepageUrl ?? "")) {
    patch.homepage = draft.homepage.trim() || null;
  }
  if (
    draft.topics.length !== currentTopics.length ||
    draft.topics.some((topic, index) => topic !== currentTopics[index])
  ) {
    patch.topics = draft.topics;
  }
  if (draft.isPrivate !== repository.isPrivate) {
    patch.visibility = draft.isPrivate ? "private" : "public";
  }
  if (draft.hasIssuesEnabled !== repository.hasIssuesEnabled) {
    patch.hasIssues = draft.hasIssuesEnabled;
  }
  if (draft.hasProjectsEnabled !== repository.hasProjectsEnabled) {
    patch.hasProjects = draft.hasProjectsEnabled;
  }
  if (draft.hasWikiEnabled !== repository.hasWikiEnabled) {
    patch.hasWiki = draft.hasWikiEnabled;
  }
  if (draft.hasDiscussionsEnabled !== repository.hasDiscussionsEnabled) {
    patch.hasDiscussions = draft.hasDiscussionsEnabled;
  }
  if (draft.isTemplate !== repository.isTemplate) {
    patch.isTemplate = draft.isTemplate;
  }
  if (draft.isArchived !== repository.isArchived) {
    patch.archived = draft.isArchived;
  }
  if (draft.squashMergeAllowed !== repository.squashMergeAllowed) {
    patch.allowSquashMerge = draft.squashMergeAllowed;
  }
  if (draft.mergeCommitAllowed !== repository.mergeCommitAllowed) {
    patch.allowMergeCommit = draft.mergeCommitAllowed;
  }
  if (draft.rebaseMergeAllowed !== repository.rebaseMergeAllowed) {
    patch.allowRebaseMerge = draft.rebaseMergeAllowed;
  }
  if (draft.autoMergeAllowed !== repository.autoMergeAllowed) {
    patch.allowAutoMerge = draft.autoMergeAllowed;
  }
  if (draft.deleteBranchOnMerge !== repository.deleteBranchOnMerge) {
    patch.deleteBranchOnMerge = draft.deleteBranchOnMerge;
  }
  if (draft.allowUpdateBranch !== repository.allowUpdateBranch) {
    patch.allowUpdateBranch = draft.allowUpdateBranch;
  }
  if (draft.webCommitSignoffRequired !== repository.webCommitSignoffRequired) {
    patch.webCommitSignoffRequired = draft.webCommitSignoffRequired;
  }
  return patch;
}

/**
 * Writes patched scalar fields into the Relay store for instant UI feedback.
 */
function applySettingsToRelayStore(
  environment: ReturnType<typeof useRelayEnvironment>,
  repositoryId: string,
  draft: RepoSettingsDraft,
) {
  commitLocalUpdate(environment, (store) => {
    const record = store.get(repositoryId);
    if (!record) return;

    const nextName = draft.name.trim();
    record.setValue(nextName, "name");

    const previous = record.getValue("nameWithOwner");
    if (typeof previous === "string" && previous.includes("/")) {
      const owner = previous.slice(0, previous.indexOf("/"));
      record.setValue(`${owner}/${nextName}`, "nameWithOwner");
    }

    record.setValue(draft.description || null, "description");
    record.setValue(draft.homepage.trim() || null, "homepageUrl");
    record.setValue(draft.isPrivate, "isPrivate");
    record.setValue(draft.hasIssuesEnabled, "hasIssuesEnabled");
    record.setValue(draft.hasProjectsEnabled, "hasProjectsEnabled");
    record.setValue(draft.hasWikiEnabled, "hasWikiEnabled");
    record.setValue(draft.hasDiscussionsEnabled, "hasDiscussionsEnabled");
    record.setValue(draft.isTemplate, "isTemplate");
    record.setValue(draft.isArchived, "isArchived");
    record.setValue(draft.squashMergeAllowed, "squashMergeAllowed");
    record.setValue(draft.mergeCommitAllowed, "mergeCommitAllowed");
    record.setValue(draft.rebaseMergeAllowed, "rebaseMergeAllowed");
    record.setValue(draft.autoMergeAllowed, "autoMergeAllowed");
    record.setValue(draft.deleteBranchOnMerge, "deleteBranchOnMerge");
    record.setValue(draft.allowUpdateBranch, "allowUpdateBranch");
    record.setValue(draft.webCommitSignoffRequired, "webCommitSignoffRequired");
  });
}

type SettingsKnobRowProps = {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/**
 * One settings toggle row (label + hint + switch).
 */
function SettingsKnobRow({
  id,
  label,
  hint,
  checked,
  disabled,
  onCheckedChange,
}: SettingsKnobRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0 space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-base-content/50 text-xs leading-snug">{hint}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        data-test={id}
      />
    </div>
  );
}

/**
 * Admin sheet to edit About fields and quick repo setting knobs via GitHub REST.
 */
export function EditRepoSettings({ repository: repositoryKey }: EditRepoSettingsProps) {
  const repository = useFragment(EditRepoSettingsFragment, repositoryKey);
  const environment = useRelayEnvironment();
  const router = useRouter();
  const navigate = repoRoute.useNavigate();
  const { user } = repoRoute.useParams();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RepoSettingsDraft | null>(null);

  const mutation = useMutation({
    mutationFn: ({ input }: { input: UpdateRepoSettingsInput; draft: RepoSettingsDraft }) =>
      updateGithubRepoSettings(repository.nameWithOwner, input),
    onSuccess: async (result, { input, draft: savedDraft }) => {
      applySettingsToRelayStore(environment, repository.id, {
        ...savedDraft,
        name: result.name,
      });

      toast.success(result.renamed ? `Renamed to ${result.name}` : "Repository settings saved");
      setOpen(false);
      setDraft(null);

      if (result.renamed) {
        await navigate({
          to: "/$user/repos/$repo",
          params: { user, repo: result.name },
          replace: true,
        });
        return;
      }

      // Topics live in a connection — refresh so chips stay accurate.
      if (input.topics) {
        await router.invalidate();
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Couldn’t update repository settings.";
      toast.error(message);
    },
  });

  const canEdit = repository.viewerCanAdminister || repository.viewerPermission === "ADMIN";
  if (!canEdit) return null;

  const activeDraft = draft ?? draftFromRepository(repository);

  const addTopic = (raw: string) => {
    const next = normalizeTopic(raw);
    if (!next) return;
    setDraft((prev) => {
      const base = prev ?? draftFromRepository(repository);
      if (base.topics.includes(next)) {
        return { ...base, topicDraft: "" };
      }
      return { ...base, topics: [...base.topics, next], topicDraft: "" };
    });
  };

  const removeTopic = (topic: string) => {
    setDraft((prev) => {
      const base = prev ?? draftFromRepository(repository);
      return { ...base, topics: base.topics.filter((item) => item !== topic) };
    });
  };

  const setKnob = <K extends SettingKnob["key"]>(key: K, value: boolean) => {
    setDraft((prev) => ({
      ...(prev ?? draftFromRepository(repository)),
      [key]: value,
    }));
  };

  const handleSave = () => {
    const patch = buildSettingsPatch(repository, activeDraft);
    if (Object.keys(patch).length === 0) {
      toast.message("No changes to save");
      return;
    }
    if (patch.name !== undefined && !/^[A-Za-z0-9._-]+$/.test(patch.name)) {
      toast.error("Repo name may only contain letters, numbers, ., -, and _");
      return;
    }
    mutation.mutate({ input: patch, draft: activeDraft });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraft(draftFromRepository(repository));
        } else {
          setDraft(null);
        }
      }}
    >
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          data-test="repo-settings-open"
        >
          <Settings2 className="size-4" aria-hidden />
          Edit
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="bg-base-100 w-full gap-0 overflow-y-auto sm:max-w-md"
        data-test="repo-settings-sheet"
      >
        <SheetHeader className="border-base-300 border-b">
          <SheetTitle>Edit repository</SheetTitle>
          <SheetDescription>
            Quick About fields and setting knobs. Saves through GitHub&apos;s REST API.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 py-4">
          <section className="space-y-3" data-test="repo-settings-about">
            <h3 className="text-base-content/50 text-xs font-semibold tracking-wide uppercase">
              About
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="repo-settings-name">Name</Label>
              <Input
                id="repo-settings-name"
                value={activeDraft.name}
                onChange={(event) =>
                  setDraft({
                    ...(draft ?? draftFromRepository(repository)),
                    name: event.target.value,
                  })
                }
                autoComplete="off"
                spellCheck={false}
                data-test="repo-settings-name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="repo-settings-description">Description</Label>
              <Textarea
                id="repo-settings-description"
                value={activeDraft.description}
                onChange={(event) =>
                  setDraft({
                    ...(draft ?? draftFromRepository(repository)),
                    description: event.target.value,
                  })
                }
                rows={3}
                data-test="repo-settings-description"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="repo-settings-homepage">Website</Label>
              <Input
                id="repo-settings-homepage"
                type="url"
                placeholder="https://"
                value={activeDraft.homepage}
                onChange={(event) =>
                  setDraft({
                    ...(draft ?? draftFromRepository(repository)),
                    homepage: event.target.value,
                  })
                }
                data-test="repo-settings-homepage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="repo-settings-topic-input">Topics</Label>
              {activeDraft.topics.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {activeDraft.topics.map((topic) => (
                    <li
                      key={topic}
                      className="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                    >
                      {topic}
                      <button
                        type="button"
                        className="hover:bg-primary/20 rounded-full p-0.5"
                        aria-label={`Remove topic ${topic}`}
                        data-test={`repo-settings-topic-remove-${topic}`}
                        onClick={() => removeTopic(topic)}
                      >
                        <X className="size-3" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Input
                id="repo-settings-topic-input"
                value={activeDraft.topicDraft}
                placeholder="Add topic, press Enter"
                onChange={(event) =>
                  setDraft({
                    ...(draft ?? draftFromRepository(repository)),
                    topicDraft: event.target.value,
                  })
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addTopic(activeDraft.topicDraft);
                  }
                  if (
                    event.key === "Backspace" &&
                    activeDraft.topicDraft.length === 0 &&
                    activeDraft.topics.length > 0
                  ) {
                    removeTopic(activeDraft.topics[activeDraft.topics.length - 1]!);
                  }
                }}
                onBlur={() => {
                  if (activeDraft.topicDraft.trim()) addTopic(activeDraft.topicDraft);
                }}
                data-test="repo-settings-topic-input"
              />
              <p className="text-base-content/45 text-xs">
                Or paste a comma-separated list — we normalize on blur / Enter.
              </p>
              {activeDraft.topicDraft.includes(",") ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const parsed = parseTopics(activeDraft.topicDraft);
                    setDraft({
                      ...(draft ?? draftFromRepository(repository)),
                      topics: [...new Set([...activeDraft.topics, ...parsed])],
                      topicDraft: "",
                    });
                  }}
                >
                  Add pasted topics
                </Button>
              ) : null}
            </div>
          </section>

          <section
            className="border-base-300 space-y-1 border-t pt-4"
            data-test="repo-settings-visibility"
          >
            <h3 className="text-base-content/50 mb-1 text-xs font-semibold tracking-wide uppercase">
              Visibility
            </h3>
            <SettingsKnobRow
              id="repo-settings-private"
              label="Private"
              hint="Only people you grant access can see this repo"
              checked={activeDraft.isPrivate}
              disabled={mutation.isPending}
              onCheckedChange={(checked) => setKnob("isPrivate", checked)}
            />
          </section>

          <section
            className="border-base-300 space-y-1 border-t pt-4"
            data-test="repo-settings-features"
          >
            <h3 className="text-base-content/50 mb-1 text-xs font-semibold tracking-wide uppercase">
              Features
            </h3>
            {featureKnobs.map((knob) => (
              <SettingsKnobRow
                key={knob.key}
                id={knob.testId}
                label={knob.label}
                hint={knob.hint}
                checked={activeDraft[knob.key]}
                disabled={mutation.isPending}
                onCheckedChange={(checked) => setKnob(knob.key, checked)}
              />
            ))}
          </section>

          <section
            className="border-base-300 space-y-1 border-t pt-4"
            data-test="repo-settings-merge"
          >
            <h3 className="text-base-content/50 mb-1 text-xs font-semibold tracking-wide uppercase">
              Pull request merges
            </h3>
            {mergeKnobs.map((knob) => (
              <SettingsKnobRow
                key={knob.key}
                id={knob.testId}
                label={knob.label}
                hint={knob.hint}
                checked={activeDraft[knob.key]}
                disabled={mutation.isPending}
                onCheckedChange={(checked) => setKnob(knob.key, checked)}
              />
            ))}
          </section>
        </div>

        <SheetFooter className="border-base-300 border-t">
          <Button
            type="button"
            disabled={mutation.isPending}
            onClick={handleSave}
            data-test="repo-settings-save"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export const EditRepoSettingsFragment = graphql`
  fragment EditRepoSettings_repository on Repository {
    id
    name
    nameWithOwner
    description
    homepageUrl
    viewerCanAdminister
    viewerPermission
    isPrivate
    isArchived
    isTemplate
    hasIssuesEnabled
    hasDiscussionsEnabled
    hasProjectsEnabled
    hasWikiEnabled
    squashMergeAllowed
    mergeCommitAllowed
    rebaseMergeAllowed
    autoMergeAllowed
    deleteBranchOnMerge
    allowUpdateBranch
    webCommitSignoffRequired
    repositoryTopics(first: 20) {
      nodes {
        id
        topic {
          name
        }
      }
    }
  }
`;
