/**
 * @generated SignedSource<<26935b50f69669042050d69fba675d48>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type FollowUserInput = {
  clientMutationId?: string | null | undefined;
  userId: string;
};
export type FollowUserButtonfollowMutation$variables = {
  input: FollowUserInput;
};
export type FollowUserButtonfollowMutation$data = {
  readonly followUser: {
    readonly clientMutationId: string | null | undefined;
  } | null | undefined;
};
export type FollowUserButtonfollowMutation = {
  response: FollowUserButtonfollowMutation$data;
  variables: FollowUserButtonfollowMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "FollowUserPayload",
    "kind": "LinkedField",
    "name": "followUser",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "clientMutationId",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "FollowUserButtonfollowMutation",
    "selections": (v1/*:: as any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "FollowUserButtonfollowMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "dc15d28e7e707d2420c9d631fc600b67",
    "id": null,
    "metadata": {},
    "name": "FollowUserButtonfollowMutation",
    "operationKind": "mutation",
    "text": "mutation FollowUserButtonfollowMutation(\n  $input: FollowUserInput!\n) {\n  followUser(input: $input) {\n    clientMutationId\n  }\n}\n"
  }
};
})();

(node as any).hash = "798773585188e08ae2e522511262b946";

export default node;
