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
      // 503 = server still setting up demo data on first boot: keep waiting.
      retry: (count, err) => {
        if (err instanceof ApiError && err.status === 503) return count < 30;
        return !(err instanceof ApiError && err.status < 500) && count < 2;
      },
      retryDelay: (attempt, err) => (err instanceof ApiError && err.status === 503 ? 3000 : Math.min(1000 * 2 ** attempt, 8000)),
      refetchOnWindowFocus: true,
    },
    mutations: { retry: 0 },
  },
});
