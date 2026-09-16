import { PaginatedListScaffold } from "@/components/pagination/PaginatedListScaffold.tsx";
import { helloCollection } from "@/data-access-layer/enriched/hello-collection.ts";
import { useHelloSse } from "@/hooks/use-hello-sse.ts";
import { PingMessage } from "@/routes/_dashboard/$user/hello/-components/PingMessage.tsx";
import { useLiveQuery } from "@tanstack/react-db";
import { Loader } from "lucide-react";

const routeID = "/_dashboard/$user/hello/" as const;

export function HelloPage() {
  useHelloSse();

  const { data, isLoading } = useLiveQuery((q) => q.from({ hello: helloCollection }));

  if (isLoading)
    return (
      <PaginatedListScaffold
        routeID={routeID}
        title="Hello"
        description="Hello SSE demo"
        searchPlaceholder="Search messages">
        <div
          className="h-full minh-screen w-full flex justify-center items-center gap-6"
          data-test="hello-page">
          <Loader className="h-4 w-4 animate-spin" />
        </div>
      </PaginatedListScaffold>
    );

  return (
    <PaginatedListScaffold
      routeID={routeID}
      title="Hello"
      description="Hello SSE demo"
      searchPlaceholder="Search messages">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6" data-test="hello-page">
        <ul>
          {data?.map((item) => (
            <li key={item.id}>
              <div className="hover:bg-muted/50 transition-colors">
                <div className="p-4">
                  <p className="text-sm font-medium">{`${item.message}`}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <PingMessage />
      </div>
    </PaginatedListScaffold>
  );
}
