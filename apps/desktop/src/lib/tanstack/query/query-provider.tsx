import { getQueryClient } from "@/lib/tanstack/query/queryclient";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function getTanstackQueryContext() {
  return {
    queryClient: getQueryClient(),
  };
}

export function TanstackQueryProvider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
