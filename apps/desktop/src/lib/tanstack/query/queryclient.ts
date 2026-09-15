import { QueryClient } from "@tanstack/react-query";

let queryClientInstance: QueryClient | null = null;

/** Shared QueryClient for React Query + TanStack DB collections. */
export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          refetchOnWindowFocus: false,
        },
      },
    });
  }
  return queryClientInstance;
}
