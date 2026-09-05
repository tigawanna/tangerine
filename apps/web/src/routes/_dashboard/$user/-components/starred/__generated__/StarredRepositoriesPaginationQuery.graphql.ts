/**
 * @generated SignedSource<<f829e18377b095c5fc5a01dae06be21a>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type OrderDirection = "ASC" | "DESC" | "%future added value";
export type StarOrderField = "STARRED_AT" | "%future added value";
export type StarOrder = {
  direction: OrderDirection;
  field: StarOrderField;
};
export type StarredRepositoriesPaginationQuery$variables = {
  afterStarredRepo?: string | null | undefined;
  firstStarredRepos?: number | null | undefined;
  id: string;
  orderByStarredRepos?: StarOrder | null | undefined;
};
export type StarredRepositoriesPaginationQuery$data = {
  readonly node: {
    readonly " $fragmentSpreads": FragmentRefs<"UserStarredRepos_repositories">;
  } | null | undefined;
};
export type StarredRepositoriesPaginationQuery = {
  response: StarredRepositoriesPaginationQuery$data;
  variables: StarredRepositoriesPaginationQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "afterStarredRepo"
},
v1 = {
  "defaultValue": 24,
  "kind": "LocalArgument",
  "name": "firstStarredRepos"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "id"
},
v3 = {
  "defaultValue": {
    "direction": "DESC",
    "field": "STARRED_AT"
  },
  "kind": "LocalArgument",
  "name": "orderByStarredRepos"
},
v4 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  }
],
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v7 = [
  {
    "kind": "Variable",
    "name": "after",
    "variableName": "afterStarredRepo"
  },
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "firstStarredRepos"
  },
  {
    "kind": "Variable",
    "name": "orderBy",
    "variableName": "orderByStarredRepos"
  }
],
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "url",
  "storageKey": null
},
v10 = [
  (v6/*:: as any*/),
  (v8/*:: as any*/),
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
      (v3/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "StarredRepositoriesPaginationQuery",
    "selections": [
      {
        "alias": null,
        "args": (v4/*:: as any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          {
            "args": [
              {
                "kind": "Variable",
                "name": "afterStarredRepo",
                "variableName": "afterStarredRepo"
              },
              {
                "kind": "Variable",
                "name": "firstStarredRepos",
                "variableName": "firstStarredRepos"
              },
              {
                "kind": "Variable",
                "name": "orderByStarredRepos",
                "variableName": "orderByStarredRepos"
              }
            ],
            "kind": "FragmentSpread",
            "name": "UserStarredRepos_repositories"
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
      (v2/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "StarredRepositoriesPaginationQuery",
    "selections": [
      {
        "alias": null,
        "args": (v4/*:: as any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          (v5/*:: as any*/),
          (v6/*:: as any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              {
                "alias": null,
                "args": (v7/*:: as any*/),
                "concreteType": "StarredRepositoryConnection",
                "kind": "LinkedField",
                "name": "starredRepositories",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "totalCount",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "StarredRepositoryEdge",
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
                          (v6/*:: as any*/),
                          (v8/*:: as any*/),
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
                          (v9/*:: as any*/),
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
                              (v5/*:: as any*/),
                              {
                                "alias": null,
                                "args": null,
                                "kind": "ScalarField",
                                "name": "login",
                                "storageKey": null
                              },
                              (v9/*:: as any*/),
                              {
                                "alias": null,
                                "args": null,
                                "kind": "ScalarField",
                                "name": "avatarUrl",
                                "storageKey": null
                              },
                              (v6/*:: as any*/)
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
                            "selections": (v10/*:: as any*/),
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
                                "selections": (v10/*:: as any*/),
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
                              (v8/*:: as any*/),
                              (v6/*:: as any*/)
                            ],
                            "storageKey": null
                          },
                          (v5/*:: as any*/)
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
                  }
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v7/*:: as any*/),
                "filters": [
                  "orderBy"
                ],
                "handle": "connection",
                "key": "UserStarredRepos_starredRepositories",
                "kind": "LinkedHandle",
                "name": "starredRepositories"
              }
            ],
            "type": "User",
            "abstractKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "d9c587b8f3fbb49d8be6120ee3b717f7",
    "id": null,
    "metadata": {},
    "name": "StarredRepositoriesPaginationQuery",
    "operationKind": "query",
    "text": "query StarredRepositoriesPaginationQuery(\n  $afterStarredRepo: String\n  $firstStarredRepos: Int = 24\n  $orderByStarredRepos: StarOrder = {field: STARRED_AT, direction: DESC}\n  $id: ID!\n) {\n  node(id: $id) {\n    __typename\n    ...UserStarredRepos_repositories_30IreX\n    id\n  }\n}\n\nfragment RepoCard_repository on Repository {\n  id\n  name\n  nameWithOwner\n  description\n  pushedAt\n  diskUsage\n  url\n  visibility\n  isPrivate\n  isFork\n  stargazerCount\n  forkCount\n  openGraphImageUrl\n  owner {\n    __typename\n    login\n    url\n    avatarUrl\n    id\n  }\n  primaryLanguage {\n    id\n    name\n    color\n  }\n  languages(first: 3) {\n    nodes {\n      id\n      name\n      color\n    }\n  }\n  defaultBranchRef {\n    name\n    id\n  }\n}\n\nfragment UserStarredRepos_repositories_30IreX on User {\n  starredRepositories(first: $firstStarredRepos, after: $afterStarredRepo, orderBy: $orderByStarredRepos) {\n    totalCount\n    edges {\n      cursor\n      node {\n        id\n        ...RepoCard_repository\n        __typename\n      }\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n      hasPreviousPage\n      startCursor\n    }\n  }\n  id\n}\n"
  }
};
})();

(node as any).hash = "e708489297d9e11aa1159b1f396d44fa";

export default node;
