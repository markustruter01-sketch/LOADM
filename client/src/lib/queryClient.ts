import { QueryClient } from '@tanstack/react-query';

// Enhanced API request function with proper session handling
export async function apiRequest(options: {
  url: string;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}) {
  const { url, method = 'GET', body, headers = {} } = options;
  
  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed: ${response.status} - ${errorText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = Array.isArray(queryKey) ? queryKey[0] : queryKey;
        const response = await fetch(url as string, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        
        return response.json();
      },
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Export for compatibility with offline system
export const getQueryFn = () => async ({ queryKey }: { queryKey: string[] }) => {
  const url = Array.isArray(queryKey) ? queryKey[0] : queryKey;
  const response = await fetch(url as string, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.status}`);
  }
  
  return response.json();
};

// Create offline query client function (expected by App.tsx)
export const createOfflineQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: async ({ queryKey }) => {
          const url = Array.isArray(queryKey) ? queryKey[0] : queryKey;
          const response = await fetch(url as string, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
          }
          
          return response.json();
        },
        retry: 1,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
};
