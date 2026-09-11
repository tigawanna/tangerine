/**
 * @generated SignedSource<<971f9feb4244994c03260fe4b7521a76>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
export type RepositoryPermission =
  | "ADMIN"
  | "MAINTAIN"
  | "READ"
  | "TRIAGE"
  | "WRITE"
  | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type EditRepoSettings_repository$data = {
  readonly allowUpdateBranch: boolean;
  readonly autoMergeAllowed: boolean;
  readonly deleteBranchOnMerge: boolean;
  readonly description: string | null | undefined;
  readonly hasDiscussionsEnabled: boolean;
  readonly hasIssuesEnabled: boolean;
  readonly hasProjectsEnabled: boolean;
  readonly hasWikiEnabled: boolean;
  readonly homepageUrl: string | null | undefined;
  readonly id: string;
  readonly isArchived: boolean;
  readonly isPrivate: boolean;
  readonly isTemplate: boolean;
  readonly mergeCommitAllowed: boolean;
  readonly name: string;
  readonly nameWithOwner: string;
  readonly rebaseMergeAllowed: boolean;
  readonly repositoryTopics: {
    readonly nodes:
      | ReadonlyArray<
          | {
              readonly id: string;
              readonly topic: {
                readonly name: string;
              };
            }
          | null
          | undefined
        >
      | null
      | undefined;
  };
  readonly squashMergeAllowed: boolean;
  readonly viewerCanAdminister: boolean;
  readonly viewerPermission: RepositoryPermission | null | undefined;
  readonly webCommitSignoffRequired: boolean;
  readonly " $fragmentType": "EditRepoSettings_repository";
};
export type EditRepoSettings_repository$key = {
  readonly " $data"?: EditRepoSettings_repository$data;
  readonly " $fragmentSpreads": FragmentRefs<"EditRepoSettings_repository">;
};

const node: ReaderFragment = (function () {
  var v0 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "id",
      storageKey: null,
    },
    v1 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "name",
      storageKey: null,
    };
  return {
    argumentDefinitions: [],
    kind: "Fragment",
    metadata: null,
    name: "EditRepoSettings_repository",
    selections: [
      v0 /*:: as any*/,
      v1 /*:: as any*/,
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "nameWithOwner",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "description",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "homepageUrl",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "viewerCanAdminister",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "viewerPermission",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "isPrivate",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "isArchived",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "isTemplate",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "hasIssuesEnabled",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "hasDiscussionsEnabled",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "hasProjectsEnabled",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "hasWikiEnabled",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "squashMergeAllowed",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "mergeCommitAllowed",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "rebaseMergeAllowed",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "autoMergeAllowed",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "deleteBranchOnMerge",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "allowUpdateBranch",
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: "ScalarField",
        name: "webCommitSignoffRequired",
        storageKey: null,
      },
      {
        alias: null,
        args: [
          {
            kind: "Literal",
            name: "first",
            value: 20,
          },
        ],
        concreteType: "RepositoryTopicConnection",
        kind: "LinkedField",
        name: "repositoryTopics",
        plural: false,
        selections: [
          {
            alias: null,
            args: null,
            concreteType: "RepositoryTopic",
            kind: "LinkedField",
            name: "nodes",
            plural: true,
            selections: [
              v0 /*:: as any*/,
              {
                alias: null,
                args: null,
                concreteType: "Topic",
                kind: "LinkedField",
                name: "topic",
                plural: false,
                selections: [v1 /*:: as any*/],
                storageKey: null,
              },
            ],
            storageKey: null,
          },
        ],
        storageKey: "repositoryTopics(first:20)",
      },
    ],
    type: "Repository",
    abstractKey: null,
  };
})();

(node as any).hash = "19ab2d40a91ae35b4836db212936255a";

export default node;
