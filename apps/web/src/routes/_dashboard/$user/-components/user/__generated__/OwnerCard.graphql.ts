/**
 * @generated SignedSource<<96d82c694537c17c6ac57256be7d9414>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type OwnerCard$data = {
  readonly __typename: string;
  readonly avatarUrl: string;
  readonly login: string;
  readonly url: string;
  readonly " $fragmentType": "OwnerCard";
};
export type OwnerCard$key = {
  readonly " $data"?: OwnerCard$data;
  readonly " $fragmentSpreads": FragmentRefs<"OwnerCard">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "OwnerCard",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "__typename",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "login",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "avatarUrl",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "url",
      "storageKey": null
    }
  ],
  "type": "RepositoryOwner",
  "abstractKey": "__isRepositoryOwner"
};

(node as any).hash = "cae81493dfee9788b726e0034283b587";

export default node;
