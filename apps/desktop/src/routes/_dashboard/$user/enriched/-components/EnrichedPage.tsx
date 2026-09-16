import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnrichedConsole } from "@/routes/_dashboard/$user/enriched/-components/console/EnrichedConsole.tsx";
import {
  enrichedRouteID,
  enrichedTabs,
} from "@/routes/_dashboard/$user/enriched/-components/constants.ts";
import { EnrichedStarred } from "@/routes/_dashboard/$user/enriched/-components/starred/EnrichedStarred.tsx";
import { EnrichedMine } from "@/routes/_dashboard/$user/enriched/-components/mine/EnrichedMine.tsx";
import { getRouteApi } from "@tanstack/react-router";
import { Activity, startTransition } from "react";

type EnrichedTab = (typeof enrichedTabs)[number];

export function EnrichedPage() {
  const { useSearch, useNavigate } = getRouteApi(enrichedRouteID);
  const { tab } = useSearch();
  const navigate = useNavigate();

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        startTransition(() => {
          void navigate({
            search: (prev) => ({
              ...prev,
              tab: next as EnrichedTab,
            }),
            replace: true,
          });
        });
      }}
      className="h-full w-full"
    >
      <TabsList className="w-full">
        {enrichedTabs.map((value) => (
          <TabsTrigger key={value} value={value}>
            {value}
          </TabsTrigger>
        ))}
      </TabsList>
      <Activity mode={tab === "console" ? "visible" : "hidden"}>
        <EnrichedConsole />
      </Activity>
      <Activity mode={tab === "starred" ? "visible" : "hidden"}>
        <EnrichedStarred />
      </Activity>
      <Activity mode={tab === "mine" ? "visible" : "hidden"}>
        <EnrichedMine />
      </Activity>
    </Tabs>
  );
}
