/**
 * @generated SignedSource<<4ee54e92fe9775d40356cc40340d4735>>
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
  ownedByViewer?: boolean | null | undefined;
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
v4 = {
  "defaultValue": false,
  "kind": "LocalArgument",
  "name": "ownedByViewer"
},
v5 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  }
],
v6 = {
  "kind": "Variable",
  "name": "ownedByViewer",
  "variableName": "ownedByViewer"
},
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
v9 = [
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
  },
  (v6/*:: as any*/)
],
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "url",
  "storageKey": null
},
v12 = [
  (v8/*:: as any*/),
  (v10/*:: as any*/),
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
    "name": "StarredRepositoriesPaginationQuery",
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
              },
              (v6/*:: as any*/)
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
      (v4/*:: as any*/),
      (v2/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "StarredRepositoriesPaginationQuery",
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
                "args": (v9/*:: as any*/),
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
                          (v8/*:: as any*/),
                          (v10/*:: as any*/),
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
                          (v11/*:: as any*/),
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
                              (v11/*:: as any*/),
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
                            "selections": (v12/*:: as any*/),
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
                                "selections": (v12/*:: as any*/),
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
                              (v10/*:: as any*/),
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
                  }
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v9/*:: as any*/),
                "filters": [
                  "orderBy",
                  "ownedByViewer"
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
    "cacheID": "999e27d3e7173ff5584e8b9c2555613a",
    "id": null,
    "metadata": {},
    "name": "StarredRepositoriesPaginationQuery",
    "operationKind": "query",
    "text": "query StarredRepositoriesPaginationQuery(\n  $afterStarredRepo: String\n  $firstStarredRepos: Int = 24\n  $orderByStarredRepos: StarOrder = {field: STARRED_AT, direction: DESC}\n  $ownedByViewer: Boolean = false\n  $id: ID!\n) {\n  node(id: $id) {\n    __typename\n    ...UserStarredRepos_repositories_3BRI8l\n    id\n  }\n}\n\nfragment RepoCard_repository on Repository {\n  id\n  name\n  nameWithOwner\n  description\n  pushedAt\n  diskUsage\n  url\n  visibility\n  isPrivate\n  isFork\n  stargazerCount\n  forkCount\n  openGraphImageUrl\n  owner {\n    __typename\n    login\n    url\n    avatarUrl\n    id\n  }\n  primaryLanguage {\n    id\n    name\n    color\n  }\n  languages(first: 3) {\n    nodes {\n      id\n      name\n      color\n    }\n  }\n  defaultBranchRef {\n    name\n    id\n  }\n}\n\nfragment UserStarredRepos_repositories_3BRI8l on User {\n  starredRepositories(first: $firstStarredRepos, after: $afterStarredRepo, orderBy: $orderByStarredRepos, ownedByViewer: $ownedByViewer) {\n    totalCount\n    edges {\n      cursor\n      node {\n        id\n        ...RepoCard_repository\n        __typename\n      }\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n      hasPreviousPage\n      startCursor\n    }\n  }\n  id\n}\n"
  }
};
})();

(node as any).hash = "64c976f24074688d63e857177fba5f32";

export default node;
