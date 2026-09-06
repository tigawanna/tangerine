/**
 * @generated SignedSource<<c29c6a11bff815e5be6cd428bb5e187b>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type SearchUsersQuery$variables = {
  query: string;
};
export type SearchUsersQuery$data = {
  readonly search: {
    readonly edges: ReadonlyArray<{
      readonly cursor: string;
      readonly node: {
        readonly organization: {
          readonly " $fragmentSpreads": FragmentRefs<"SearchListOrgCard_organization">;
        } | null | undefined;
        readonly user: {
          readonly " $fragmentSpreads": FragmentRefs<"UserCard_user">;
        } | null | undefined;
      } | null | undefined;
    } | null | undefined> | null | undefined;
    readonly userCount: number;
  };
};
export type SearchUsersQuery = {
  response: SearchUsersQuery$data;
  variables: SearchUsersQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "query"
  }
],
v1 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 24
  },
  {
    "kind": "Variable",
    "name": "query",
    "variableName": "query"
  },
  {
    "kind": "Literal",
    "name": "type",
    "value": "USER"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "userCount",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "login",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "avatarUrl",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "SearchUsersQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*:: as any*/),
        "concreteType": "SearchResultItemConnection",
        "kind": "LinkedField",
        "name": "search",
        "plural": false,
        "selections": [
          (v2/*:: as any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "SearchResultItemEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              (v3/*:: as any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": null,
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  {
                    "fragment": {
                      "kind": "InlineFragment",
                      "selections": [
                        {
                          "args": null,
                          "kind": "FragmentSpread",
                          "name": "UserCard_user"
                        }
                      ],
                      "type": "User",
                      "abstractKey": null
                    },
                    "kind": "AliasedInlineFragmentSpread",
                    "name": "user"
                  },
                  {
                    "fragment": {
                      "kind": "InlineFragment",
                      "selections": [
                        {
                          "args": null,
                          "kind": "FragmentSpread",
                          "name": "SearchListOrgCard_organization"
                        }
                      ],
                      "type": "Organization",
                      "abstractKey": null
                    },
                    "kind": "AliasedInlineFragmentSpread",
                    "name": "organization"
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
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
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "SearchUsersQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*:: as any*/),
        "concreteType": "SearchResultItemConnection",
        "kind": "LinkedField",
        "name": "search",
        "plural": false,
        "selections": [
          (v2/*:: as any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "SearchResultItemEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              (v3/*:: as any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": null,
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "__typename",
                    "storageKey": null
                  },
                  {
                    "kind": "InlineFragment",
                    "selections": [
                      (v4/*:: as any*/),
                      (v5/*:: as any*/),
                      (v6/*:: as any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "bio",
                        "storageKey": null
                      },
                      (v7/*:: as any*/),
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
                        "name": "isFollowingViewer",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "viewerIsFollowing",
                        "storageKey": null
                      }
                    ],
                    "type": "User",
                    "abstractKey": null
                  },
                  {
                    "kind": "InlineFragment",
                    "selections": [
                      (v4/*:: as any*/),
                      (v6/*:: as any*/),
                      (v5/*:: as any*/),
                      (v7/*:: as any*/)
                    ],
                    "type": "Organization",
                    "abstractKey": null
                  },
                  {
                    "kind": "InlineFragment",
                    "selections": [
                      (v4/*:: as any*/)
                    ],
                    "type": "Node",
                    "abstractKey": "__isNode"
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "79f9abc8d4080498f4c679d81ff71379",
    "id": null,
    "metadata": {},
    "name": "SearchUsersQuery",
    "operationKind": "query",
    "text": "query SearchUsersQuery(\n  $query: String!\n) {\n  search(first: 24, query: $query, type: USER) {\n    userCount\n    edges {\n      cursor\n      node {\n        __typename\n        ...UserCard_user\n        ...SearchListOrgCard_organization\n        ... on Node {\n          __isNode: __typename\n          id\n        }\n      }\n    }\n  }\n}\n\nfragment FollowUserButton_user on User {\n  id\n  login\n  isViewer\n  isFollowingViewer\n  viewerIsFollowing\n}\n\nfragment SearchListOrgCard_organization on Organization {\n  id\n  login\n  name\n  avatarUrl\n}\n\nfragment UserCard_user on User {\n  id\n  name\n  login\n  bio\n  avatarUrl\n  ...FollowUserButton_user\n}\n"
  }
};
})();

(node as any).hash = "a6f4ee091b4b07e7764b0665d5d0974d";

export default node;
