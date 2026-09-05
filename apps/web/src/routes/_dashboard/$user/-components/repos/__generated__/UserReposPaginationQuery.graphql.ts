/**
 * @generated SignedSource<<c27e716ec4f56bd77db5d38af77f0238>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type OrderDirection = "ASC" | "DESC" | "%future added value";
export type RepositoryOrderField = "CREATED_AT" | "NAME" | "PUSHED_AT" | "STARGAZERS" | "UPDATED_AT" | "%future added value";
export type RepositoryOrder = {
  direction: OrderDirection;
  field: RepositoryOrderField;
};
export type UserReposPaginationQuery$variables = {
  after?: string | null | undefined;
  first?: number | null | undefined;
  id: string;
  isFork?: boolean | null | undefined;
  orderBy?: RepositoryOrder | null | undefined;
};
export type UserReposPaginationQuery$data = {
  readonly node: {
    readonly " $fragmentSpreads": FragmentRefs<"UserRepos_repositories">;
  } | null | undefined;
};
export type UserReposPaginationQuery = {
  response: UserReposPaginationQuery$data;
  variables: UserReposPaginationQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "after"
},
v1 = {
  "defaultValue": 24,
  "kind": "LocalArgument",
  "name": "first"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "id"
},
v3 = {
  "defaultValue": false,
  "kind": "LocalArgument",
  "name": "isFork"
},
v4 = {
  "defaultValue": {
    "direction": "DESC",
    "field": "PUSHED_AT"
  },
  "kind": "LocalArgument",
  "name": "orderBy"
},
v5 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  }
],
v6 = [
  {
    "kind": "Variable",
    "name": "after",
    "variableName": "after"
  },
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "first"
  },
  {
    "kind": "Variable",
    "name": "isFork",
    "variableName": "isFork"
  },
  {
    "kind": "Variable",
    "name": "orderBy",
    "variableName": "orderBy"
  }
],
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "url",
  "storageKey": null
},
v11 = [
  (v8/*:: as any*/),
  (v9/*:: as any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "color",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*:: as any*/),
      (v1/*:: as any*/),
      (v2/*:: as any*/),
      (v3/*:: as any*/),
      (v4/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "UserReposPaginationQuery",
    "selections": [
      {
        "alias": null,
        "args": (v5/*:: as any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          {
            "args": (v6/*:: as any*/),
            "kind": "FragmentSpread",
            "name": "UserRepos_repositories"
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v0/*:: as any*/),
      (v1/*:: as any*/),
      (v3/*:: as any*/),
      (v4/*:: as any*/),
      (v2/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "UserReposPaginationQuery",
    "selections": [
      {
        "alias": null,
        "args": (v5/*:: as any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          (v7/*:: as any*/),
          (v8/*:: as any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              {
                "alias": null,
                "args": (v6/*:: as any*/),
                "concreteType": "RepositoryConnection",
                "kind": "LinkedField",
                "name": "repositories",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "RepositoryEdge",
                    "kind": "LinkedField",
                    "name": "edges",
                    "plural": true,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "cursor",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "Repository",
                        "kind": "LinkedField",
                        "name": "node",
                        "plural": false,
                        "selections": [
                          (v8/*:: as any*/),
                          (v9/*:: as any*/),
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "nameWithOwner",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "description",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "pushedAt",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "diskUsage",
                            "storageKey": null
                          },
                          (v10/*:: as any*/),
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "visibility",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "isPrivate",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "isFork",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "stargazerCount",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "forkCount",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "openGraphImageUrl",
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "concreteType": null,
                            "kind": "LinkedField",
                            "name": "owner",
                            "plural": false,
                            "selections": [
                              (v7/*:: as any*/),
                              {
                                "alias": null,
                                "args": null,
                                "kind": "ScalarField",
                                "name": "login",
                                "storageKey": null
                              },
                              (v10/*:: as any*/),
                              {
                                "alias": null,
                                "args": null,
                                "kind": "ScalarField",
                                "name": "avatarUrl",
                                "storageKey": null
                              },
                              (v8/*:: as any*/)
                            ],
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "concreteType": "Language",
                            "kind": "LinkedField",
                            "name": "primaryLanguage",
                            "plural": false,
                            "selections": (v11/*:: as any*/),
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": [
                              {
                                "kind": "Literal",
                                "name": "first",
                                "value": 3
                              }
                            ],
                            "concreteType": "LanguageConnection",
                            "kind": "LinkedField",
                            "name": "languages",
                            "plural": false,
                            "selections": [
                              {
                                "alias": null,
                                "args": null,
                                "concreteType": "Language",
                                "kind": "LinkedField",
                                "name": "nodes",
                                "plural": true,
                                "selections": (v11/*:: as any*/),
                                "storageKey": null
                              }
                            ],
                            "storageKey": "languages(first:3)"
                          },
                          {
                            "alias": null,
                            "args": null,
                            "concreteType": "Ref",
                            "kind": "LinkedField",
                            "name": "defaultBranchRef",
                            "plural": false,
                            "selections": [
                              (v9/*:: as any*/),
                              (v8/*:: as any*/)
                            ],
                            "storageKey": null
                          },
                          (v7/*:: as any*/)
                        ],
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "PageInfo",
                    "kind": "LinkedField",
                    "name": "pageInfo",
                    "plural": false,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "endCursor",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "hasNextPage",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "hasPreviousPage",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "startCursor",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "totalCount",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v6/*:: as any*/),
                "filters": [
                  "orderBy",
                  "isFork"
                ],
                "handle": "connection",
                "key": "UserRepos_repositories",
                "kind": "LinkedHandle",
                "name": "repositories"
              }
            ],
            "type": "RepositoryOwner",
            "abstractKey": "__isRepositoryOwner"
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "a68fbe297a02815a2a7c72d93912cef7",
    "id": null,
    "metadata": {},
    "name": "UserReposPaginationQuery",
    "operationKind": "query",
    "text": "query UserReposPaginationQuery(\n  $after: String\n  $first: Int = 24\n  $isFork: Boolean = false\n  $orderBy: RepositoryOrder = {field: PUSHED_AT, direction: DESC}\n  $id: ID!\n) {\n  node(id: $id) {\n    __typename\n    ...UserRepos_repositories_2NdkU6\n    id\n  }\n}\n\nfragment RepoCard_repository on Repository {\n  id\n  name\n  nameWithOwner\n  description\n  pushedAt\n  diskUsage\n  url\n  visibility\n  isPrivate\n  isFork\n  stargazerCount\n  forkCount\n  openGraphImageUrl\n  owner {\n    __typename\n    login\n    url\n    avatarUrl\n    id\n  }\n  primaryLanguage {\n    id\n    name\n    color\n  }\n  languages(first: 3) {\n    nodes {\n      id\n      name\n      color\n    }\n  }\n  defaultBranchRef {\n    name\n    id\n  }\n}\n\nfragment UserRepos_repositories_2NdkU6 on RepositoryOwner {\n  __isRepositoryOwner: __typename\n  repositories(first: $first, after: $after, orderBy: $orderBy, isFork: $isFork) {\n    edges {\n      cursor\n      node {\n        id\n        ...RepoCard_repository\n        __typename\n      }\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n      hasPreviousPage\n      startCursor\n    }\n    totalCount\n  }\n  id\n}\n"
  }
};
})();

(node as any).hash = "6acb3cecc46aff5ab5a48509e01c1742";

export default node;
