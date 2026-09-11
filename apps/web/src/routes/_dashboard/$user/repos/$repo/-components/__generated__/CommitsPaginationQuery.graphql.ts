/**
 * @generated SignedSource<<6285daabd3f68dbdaaf48e5e893cef17>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type CommitsPaginationQuery$variables = {
  after?: string | null | undefined;
  first?: number | null | undefined;
  id: string;
};
export type CommitsPaginationQuery$data = {
  readonly node:
    | {
        readonly " $fragmentSpreads": FragmentRefs<"Commits_history">;
      }
    | null
    | undefined;
};
export type CommitsPaginationQuery = {
  response: CommitsPaginationQuery$data;
  variables: CommitsPaginationQuery$variables;
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
    v2 = [
      {
        kind: "Variable",
        name: "after",
        variableName: "after",
      },
      {
        kind: "Variable",
        name: "first",
        variableName: "first",
      },
    ],
    v3 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "__typename",
      storageKey: null,
    },
    v4 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "id",
      storageKey: null,
    };
  return {
    fragment: {
      argumentDefinitions: v0 /*:: as any*/,
      kind: "Fragment",
      metadata: null,
      name: "CommitsPaginationQuery",
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
              args: v2 /*:: as any*/,
              kind: "FragmentSpread",
              name: "Commits_history",
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
      name: "CommitsPaginationQuery",
      selections: [
        {
          alias: null,
          args: v1 /*:: as any*/,
          concreteType: null,
          kind: "LinkedField",
          name: "node",
          plural: false,
          selections: [
            v3 /*:: as any*/,
            v4 /*:: as any*/,
            {
              kind: "InlineFragment",
              selections: [
                {
                  alias: null,
                  args: v2 /*:: as any*/,
                  concreteType: "CommitHistoryConnection",
                  kind: "LinkedField",
                  name: "history",
                  plural: false,
                  selections: [
                    {
                      alias: null,
                      args: null,
                      kind: "ScalarField",
                      name: "totalCount",
                      storageKey: null,
                    },
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
                                {
                                  alias: null,
                                  args: null,
                                  kind: "ScalarField",
                                  name: "name",
                                  storageKey: null,
                                },
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
                            v3 /*:: as any*/,
                          ],
                          storageKey: null,
                        },
                        {
                          alias: null,
                          args: null,
                          kind: "ScalarField",
                          name: "cursor",
                          storageKey: null,
                        },
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
                        {
                          alias: null,
                          args: null,
                          kind: "ScalarField",
                          name: "endCursor",
                          storageKey: null,
                        },
                        {
                          alias: null,
                          args: null,
                          kind: "ScalarField",
                          name: "hasNextPage",
                          storageKey: null,
                        },
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
                  storageKey: null,
                },
                {
                  alias: null,
                  args: v2 /*:: as any*/,
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
      ],
    },
    params: {
      cacheID: "94ab6dc902315a96f6df0ad3bd5eb5c4",
      id: null,
      metadata: {},
      name: "CommitsPaginationQuery",
      operationKind: "query",
      text: "query CommitsPaginationQuery(\n  $after: String\n  $first: Int = 5\n  $id: ID!\n) {\n  node(id: $id) {\n    __typename\n    ...Commits_history_2HEEH6\n    id\n  }\n}\n\nfragment Commits_history_2HEEH6 on Commit {\n  history(first: $first, after: $after) {\n    totalCount\n    edges {\n      node {\n        oid\n        abbreviatedOid\n        committedDate\n        authoredDate\n        message\n        url\n        author {\n          name\n          email\n        }\n        id\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n      hasPreviousPage\n      startCursor\n    }\n  }\n  id\n}\n",
    },
  };
})();

(node as any).hash = "9cb9def7c3423fd74b5d7503c87cba5f";

export default node;
