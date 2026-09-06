/**
 * @generated SignedSource<<3019842f19489a1e6325322adb9c4a3e>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type FollowUserButton_user$data = {
  readonly id: string;
  readonly isFollowingViewer: boolean;
  readonly isViewer: boolean;
  readonly login: string;
  readonly viewerIsFollowing: boolean;
  readonly " $fragmentType": "FollowUserButton_user";
};
export type FollowUserButton_user$key = {
  readonly " $data"?: FollowUserButton_user$data;
  readonly " $fragmentSpreads": FragmentRefs<"FollowUserButton_user">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FollowUserButton_user",
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
      "name": "login",
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
};

(node as any).hash = "68b416a80685e87eff4ae572e045bd17";

export default node;
