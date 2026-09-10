/**
 * @generated SignedSource<<ce3ead3cec5b031bd4dd2926d8ae71d4>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UnfollowUserInput = {
  clientMutationId?: string | null | undefined;
  userId: string;
};
export type FollowUserButtonunfollowMutation$variables = {
  input: UnfollowUserInput;
};
export type FollowUserButtonunfollowMutation$data = {
  readonly unfollowUser: {
    readonly clientMutationId: string | null | undefined;
  } | null | undefined;
};
export type FollowUserButtonunfollowMutation = {
  response: FollowUserButtonunfollowMutation$data;
  variables: FollowUserButtonunfollowMutation$variables;
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
    "concreteType": "UnfollowUserPayload",
    "kind": "LinkedField",
    "name": "unfollowUser",
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
    "name": "FollowUserButtonunfollowMutation",
    "selections": (v1/*:: as any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "FollowUserButtonunfollowMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "81e8580f1350a40f79888c35f355ef63",
    "id": null,
    "metadata": {},
    "name": "FollowUserButtonunfollowMutation",
    "operationKind": "mutation",
    "text": "mutation FollowUserButtonunfollowMutation(\n  $input: UnfollowUserInput!\n) {\n  unfollowUser(input: $input) {\n    clientMutationId\n  }\n}\n"
  }
};
})();

(node as any).hash = "8a28513b09b6291b8d80c9ae4676b374";

export default node;
