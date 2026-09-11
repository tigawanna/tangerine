/**
 * @generated SignedSource<<4f9f3f20eb93a8df819ce9e0e259dca3>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
export type RepoCardStarButtonRemoveStarMutation$variables = {
  starrableId: string;
};
export type RepoCardStarButtonRemoveStarMutation$data = {
  readonly removeStar:
    | {
        readonly starrable:
          | {
              readonly id: string;
              readonly stargazerCount: number;
              readonly viewerHasStarred: boolean;
            }
          | null
          | undefined;
      }
    | null
    | undefined;
};
export type RepoCardStarButtonRemoveStarMutation = {
  response: RepoCardStarButtonRemoveStarMutation$data;
  variables: RepoCardStarButtonRemoveStarMutation$variables;
};

const node: ConcreteRequest = (function () {
  var v0 = [
      {
        defaultValue: null,
        kind: "LocalArgument",
        name: "starrableId",
      },
    ],
    v1 = [
      {
        fields: [
          {
            kind: "Variable",
            name: "starrableId",
            variableName: "starrableId",
          },
        ],
        kind: "ObjectValue",
        name: "input",
      },
    ],
    v2 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "id",
      storageKey: null,
    },
    v3 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "stargazerCount",
      storageKey: null,
    },
    v4 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "viewerHasStarred",
      storageKey: null,
    };
  return {
    fragment: {
      argumentDefinitions: v0 /*:: as any*/,
      kind: "Fragment",
      metadata: null,
      name: "RepoCardStarButtonRemoveStarMutation",
      selections: [
        {
          alias: null,
          args: v1 /*:: as any*/,
          concreteType: "RemoveStarPayload",
          kind: "LinkedField",
          name: "removeStar",
          plural: false,
          selections: [
            {
              alias: null,
              args: null,
              concreteType: null,
              kind: "LinkedField",
              name: "starrable",
              plural: false,
              selections: [v2 /*:: as any*/, v3 /*:: as any*/, v4 /*:: as any*/],
              storageKey: null,
            },
          ],
          storageKey: null,
        },
      ],
      type: "Mutation",
      abstractKey: null,
    },
    kind: "Request",
    operation: {
      argumentDefinitions: v0 /*:: as any*/,
      kind: "Operation",
      name: "RepoCardStarButtonRemoveStarMutation",
      selections: [
        {
          alias: null,
          args: v1 /*:: as any*/,
          concreteType: "RemoveStarPayload",
          kind: "LinkedField",
          name: "removeStar",
          plural: false,
          selections: [
            {
              alias: null,
              args: null,
              concreteType: null,
              kind: "LinkedField",
              name: "starrable",
              plural: false,
              selections: [
                {
                  alias: null,
                  args: null,
                  kind: "ScalarField",
                  name: "__typename",
                  storageKey: null,
                },
                v2 /*:: as any*/,
                v3 /*:: as any*/,
                v4 /*:: as any*/,
              ],
              storageKey: null,
            },
          ],
          storageKey: null,
        },
      ],
    },
    params: {
      cacheID: "8009bbcc6ea2afa90231667e38d59efd",
      id: null,
      metadata: {},
      name: "RepoCardStarButtonRemoveStarMutation",
      operationKind: "mutation",
      text: "mutation RepoCardStarButtonRemoveStarMutation(\n  $starrableId: ID!\n) {\n  removeStar(input: {starrableId: $starrableId}) {\n    starrable {\n      __typename\n      id\n      stargazerCount\n      viewerHasStarred\n    }\n  }\n}\n",
    },
  };
})();

(node as any).hash = "47bf4e7a08264e0d7f911d1bec6d285e";

export default node;
