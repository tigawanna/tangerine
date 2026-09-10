/**
 * @generated SignedSource<<a916ed0cf6dfc62131d78c3bcbb03e3b>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type RepoGeneralInfo_repository$data = {
  readonly description: string | null | undefined;
  readonly diskUsage: number | null | undefined;
  readonly forkCount: number;
  readonly hasDiscussionsEnabled: boolean;
  readonly hasIssuesEnabled: boolean;
  readonly hasProjectsEnabled: boolean;
  readonly hasWikiEnabled: boolean;
  readonly homepageUrl: string | null | undefined;
  readonly id: string;
  readonly isArchived: boolean;
  readonly isDisabled: boolean;
  readonly isFork: boolean;
  readonly isLocked: boolean;
  readonly isPrivate: boolean;
  readonly isTemplate: boolean;
  readonly isUserConfigurationRepository: boolean;
  readonly languages: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly color: string | null | undefined;
        readonly id: string;
        readonly name: string;
      };
      readonly size: number;
    } | null | undefined> | null | undefined;
    readonly totalSize: number;
  } | null | undefined;
  readonly name: string;
  readonly nameWithOwner: string;
  readonly openGraphImageUrl: string;
  readonly pushedAt: string | null | undefined;
  readonly repositoryTopics: {
    readonly nodes: ReadonlyArray<{
      readonly id: string;
      readonly topic: {
        readonly name: string;
      };
    } | null | undefined> | null | undefined;
  };
  readonly stargazerCount: number;
  readonly updatedAt: string;
  readonly url: string;
  readonly viewerHasStarred: boolean;
  readonly " $fragmentSpreads": FragmentRefs<"EditRepoSettings_repository">;
  readonly " $fragmentType": "RepoGeneralInfo_repository";
};
export type RepoGeneralInfo_repository$key = {
  readonly " $data"?: RepoGeneralInfo_repository$data;
  readonly " $fragmentSpreads": FragmentRefs<"RepoGeneralInfo_repository">;
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
v2 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 20
  }
];
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "RepoGeneralInfo_repository",
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
      "name": "url",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "homepageUrl",
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
      "kind": "ScalarField",
      "name": "pushedAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "updatedAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "diskUsage",
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
      "name": "stargazerCount",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "viewerHasStarred",
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
      "name": "isArchived",
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
      "name": "isLocked",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "isDisabled",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "isTemplate",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "isUserConfigurationRepository",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "hasIssuesEnabled",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "hasDiscussionsEnabled",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "hasProjectsEnabled",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "hasWikiEnabled",
      "storageKey": null
    },
    {
      "alias": null,
      "args": (v2/*:: as any*/),
      "concreteType": "RepositoryTopicConnection",
      "kind": "LinkedField",
      "name": "repositoryTopics",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "RepositoryTopic",
          "kind": "LinkedField",
          "name": "nodes",
          "plural": true,
          "selections": [
            (v0/*:: as any*/),
            {
              "alias": null,
              "args": null,
              "concreteType": "Topic",
              "kind": "LinkedField",
              "name": "topic",
              "plural": false,
              "selections": [
                (v1/*:: as any*/)
              ],
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": "repositoryTopics(first:20)"
    },
    {
      "alias": null,
      "args": (v2/*:: as any*/),
      "concreteType": "LanguageConnection",
      "kind": "LinkedField",
      "name": "languages",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "totalSize",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "LanguageEdge",
          "kind": "LinkedField",
          "name": "edges",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "size",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "concreteType": "Language",
              "kind": "LinkedField",
              "name": "node",
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
      "storageKey": "languages(first:20)"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "EditRepoSettings_repository"
    }
  ],
  "type": "Repository",
  "abstractKey": null
};
})();

(node as any).hash = "8e49b9cf9a974a3afeecb71b97cad49a";

export default node;
