import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getOfflineData, storeOfflineData, isOnline, OfflineStorageKey } from "@/utils/offline-storage";

// List of endpoints that support offline functionality
export const offlineEnabledEndpoints: Record<string, { cacheable: boolean; storageKey: OfflineStorageKey }> = {
  // Training modules
  '/api/training-modules': {
    cacheable: true,
    storageKey: 'training-modules'
  },
  
  // Aircraft configurations
  '/api/aircraft-configs': {
    cacheable: true,
    storageKey: 'aircraft-configs'
  },
  
  // Documents templates
  '/api/document-templates': {
    cacheable: true,
    storageKey: 'documents-templates'
  },
  
  // Load planning tools
  '/api/tools': {
    cacheable: true,
    storageKey: 'tools-calculators'
  }
};

// Helper to check if an endpoint supports offline mode
export function isOfflineEnabledEndpoint(endpoint: string): boolean {
  return Object.keys(offlineEnabledEndpoints).some(key => endpoint.startsWith(key));
}

// Helper to get offline options for an endpoint
export function getOfflineOptions(endpoint: string): { cacheable: boolean; storageKey?: OfflineStorageKey } {
  for (const [key, options] of Object.entries(offlineEnabledEndpoints)) {
    if (endpoint.startsWith(key)) {
      return options;
    }
  }
  return { cacheable: false };
}

// Create a query client that supports offline mode
export function createOfflineQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: async (context) => {
          const { queryKey, signal } = context;
          const endpoint = queryKey[0] as string;
          
          // If this endpoint supports offline mode
          if (isOfflineEnabledEndpoint(endpoint)) {
            const options = getOfflineOptions(endpoint);
            const online = isOnline();
            
            // Try to get from network if online
            if (online && options.cacheable) {
              try {
                const res = await fetch(endpoint, {
                  credentials: "include",
                  signal
                });
                
                if (!res.ok) {
                  throw new Error(`${res.status}: ${res.statusText}`);
                }
                
                const data = await res.json();
                
                // Store successful response for offline use
                if (options.storageKey) {
                  storeOfflineData(options.storageKey, data);
                }
                
                return data;
              } catch (error) {
                // If offline and we have cached data, use it
                if (!online && options.storageKey) {
                  const cachedData = getOfflineData(options.storageKey);
                  if (cachedData) {
                    return cachedData;
                  }
                }
                throw error;
              }
            } 
            // We're offline, try to get from cache
            else if (!online && options.cacheable && options.storageKey) {
              const cachedData = getOfflineData(options.storageKey);
              if (cachedData) {
                return cachedData;
              }
              throw new Error('You are offline and no cached data is available');
            }
          }
          
          // Default online-only behavior
          const res = await fetch(endpoint, {
            credentials: "include",
            signal
          });
          
          if (!res.ok) {
            throw new Error(`${res.status}: ${res.statusText}`);
          }
          
          return res.json();
        },
        refetchInterval: false,
        refetchOnWindowFocus: false,
        staleTime: 300000, // 5 minutes
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}