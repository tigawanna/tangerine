/**
 * @generated SignedSource<<a3d7f0b7762f52990a27bb268390842f>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type UserStarredRepos_repositories$data = {
  readonly id: string;
  readonly starredRepositories: {
    readonly edges: ReadonlyArray<{
      readonly cursor: string;
      readonly node: {
        readonly id: string;
        readonly " $fragmentSpreads": FragmentRefs<"RepoCard_repository">;
      };
    } | null | undefined> | null | undefined;
    readonly pageInfo: {
      readonly endCursor: string | null | undefined;
      readonly hasNextPage: boolean;
      readonly hasPreviousPage: boolean;
      readonly startCursor: string | null | undefined;
    };
    readonly totalCount: number;
  };
  readonly " $fragmentType": "UserStarredRepos_repositories";
};
export type UserStarredRepos_repositories$key = {
  readonly " $data"?: UserStarredRepos_repositories$data;
  readonly " $fragmentSpreads": FragmentRefs<"UserStarredRepos_repositories">;
};

import StarredRepositoriesPaginationQuery_graphql from './StarredRepositoriesPaginationQuery.graphql';

const node: ReaderFragment = (function(){
var v0 = [
  "starredRepositories"
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "argumentDefinitions": [
    {
      "defaultValue": null,
      "kind": "LocalArgument",
      "name": "afterStarredRepo"
    },
    {
      "defaultValue": 24,
      "kind": "LocalArgument",
      "name": "firstStarredRepos"
    },
    {
      "defaultValue": {
        "direction": "DESC",
        "field": "STARRED_AT"
      },
      "kind": "LocalArgument",
      "name": "orderByStarredRepos"
    }
  ],
  "kind": "Fragment",
  "metadata": {
    "connection": [
      {
        "count": "firstStarredRepos",
        "cursor": "afterStarredRepo",
        "direction": "forward",
        "path": (v0/*:: as any*/)
      }
    ],
    "refetch": {
      "connection": {
        "forward": {
          "count": "firstStarredRepos",
          "cursor": "afterStarredRepo"
        },
        "backward": null,
        "path": (v0/*:: as any*/)
      },
      "fragmentPathInResult": [
        "node"
      ],
      "operation": StarredRepositoriesPaginationQuery_graphql,
      "identifierInfo": {
        "identifierField": "id",
        "identifierQueryVariableName": "id"
      }
    }
  },
  "name": "UserStarredRepos_repositories",
  "selections": [
    {
      "alias": "starredRepositories",
      "args": [
        {
          "kind": "Variable",
          "name": "orderBy",
          "variableName": "orderByStarredRepos"
        }
      ],
      "concreteType": "StarredRepositoryConnection",
      "kind": "LinkedField",
      "name": "__UserStarredRepos_starredRepositories_connection",
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
                (v1/*:: as any*/),
                {
                  "args": null,
                  "kind": "FragmentSpread",
                  "name": "RepoCard_repository"
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "__typename",
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
    (v1/*:: as any*/)
  ],
  "type": "User",
  "abstractKey": null
};
})();

(node as any).hash = "e708489297d9e11aa1159b1f396d44fa";

export default node;
