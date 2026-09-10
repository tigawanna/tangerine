/**
 * @generated SignedSource<<843dd8351e2c83fd7ac656048943dbcc>>
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
export type FollowBackAllButtonMutation$variables = {
  input: FollowUserInput;
};
export type FollowBackAllButtonMutation$data = {
  readonly followUser: {
    readonly clientMutationId: string | null | undefined;
  } | null | undefined;
};
export type FollowBackAllButtonMutation = {
  response: FollowBackAllButtonMutation$data;
  variables: FollowBackAllButtonMutation$variables;
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
    "name": "FollowBackAllButtonMutation",
    "selections": (v1/*:: as any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "FollowBackAllButtonMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "abc0d98be469b8fdb4522525e1b9d7af",
    "id": null,
    "metadata": {},
    "name": "FollowBackAllButtonMutation",
    "operationKind": "mutation",
    "text": "mutation FollowBackAllButtonMutation(\n  $input: FollowUserInput!\n) {\n  followUser(input: $input) {\n    clientMutationId\n  }\n}\n"
  }
};
})();

(node as any).hash = "1150ca63ff15182947d1aa9f1a2190bd";

export default node;
