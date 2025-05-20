import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getOfflineData, storeOfflineData, isOnline, OfflineStorageKey } from "@/utils/offline-storage";

// Modified query function that supports offline functionality
export const offlineQueryFn = <T,>(options: {
  cacheable?: boolean;
  storageKey?: OfflineStorageKey;
}): QueryFunction<T> => {
  const { cacheable = false, storageKey } = options;
  
  return async (context) => {
    const { queryKey } = context;
    // Check if we're online
    const online = isOnline();
    const endpoint = queryKey[0] as string;
    
    // For endpoints that can be cached/used offline
    if (cacheable && storageKey) {
      try {
        // Try to get from network if online
        if (online) {
          const res = await fetch(endpoint, {
            credentials: "include",
          });
          
          if (!res.ok) {
            throw new Error(`${res.status}: ${res.statusText}`);
          }
          
          const data = await res.json();
          
          // Store the successful response for offline use
          storeOfflineData(storageKey as any, data);
          
          return data;
        } else {
          // We're offline, try to get from cache
          const cachedData = getOfflineData<T>(storageKey as any);
          
          if (cachedData) {
            return cachedData;
          }
          
          throw new Error('You are offline and no cached data is available');
        }
      } catch (error) {
        // If we're offline, try to get from cache as fallback
        if (!online) {
          const cachedData = getOfflineData<T>(storageKey as any);
          if (cachedData) {
            return cachedData;
          }
        }
        
        throw error;
      }
    }
    
    // For non-cacheable endpoints or when no storage key provided
    const res = await fetch(endpoint, {
      credentials: "include",
    });
    
    if (!res.ok) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }
    
    return await res.json();
  };

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
export function getOfflineOptions(endpoint: string): { cacheable?: boolean; storageKey?: OfflineStorageKey } {
  for (const [key, options] of Object.entries(offlineEnabledEndpoints)) {
    if (endpoint.startsWith(key)) {
      return options;
    }
  }
  return { cacheable: false };
}

// Create a query client with offline support
export const createOfflineQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: async ({ queryKey, signal, meta }) => {
          const endpoint = queryKey[0] as string;
          
          // Use offline-specific query function for supported endpoints
          if (isOfflineEnabledEndpoint(endpoint)) {
            const options = getOfflineOptions(endpoint);
            return offlineQueryFn(options)({ queryKey, signal, meta } as any);
          }
          
          // Default query function for online-only endpoints
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
};