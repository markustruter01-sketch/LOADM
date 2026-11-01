import { QueryClient } from "@tanstack/react-query";
import { get, ApiError } from "./api";

/**
 * Default query function: `queryKey[0]` is the URL. Keys are built with the
 * helpers in `@/lib/keys` so invalidation always matches.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey, signal }) => {
        const url = queryKey[0];
        if (typeof url !== "string") throw new Error("queryKey[0] must be a URL string");
        return get(url, signal);
      },
      staleTime: 15_000,
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: 0 },
  },
});
