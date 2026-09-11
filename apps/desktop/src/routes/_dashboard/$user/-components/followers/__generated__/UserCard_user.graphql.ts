/**
 * @generated SignedSource<<eda7fecde31a757ff8f7f8109b949c0c>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type UserCard_user$data = {
  readonly avatarUrl: string;
  readonly bio: string | null | undefined;
  readonly id: string;
  readonly login: string;
  readonly name: string | null | undefined;
  readonly " $fragmentSpreads": FragmentRefs<"FollowUserButton_user">;
  readonly " $fragmentType": "UserCard_user";
};
export type UserCard_user$key = {
  readonly " $data"?: UserCard_user$data;
  readonly " $fragmentSpreads": FragmentRefs<"UserCard_user">;
};

const node: ReaderFragment = {
  argumentDefinitions: [],
  kind: "Fragment",
  metadata: null,
  name: "UserCard_user",
  selections: [
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "id",
      storageKey: null,
    },
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "name",
      storageKey: null,
    },
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "login",
      storageKey: null,
    },
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "bio",
      storageKey: null,
    },
    {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "avatarUrl",
      storageKey: null,
    },
    {
      args: null,
      kind: "FragmentSpread",
      name: "FollowUserButton_user",
    },
  ],
  type: "User",
  abstractKey: null,
};

(node as any).hash = "c55ae06cc8efc1376d12c52ea7991d2a";

export default node;
