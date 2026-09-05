/**
 * @generated SignedSource<<b50fc4ac107e62eb03c41359eaec9913>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type OrderDirection = "ASC" | "DESC" | "%future added value";
export type RepositoryOrderField = "CREATED_AT" | "NAME" | "PUSHED_AT" | "STARGAZERS" | "UPDATED_AT" | "%future added value";
export type StarOrderField = "STARRED_AT" | "%future added value";
export type RepositoryOrder = {
  direction: OrderDirection;
  field: RepositoryOrderField;
};
export type StarOrder = {
  direction: OrderDirection;
  field: StarOrderField;
};
export type layoutUserPageLoaderQuery$variables = {
  isFork?: boolean | null | undefined;
  login: string;
  orderBy?: RepositoryOrder | null | undefined;
  ownedByViewer?: boolean | null | undefined;
  starOrder?: StarOrder | null | undefined;
};
export type layoutUserPageLoaderQuery$data = {
  readonly user: {
    readonly " $fragmentSpreads": FragmentRefs<"UserFollowersFragment" | "UserFollowingFragment" | "UserInfo" | "UserRepos_repositories" | "UserStarredRepos_repositories">;
  } | null | undefined;
};
export type layoutUserPageLoaderQuery = {
  response: layoutUserPageLoaderQuery$data;
  variables: layoutUserPageLoaderQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "isFork"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "login"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "orderBy"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "ownedByViewer"
},
v4 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "starOrder"
},
v5 = [
  {
    "kind": "Variable",
    "name": "login",
    "variableName": "login"
  }
],
v6 = {
  "kind": "Variable",
  "name": "isFork",
  "variableName": "isFork"
},
v7 = {
  "kind": "Variable",
  "name": "orderBy",
  "variableName": "orderBy"
},
v8 = {
  "kind": "Variable",
  "name": "ownedByViewer",
  "variableName": "ownedByViewer"
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
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
  "name": "login",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "bio",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "avatarUrl",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "url",
  "storageKey": null
},
v15 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 12
  }
],
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v18 = {
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
v19 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "totalCount",
  "storageKey": null
},
v20 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "UserEdge",
    "kind": "LinkedField",
    "name": "edges",
    "plural": true,
    "selections": [
      (v16/*:: as any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          (v11/*:: as any*/),
          (v10/*:: as any*/),
          (v9/*:: as any*/),
          (v12/*:: as any*/),
          (v13/*:: as any*/),
          (v17/*:: as any*/)
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  },
  (v18/*:: as any*/),
  (v19/*:: as any*/)
],
v21 = {
  "kind": "Literal",
  "name": "first",
  "value": 24
},
v22 = [
  (v21/*:: as any*/),
  (v6/*:: as any*/),
  (v7/*:: as any*/)
],
v23 = [
  (v9/*:: as any*/),
  (v10/*:: as any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "color",
    "storageKey": null
  }
],
v24 = [
  (v16/*:: as any*/),
  {
    "alias": null,
    "args": null,
    "concreteType": "Repository",
    "kind": "LinkedField",
    "name": "node",
    "plural": false,
    "selections": [
      (v9/*:: as any*/),
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
      (v14/*:: as any*/),
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
          (v17/*:: as any*/),
          (v11/*:: as any*/),
          (v14/*:: as any*/),
          (v13/*:: as any*/),
          (v9/*:: as any*/)
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
        "selections": (v23/*:: as any*/),
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
            "selections": (v23/*:: as any*/),
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
          (v9/*:: as any*/)
        ],
        "storageKey": null
      },
      (v17/*:: as any*/)
    ],
    "storageKey": null
  }
],
v25 = [
  (v21/*:: as any*/),
  {
    "kind": "Variable",
    "name": "orderBy",
    "variableName": "starOrder"
  },
  (v8/*:: as any*/)
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
    "name": "layoutUserPageLoaderQuery",
    "selections": [
      {
        "alias": null,
        "args": (v5/*:: as any*/),
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "user",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "UserInfo"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "UserFollowingFragment"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "UserFollowersFragment"
          },
          {
            "args": [
              (v6/*:: as any*/),
              (v7/*:: as any*/)
            ],
            "kind": "FragmentSpread",
            "name": "UserRepos_repositories"
          },
          {
            "args": [
              {
                "kind": "Variable",
                "name": "orderByStarredRepos",
                "variableName": "starOrder"
              },
              (v8/*:: as any*/)
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
      (v1/*:: as any*/),
      (v0/*:: as any*/),
      (v2/*:: as any*/),
      (v4/*:: as any*/),
      (v3/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "layoutUserPageLoaderQuery",
    "selections": [
      {
        "alias": null,
        "args": (v5/*:: as any*/),
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "user",
        "plural": false,
        "selections": [
          (v9/*:: as any*/),
          (v10/*:: as any*/),
          (v11/*:: as any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "email",
            "storageKey": null
          },
          (v12/*:: as any*/),
          (v13/*:: as any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "company",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "twitterUsername",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "createdAt",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "isFollowingViewer",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "viewerIsFollowing",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "isViewer",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "location",
            "storageKey": null
          },
          (v14/*:: as any*/),
          {
            "alias": null,
            "args": (v15/*:: as any*/),
            "concreteType": "FollowingConnection",
            "kind": "LinkedField",
            "name": "following",
            "plural": false,
            "selections": (v20/*:: as any*/),
            "storageKey": "following(first:12)"
          },
          {
            "alias": null,
            "args": (v15/*:: as any*/),
            "filters": null,
            "handle": "connection",
            "key": "UserFollowingFragment_following",
            "kind": "LinkedHandle",
            "name": "following"
          },
          {
            "alias": null,
            "args": (v15/*:: as any*/),
            "concreteType": "FollowerConnection",
            "kind": "LinkedField",
            "name": "followers",
            "plural": false,
            "selections": (v20/*:: as any*/),
            "storageKey": "followers(first:12)"
          },
          {
            "alias": null,
            "args": (v15/*:: as any*/),
            "filters": null,
            "handle": "connection",
            "key": "UserFollowersFragment_followers",
            "kind": "LinkedHandle",
            "name": "followers"
          },
          {
            "alias": null,
            "args": (v22/*:: as any*/),
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
                "selections": (v24/*:: as any*/),
                "storageKey": null
              },
              (v18/*:: as any*/),
              (v19/*:: as any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v22/*:: as any*/),
            "filters": [
              "orderBy",
              "isFork"
            ],
            "handle": "connection",
            "key": "UserRepos_repositories",
            "kind": "LinkedHandle",
            "name": "repositories"
          },
          {
            "alias": null,
            "args": (v25/*:: as any*/),
            "concreteType": "StarredRepositoryConnection",
            "kind": "LinkedField",
            "name": "starredRepositories",
            "plural": false,
            "selections": [
              (v19/*:: as any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "StarredRepositoryEdge",
                "kind": "LinkedField",
                "name": "edges",
                "plural": true,
                "selections": (v24/*:: as any*/),
                "storageKey": null
              },
              (v18/*:: as any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v25/*:: as any*/),
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
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "c0e86a341a0ef8b6a05aa5ba4d92c25e",
    "id": null,
    "metadata": {},
    "name": "layoutUserPageLoaderQuery",
    "operationKind": "query",
    "text": "query layoutUserPageLoaderQuery(\n  $login: String!\n  $isFork: Boolean\n  $orderBy: RepositoryOrder\n  $starOrder: StarOrder\n  $ownedByViewer: Boolean\n) {\n  user(login: $login) {\n    ...UserInfo\n    ...UserFollowingFragment\n    ...UserFollowersFragment\n    ...UserRepos_repositories_3LFRQw\n    ...UserStarredRepos_repositories_ts4aV\n    id\n  }\n}\n\nfragment RepoCard_repository on Repository {\n  id\n  name\n  nameWithOwner\n  description\n  pushedAt\n  diskUsage\n  url\n  visibility\n  isPrivate\n  isFork\n  stargazerCount\n  forkCount\n  openGraphImageUrl\n  owner {\n    __typename\n    login\n    url\n    avatarUrl\n    id\n  }\n  primaryLanguage {\n    id\n    name\n    color\n  }\n  languages(first: 3) {\n    nodes {\n      id\n      name\n      color\n    }\n  }\n  defaultBranchRef {\n    name\n    id\n  }\n}\n\nfragment UserCard_user on User {\n  id\n  name\n  login\n  bio\n  avatarUrl\n}\n\nfragment UserFollowersFragment on User {\n  followers(first: 12) {\n    edges {\n      cursor\n      node {\n        login\n        name\n        ...UserCard_user\n        id\n        __typename\n      }\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n      hasPreviousPage\n      startCursor\n    }\n    totalCount\n  }\n  id\n}\n\nfragment UserFollowingFragment on User {\n  following(first: 12) {\n    edges {\n      cursor\n      node {\n        login\n        name\n        ...UserCard_user\n        id\n        __typename\n      }\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n      hasPreviousPage\n      startCursor\n    }\n    totalCount\n  }\n  id\n}\n\nfragment UserInfo on User {\n  id\n  name\n  login\n  email\n  bio\n  avatarUrl\n  company\n  twitterUsername\n  createdAt\n  isFollowingViewer\n  viewerIsFollowing\n  isViewer\n  location\n  url\n}\n\nfragment UserRepos_repositories_3LFRQw on User {\n  repositories(first: 24, orderBy: $orderBy, isFork: $isFork) {\n    edges {\n      cursor\n      node {\n        id\n        ...RepoCard_repository\n        __typename\n      }\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n      hasPreviousPage\n      startCursor\n    }\n    totalCount\n  }\n  id\n}\n\nfragment UserStarredRepos_repositories_ts4aV on User {\n  starredRepositories(first: 24, orderBy: $starOrder, ownedByViewer: $ownedByViewer) {\n    totalCount\n    edges {\n      cursor\n      node {\n        id\n        ...RepoCard_repository\n        __typename\n      }\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n      hasPreviousPage\n      startCursor\n    }\n  }\n  id\n}\n"
  }
};
})();

(node as any).hash = "5f4b1ecd11f4ca5e9fd19c9ba7c62a29";

export default node;
