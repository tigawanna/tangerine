import { getElysiaTreaty } from "@/elysia/treaty";
import { useQuery } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";

export function Scratchpad() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["scratchpad"],
    queryFn: () => {
      return getElysiaTreaty().enrich.mine.realtime.get();
    },
  });
  console.log(data);
  return (
    <div className="w-full min-h-screen h-full flex flex-col items-center justify-center">
      <RefreshCcw
        onClick={async () => {
          await refetch();
        }}
        data-loading={isRefetching}
        className="w-4 h-4 data-[loading=true]:animate-spin"
      />
      scratchpad
      {JSON.stringify(data, null, 2)}
      {isLoading && <div>Loading...</div>}
      {isRefetching && <div>Refetching...</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
