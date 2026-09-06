/**
 * @generated SignedSource<<e30b572ddbedf4c531febfadfb2ae133>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type RepositoryVisibility = "INTERNAL" | "PRIVATE" | "PUBLIC" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type RepoCard_repository$data = {
  readonly defaultBranchRef: {
    readonly name: string;
  } | null | undefined;
  readonly description: string | null | undefined;
  readonly diskUsage: number | null | undefined;
  readonly forkCount: number;
  readonly id: string;
  readonly isFork: boolean;
  readonly isPrivate: boolean;
  readonly languages: {
    readonly nodes: ReadonlyArray<{
      readonly color: string | null | undefined;
      readonly id: string;
      readonly name: string;
    } | null | undefined> | null | undefined;
  } | null | undefined;
  readonly name: string;
  readonly nameWithOwner: string;
  readonly openGraphImageUrl: string;
  readonly owner: {
    readonly avatarUrl: string;
    readonly login: string;
    readonly url: string;
  };
  readonly primaryLanguage: {
    readonly color: string | null | undefined;
    readonly id: string;
    readonly name: string;
  } | null | undefined;
  readonly pushedAt: string | null | undefined;
  readonly stargazerCount: number;
  readonly url: string;
  readonly visibility: RepositoryVisibility;
  readonly " $fragmentType": "RepoCard_repository";
};
export type RepoCard_repository$key = {
  readonly " $data"?: RepoCard_repository$data;
  readonly " $fragmentSpreads": FragmentRefs<"RepoCard_repository">;
};

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "url",
  "storageKey": null
},
v3 = [
  (v0/*:: as any*/),
  (v1/*:: as any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "color",
    "storageKey": null
  }
];
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "RepoCard_repository",
  "selections": [
    (v0/*:: as any*/),
    (v1/*:: as any*/),
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
    (v2/*:: as any*/),
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
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "login",
          "storageKey": null
        },
        (v2/*:: as any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "avatarUrl",
          "storageKey": null
        }
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
      "selections": (v3/*:: as any*/),
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
          "selections": (v3/*:: as any*/),
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
        (v1/*:: as any*/)
      ],
      "storageKey": null
    }
  ],
  "type": "Repository",
  "abstractKey": null
};
})();

(node as any).hash = "17a886cc83870e4d444780648f8903ae";

export default node;
