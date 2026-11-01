import { QueryClient } from "@tanstack/react-query";
import { get, ApiError } from "./api";
import { urlOf } from "./keys";

/**
 * Default query function: the last key element is the URL. Keys are built with the
 * helpers in `@/lib/keys` so invalidation always matches.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey, signal }) => get(urlOf(queryKey), signal),
      staleTime: 15_000,
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: 0 },
  },
});
