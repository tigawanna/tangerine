/**
 * @generated SignedSource<<c8c36a2e54d5de0c5b4a636ad1f3c7c2>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type SocialAccountProvider = "FACEBOOK" | "GENERIC" | "HOMETOWN" | "INSTAGRAM" | "LINKEDIN" | "MASTODON" | "NPM" | "REDDIT" | "TWITCH" | "TWITTER" | "YOUTUBE" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type UserInfo$data = {
  readonly avatarUrl: string;
  readonly bio: string | null | undefined;
  readonly company: string | null | undefined;
  readonly createdAt: string;
  readonly email: string;
  readonly id: string;
  readonly location: string | null | undefined;
  readonly login: string;
  readonly name: string | null | undefined;
  readonly socialAccounts: {
    readonly nodes: ReadonlyArray<{
      readonly displayName: string;
      readonly provider: SocialAccountProvider;
      readonly url: string;
    } | null | undefined> | null | undefined;
  };
  readonly topRepositories: {
    readonly nodes: ReadonlyArray<{
      readonly primaryLanguage: {
        readonly color: string | null | undefined;
        readonly id: string;
        readonly name: string;
      } | null | undefined;
    } | null | undefined> | null | undefined;
  };
  readonly twitterUsername: string | null | undefined;
  readonly url: string;
  readonly websiteUrl: string | null | undefined;
  readonly " $fragmentSpreads": FragmentRefs<"FollowUserButton_user">;
  readonly " $fragmentType": "UserInfo";
};
export type UserInfo$key = {
  readonly " $data"?: UserInfo$data;
  readonly " $fragmentSpreads": FragmentRefs<"UserInfo">;
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
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "UserInfo",
  "selections": [
    (v0/*:: as any*/),
    (v1/*:: as any*/),
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
      "name": "email",
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
    },
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
      "name": "location",
      "storageKey": null
    },
    (v2/*:: as any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "websiteUrl",
      "storageKey": null
    },
    {
      "alias": null,
      "args": [
        {
          "kind": "Literal",
          "name": "first",
          "value": 8
        }
      ],
      "concreteType": "SocialAccountConnection",
      "kind": "LinkedField",
      "name": "socialAccounts",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "SocialAccount",
          "kind": "LinkedField",
          "name": "nodes",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "provider",
              "storageKey": null
            },
            (v2/*:: as any*/),
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "displayName",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": "socialAccounts(first:8)"
    },
    {
      "alias": null,
      "args": [
        {
          "kind": "Literal",
          "name": "first",
          "value": 20
        },
        {
          "kind": "Literal",
          "name": "orderBy",
          "value": {
            "direction": "DESC",
            "field": "UPDATED_AT"
          }
        }
      ],
      "concreteType": "RepositoryConnection",
      "kind": "LinkedField",
      "name": "topRepositories",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "Repository",
          "kind": "LinkedField",
          "name": "nodes",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "concreteType": "Language",
              "kind": "LinkedField",
              "name": "primaryLanguage",
              "plural": false,
              "selections": [
                (v0/*:: as any*/),
                (v1/*:: as any*/),
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "color",
                  "storageKey": null
                }
              ],
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": "topRepositories(first:20,orderBy:{\"direction\":\"DESC\",\"field\":\"UPDATED_AT\"})"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "FollowUserButton_user"
    }
  ],
  "type": "User",
  "abstractKey": null
};
})();

(node as any).hash = "c7775e03f4c2d8c77f576b3b97a47fd4";

export default node;
