import { QueryClient } from "@tanstack/react-query";

// Memory only: financial records are never persisted in browser storage.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: false, networkMode: "always" },
    mutations: { retry: false, networkMode: "always" },
  },
});
