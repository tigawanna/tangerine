/**
 * @generated SignedSource<<0923912a524fd95ff2c462b083e6ac9a>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type UserCard_user$data = {
  readonly avatarUrl: string;
  readonly bio: string | null | undefined;
  readonly id: string;
  readonly login: string;
  readonly name: string | null | undefined;
  readonly " $fragmentType": "UserCard_user";
};
export type UserCard_user$key = {
  readonly " $data"?: UserCard_user$data;
  readonly " $fragmentSpreads": FragmentRefs<"UserCard_user">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "UserCard_user",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "id",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "name",
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
      "name": "bio",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "avatarUrl",
      "storageKey": null
    }
  ],
  "type": "User",
  "abstractKey": null
};

(node as any).hash = "64b5004b96836e4f3dd0f914598da365";

export default node;
