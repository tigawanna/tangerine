/**
 * @generated SignedSource<<c4c2255c551f39f90e03a8c8e089a224>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type BranchesPaginationQuery$variables = {
  after?: string | null | undefined;
  first?: number | null | undefined;
  id: string;
};
export type BranchesPaginationQuery$data = {
  readonly node:
    | {
        readonly " $fragmentSpreads": FragmentRefs<"Branches_refs">;
      }
    | null
    | undefined;
};
export type BranchesPaginationQuery = {
  response: BranchesPaginationQuery$data;
  variables: BranchesPaginationQuery$variables;
};

const node: ConcreteRequest = (function () {
  var v0 = [
      {
        defaultValue: null,
        kind: "LocalArgument",
        name: "after",
      },
      {
        defaultValue: 5,
        kind: "LocalArgument",
        name: "first",
      },
      {
        defaultValue: null,
        kind: "LocalArgument",
        name: "id",
      },
    ],
    v1 = [
      {
        kind: "Variable",
        name: "id",
        variableName: "id",
      },
    ],
    v2 = {
      kind: "Variable",
      name: "after",
      variableName: "after",
    },
    v3 = {
      kind: "Variable",
      name: "first",
      variableName: "first",
    },
    v4 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "__typename",
      storageKey: null,
    },
    v5 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "id",
      storageKey: null,
    },
    v6 = [
      v2 /*:: as any*/,
      v3 /*:: as any*/,
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
    v7 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "totalCount",
      storageKey: null,
    },
    v8 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "name",
      storageKey: null,
    },
    v9 = [
      {
        kind: "Literal",
        name: "first",
        value: 5,
      },
    ],
    v10 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "cursor",
      storageKey: null,
    },
    v11 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "endCursor",
      storageKey: null,
    },
    v12 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "hasNextPage",
      storageKey: null,
    };
  return {
    fragment: {
      argumentDefinitions: v0 /*:: as any*/,
      kind: "Fragment",
      metadata: null,
      name: "BranchesPaginationQuery",
      selections: [
        {
          alias: null,
          args: v1 /*:: as any*/,
          concreteType: null,
          kind: "LinkedField",
          name: "node",
          plural: false,
          selections: [
            {
              args: [v2 /*:: as any*/, v3 /*:: as any*/],
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
      argumentDefinitions: v0 /*:: as any*/,
      kind: "Operation",
      name: "BranchesPaginationQuery",
      selections: [
        {
          alias: null,
          args: v1 /*:: as any*/,
          concreteType: null,
          kind: "LinkedField",
          name: "node",
          plural: false,
          selections: [
            v4 /*:: as any*/,
            v5 /*:: as any*/,
            {
              kind: "InlineFragment",
              selections: [
                {
                  alias: null,
                  args: v6 /*:: as any*/,
                  concreteType: "RefConnection",
                  kind: "LinkedField",
                  name: "refs",
                  plural: false,
                  selections: [
                    v7 /*:: as any*/,
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
                            v8 /*:: as any*/,
                            v5 /*:: as any*/,
                            {
                              alias: null,
                              args: null,
                              concreteType: null,
                              kind: "LinkedField",
                              name: "target",
                              plural: false,
                              selections: [
                                v4 /*:: as any*/,
                                v5 /*:: as any*/,
                                {
                                  kind: "InlineFragment",
                                  selections: [
                                    {
                                      alias: null,
                                      args: v9 /*:: as any*/,
                                      concreteType: "CommitHistoryConnection",
                                      kind: "LinkedField",
                                      name: "history",
                                      plural: false,
                                      selections: [
                                        v7 /*:: as any*/,
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
                                                {
                                                  alias: null,
                                                  args: null,
                                                  kind: "ScalarField",
                                                  name: "url",
                                                  storageKey: null,
                                                },
                                                {
                                                  alias: null,
                                                  args: null,
                                                  concreteType: "GitActor",
                                                  kind: "LinkedField",
                                                  name: "author",
                                                  plural: false,
                                                  selections: [
                                                    v8 /*:: as any*/,
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
                                                v5 /*:: as any*/,
                                                v4 /*:: as any*/,
                                              ],
                                              storageKey: null,
                                            },
                                            v10 /*:: as any*/,
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
                                            v11 /*:: as any*/,
                                            v12 /*:: as any*/,
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
                                      args: v9 /*:: as any*/,
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
                            v4 /*:: as any*/,
                          ],
                          storageKey: null,
                        },
                        v10 /*:: as any*/,
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
                      selections: [v11 /*:: as any*/, v12 /*:: as any*/],
                      storageKey: null,
                    },
                  ],
                  storageKey: null,
                },
                {
                  alias: null,
                  args: v6 /*:: as any*/,
                  filters: ["refPrefix", "orderBy"],
                  handle: "connection",
                  key: "Branches_refs",
                  kind: "LinkedHandle",
                  name: "refs",
                },
              ],
              type: "Repository",
              abstractKey: null,
            },
          ],
          storageKey: null,
        },
      ],
    },
    params: {
      cacheID: "8e2baebcae1c4f46b9d29caa447e616a",
      id: null,
      metadata: {},
      name: "BranchesPaginationQuery",
      operationKind: "query",
      text: 'query BranchesPaginationQuery(\n  $after: String\n  $first: Int = 5\n  $id: ID!\n) {\n  node(id: $id) {\n    __typename\n    ...Branches_refs_2HEEH6\n    id\n  }\n}\n\nfragment Branches_refs_2HEEH6 on Repository {\n  refs(refPrefix: "refs/heads/", orderBy: {direction: DESC, field: TAG_COMMIT_DATE}, first: $first, after: $after) {\n    totalCount\n    edges {\n      node {\n        name\n        id\n        target {\n          __typename\n          ...Commits_history\n          id\n        }\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n  id\n}\n\nfragment Commits_history on Commit {\n  history(first: 5) {\n    totalCount\n    edges {\n      node {\n        oid\n        abbreviatedOid\n        committedDate\n        authoredDate\n        message\n        url\n        author {\n          name\n          email\n        }\n        id\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n      hasPreviousPage\n      startCursor\n    }\n  }\n  id\n}\n',
    },
  };
})();

(node as any).hash = "1c0aaa8a90f9a952d214bd20fbbd837d";

export default node;
