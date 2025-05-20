import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  isOnline, 
  getPendingOperations, 
  storePendingOperation, 
  removePendingOperation,
  PendingOperation
} from '@/utils/offline-storage';

interface OfflineContextType {
  isOnline: boolean;
  hasPendingChanges: boolean;
  registerServiceWorker: () => void;
  syncPendingChanges: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
  const [online, setOnline] = useState(isOnline());
  const [pendingChanges, setPendingChanges] = useState<PendingOperation[]>([]);

  // Update online status when it changes
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for pending changes periodically
  useEffect(() => {
    const checkPendingChanges = () => {
      const operations = getPendingOperations();
      setPendingChanges(operations);
    };

    // Check initially and then every 5 seconds
    checkPendingChanges();
    const interval = setInterval(checkPendingChanges, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Attempt to sync when we come back online
  useEffect(() => {
    if (online && pendingChanges.length > 0) {
      syncPendingChanges();
    }
  }, [online, pendingChanges.length]);

  // Register the service worker
  const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Listen for messages from the service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'SYNC_COMPLETE') {
              // Refresh pending changes when sync is complete
              setPendingChanges(getPendingOperations());
            }
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  };

  // Sync pending changes with the server
  const syncPendingChanges = async () => {
    if (!online || pendingChanges.length === 0) return;

    // Send a message to the service worker to start syncing
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_PENDING_DATA'
      });
    } else {
      console.warn('No active service worker found for syncing data');
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline: online,
        hasPendingChanges: pendingChanges.length > 0,
        registerServiceWorker,
        syncPendingChanges
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};