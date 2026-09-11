/**
 * @generated SignedSource<<2418b42d917c0d6e0d058171b3bb79d3>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type RepoDetailPageQuery$variables = {
  name: string;
  owner: string;
};
export type RepoDetailPageQuery$data = {
  readonly repository:
    | {
        readonly defaultBranchRef:
          | {
              readonly id: string;
              readonly name: string;
            }
          | null
          | undefined;
        readonly " $fragmentSpreads": FragmentRefs<"Branches_refs" | "RepoGeneralInfo_repository">;
      }
    | null
    | undefined;
};
export type RepoDetailPageQuery = {
  response: RepoDetailPageQuery$data;
  variables: RepoDetailPageQuery$variables;
};

const node: ConcreteRequest = (function () {
  var v0 = {
      defaultValue: null,
      kind: "LocalArgument",
      name: "name",
    },
    v1 = {
      defaultValue: null,
      kind: "LocalArgument",
      name: "owner",
    },
    v2 = [
      {
        kind: "Variable",
        name: "name",
        variableName: "name",
      },
      {
        kind: "Variable",
        name: "owner",
        variableName: "owner",
      },
    ],
    v3 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "name",
      storageKey: null,
    },
    v4 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "id",
      storageKey: null,
    },
    v5 = [v3 /*:: as any*/, v4 /*:: as any*/],
    v6 = {
      alias: null,
      args: null,
      concreteType: "Ref",
      kind: "LinkedField",
      name: "defaultBranchRef",
      plural: false,
      selections: v5 /*:: as any*/,
      storageKey: null,
    },
    v7 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "url",
      storageKey: null,
    },
    v8 = [
      {
        kind: "Literal",
        name: "first",
        value: 20,
      },
    ],
    v9 = {
      kind: "Literal",
      name: "first",
      value: 5,
    },
    v10 = [
      v9 /*:: as any*/,
      {
        kind: "Literal",
        name: "orderBy",
        value: {
          direction: "DESC",
          field: "TAG_COMMIT_DATE",
        },
      },
      {
        kind: "Literal",
        name: "refPrefix",
        value: "refs/heads/",
      },
    ],
    v11 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "totalCount",
      storageKey: null,
    },
    v12 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "__typename",
      storageKey: null,
    },
    v13 = [v9 /*:: as any*/],
    v14 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "cursor",
      storageKey: null,
    },
    v15 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "endCursor",
      storageKey: null,
    },
    v16 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "hasNextPage",
      storageKey: null,
    };
  return {
    fragment: {
      argumentDefinitions: [v0 /*:: as any*/, v1 /*:: as any*/],
      kind: "Fragment",
      metadata: null,
      name: "RepoDetailPageQuery",
      selections: [
        {
          alias: null,
          args: v2 /*:: as any*/,
          concreteType: "Repository",
          kind: "LinkedField",
          name: "repository",
          plural: false,
          selections: [
            v6 /*:: as any*/,
            {
              args: null,
              kind: "FragmentSpread",
              name: "RepoGeneralInfo_repository",
            },
            {
              args: null,
              kind: "FragmentSpread",
              name: "Branches_refs",
            },
          ],
          storageKey: null,
        },
      ],
      type: "Query",
      abstractKey: null,
    },
    kind: "Request",
    operation: {
      argumentDefinitions: [v1 /*:: as any*/, v0 /*:: as any*/],
      kind: "Operation",
      name: "RepoDetailPageQuery",
      selections: [
        {
          alias: null,
          args: v2 /*:: as any*/,
          concreteType: "Repository",
          kind: "LinkedField",
          name: "repository",
          plural: false,
          selections: [
            v6 /*:: as any*/,
            v4 /*:: as any*/,
            v3 /*:: as any*/,
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
            v7 /*:: as any*/,
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
              name: "openGraphImageUrl",
              storageKey: null,
            },
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "pushedAt",
              storageKey: null,
            },
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "updatedAt",
              storageKey: null,
            },
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "diskUsage",
              storageKey: null,
            },
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "forkCount",
              storageKey: null,
            },
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "stargazerCount",
              storageKey: null,
            },
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "viewerHasStarred",
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
              name: "isFork",
              storageKey: null,
            },
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "isLocked",
              storageKey: null,
            },
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "isDisabled",
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
              name: "isUserConfigurationRepository",
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
              args: v8 /*:: as any*/,
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
                    v4 /*:: as any*/,
                    {
                      alias: null,
                      args: null,
                      concreteType: "Topic",
                      kind: "LinkedField",
                      name: "topic",
                      plural: false,
                      selections: v5 /*:: as any*/,
                      storageKey: null,
                    },
                  ],
                  storageKey: null,
                },
              ],
              storageKey: "repositoryTopics(first:20)",
            },
            {
              alias: null,
              args: v8 /*:: as any*/,
              concreteType: "LanguageConnection",
              kind: "LinkedField",
              name: "languages",
              plural: false,
              selections: [
                {
                  alias: null,
                  args: null,
                  kind: "ScalarField",
                  name: "totalSize",
                  storageKey: null,
                },
                {
                  alias: null,
                  args: null,
                  concreteType: "LanguageEdge",
                  kind: "LinkedField",
                  name: "edges",
                  plural: true,
                  selections: [
                    {
                      alias: null,
                      args: null,
                      kind: "ScalarField",
                      name: "size",
                      storageKey: null,
                    },
                    {
                      alias: null,
                      args: null,
                      concreteType: "Language",
                      kind: "LinkedField",
                      name: "node",
                      plural: false,
                      selections: [
                        v4 /*:: as any*/,
                        v3 /*:: as any*/,
                        {
                          alias: null,
                          args: null,
                          kind: "ScalarField",
                          name: "color",
                          storageKey: null,
                        },
                      ],
                      storageKey: null,
                    },
                  ],
                  storageKey: null,
                },
              ],
              storageKey: "languages(first:20)",
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
              args: v10 /*:: as any*/,
              concreteType: "RefConnection",
              kind: "LinkedField",
              name: "refs",
              plural: false,
              selections: [
                v11 /*:: as any*/,
                {
                  alias: null,
                  args: null,
                  concreteType: "RefEdge",
                  kind: "LinkedField",
                  name: "edges",
                  plural: true,
                  selections: [
                    {
                      alias: null,
                      args: null,
                      concreteType: "Ref",
                      kind: "LinkedField",
                      name: "node",
                      plural: false,
                      selections: [
                        v3 /*:: as any*/,
                        v4 /*:: as any*/,
                        {
                          alias: null,
                          args: null,
                          concreteType: null,
                          kind: "LinkedField",
                          name: "target",
                          plural: false,
                          selections: [
                            v12 /*:: as any*/,
                            v4 /*:: as any*/,
                            {
                              kind: "InlineFragment",
                              selections: [
                                {
                                  alias: null,
                                  args: v13 /*:: as any*/,
                                  concreteType: "CommitHistoryConnection",
                                  kind: "LinkedField",
                                  name: "history",
                                  plural: false,
                                  selections: [
                                    v11 /*:: as any*/,
                                    {
                                      alias: null,
                                      args: null,
                                      concreteType: "CommitEdge",
                                      kind: "LinkedField",
                                      name: "edges",
                                      plural: true,
                                      selections: [
                                        {
                                          alias: null,
                                          args: null,
                                          concreteType: "Commit",
                                          kind: "LinkedField",
                                          name: "node",
                                          plural: false,
                                          selections: [
                                            {
                                              alias: null,
                                              args: null,
                                              kind: "ScalarField",
                                              name: "oid",
                                              storageKey: null,
                                            },
                                            {
                                              alias: null,
                                              args: null,
                                              kind: "ScalarField",
                                              name: "abbreviatedOid",
                                              storageKey: null,
                                            },
                                            {
                                              alias: null,
                                              args: null,
                                              kind: "ScalarField",
                                              name: "committedDate",
                                              storageKey: null,
                                            },
                                            {
                                              alias: null,
                                              args: null,
                                              kind: "ScalarField",
                                              name: "authoredDate",
                                              storageKey: null,
                                            },
                                            {
                                              alias: null,
                                              args: null,
                                              kind: "ScalarField",
                                              name: "message",
                                              storageKey: null,
                                            },
                                            v7 /*:: as any*/,
                                            {
                                              alias: null,
                                              args: null,
                                              concreteType: "GitActor",
                                              kind: "LinkedField",
                                              name: "author",
                                              plural: false,
                                              selections: [
                                                v3 /*:: as any*/,
                                                {
                                                  alias: null,
                                                  args: null,
                                                  kind: "ScalarField",
                                                  name: "email",
                                                  storageKey: null,
                                                },
                                              ],
                                              storageKey: null,
                                            },
                                            v4 /*:: as any*/,
                                            v12 /*:: as any*/,
                                          ],
                                          storageKey: null,
                                        },
                                        v14 /*:: as any*/,
                                      ],
                                      storageKey: null,
                                    },
                                    {
                                      alias: null,
                                      args: null,
                                      concreteType: "PageInfo",
                                      kind: "LinkedField",
                                      name: "pageInfo",
                                      plural: false,
                                      selections: [
                                        v15 /*:: as any*/,
                                        v16 /*:: as any*/,
                                        {
                                          alias: null,
                                          args: null,
                                          kind: "ScalarField",
                                          name: "hasPreviousPage",
                                          storageKey: null,
                                        },
                                        {
                                          alias: null,
                                          args: null,
                                          kind: "ScalarField",
                                          name: "startCursor",
                                          storageKey: null,
                                        },
                                      ],
                                      storageKey: null,
                                    },
                                  ],
                                  storageKey: "history(first:5)",
                                },
                                {
                                  alias: null,
                                  args: v13 /*:: as any*/,
                                  filters: null,
                                  handle: "connection",
                                  key: "Commits_history",
                                  kind: "LinkedHandle",
                                  name: "history",
                                },
                              ],
                              type: "Commit",
                              abstractKey: null,
                            },
                          ],
                          storageKey: null,
                        },
                        v12 /*:: as any*/,
                      ],
                      storageKey: null,
                    },
                    v14 /*:: as any*/,
                  ],
                  storageKey: null,
                },
                {
                  alias: null,
                  args: null,
                  concreteType: "PageInfo",
                  kind: "LinkedField",
                  name: "pageInfo",
                  plural: false,
                  selections: [v15 /*:: as any*/, v16 /*:: as any*/],
                  storageKey: null,
                },
              ],
              storageKey:
                'refs(first:5,orderBy:{"direction":"DESC","field":"TAG_COMMIT_DATE"},refPrefix:"refs/heads/")',
            },
            {
              alias: null,
              args: v10 /*:: as any*/,
              filters: ["refPrefix", "orderBy"],
              handle: "connection",
              key: "Branches_refs",
              kind: "LinkedHandle",
              name: "refs",
            },
          ],
          storageKey: null,
        },
      ],
    },
    params: {
      cacheID: "c0910aa3d96c6fa0dcd7b53bb041951a",
      id: null,
      metadata: {},
      name: "RepoDetailPageQuery",
      operationKind: "query",
      text: 'query RepoDetailPageQuery(\n  $owner: String!\n  $name: String!\n) {\n  repository(owner: $owner, name: $name) {\n    defaultBranchRef {\n      name\n      id\n    }\n    ...RepoGeneralInfo_repository\n    ...Branches_refs\n    id\n  }\n}\n\nfragment Branches_refs on Repository {\n  refs(refPrefix: "refs/heads/", orderBy: {direction: DESC, field: TAG_COMMIT_DATE}, first: 5) {\n    totalCount\n    edges {\n      node {\n        name\n        id\n        target {\n          __typename\n          ...Commits_history\n          id\n        }\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n  id\n}\n\nfragment Commits_history on Commit {\n  history(first: 5) {\n    totalCount\n    edges {\n      node {\n        oid\n        abbreviatedOid\n        committedDate\n        authoredDate\n        message\n        url\n        author {\n          name\n          email\n        }\n        id\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n      hasPreviousPage\n      startCursor\n    }\n  }\n  id\n}\n\nfragment EditRepoSettings_repository on Repository {\n  id\n  name\n  nameWithOwner\n  description\n  homepageUrl\n  viewerCanAdminister\n  viewerPermission\n  isPrivate\n  isArchived\n  isTemplate\n  hasIssuesEnabled\n  hasDiscussionsEnabled\n  hasProjectsEnabled\n  hasWikiEnabled\n  squashMergeAllowed\n  mergeCommitAllowed\n  rebaseMergeAllowed\n  autoMergeAllowed\n  deleteBranchOnMerge\n  allowUpdateBranch\n  webCommitSignoffRequired\n  repositoryTopics(first: 20) {\n    nodes {\n      id\n      topic {\n        name\n        id\n      }\n    }\n  }\n}\n\nfragment RepoGeneralInfo_repository on Repository {\n  id\n  name\n  nameWithOwner\n  description\n  url\n  homepageUrl\n  openGraphImageUrl\n  pushedAt\n  updatedAt\n  diskUsage\n  forkCount\n  stargazerCount\n  viewerHasStarred\n  isPrivate\n  isArchived\n  isFork\n  isLocked\n  isDisabled\n  isTemplate\n  isUserConfigurationRepository\n  hasIssuesEnabled\n  hasDiscussionsEnabled\n  hasProjectsEnabled\n  hasWikiEnabled\n  repositoryTopics(first: 20) {\n    nodes {\n      id\n      topic {\n        name\n        id\n      }\n    }\n  }\n  languages(first: 20) {\n    totalSize\n    edges {\n      size\n      node {\n        id\n        name\n        color\n      }\n    }\n  }\n  ...EditRepoSettings_repository\n}\n',
    },
  };
})();

(node as any).hash = "36034838374ca00430e117817a311ece";

export default node;
