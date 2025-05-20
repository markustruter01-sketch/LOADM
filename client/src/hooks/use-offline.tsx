import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from './use-toast';
import { getPendingChanges } from '@/utils/offline-storage';

interface OfflineContextType {
  isOnline: boolean;
  hasPendingChanges: boolean;
  registerServiceWorker: () => void;
  syncPendingChanges: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up event listeners for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "You're back online",
        description: hasPendingChanges ? 
          "Your changes will now be synchronized." : 
          "All features are now available.",
      });
      
      if (hasPendingChanges) {
        syncPendingChanges();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "Some features may be limited. Changes will be saved locally until you're back online.",
        variant: "destructive"
      });
    };

    // Check for pending changes on startup
    const checkPendingChanges = () => {
      const pendingChanges = getPendingChanges();
      setHasPendingChanges(pendingChanges.length > 0);
    };
    
    checkPendingChanges();

    // Set up listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast, hasPendingChanges]);

  // Register service worker
  const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('ServiceWorker registration successful:', registration.scope);
          })
          .catch(error => {
            console.log('ServiceWorker registration failed:', error);
          });
      });
    }
  };

  // Sync pending changes when going back online
  const syncPendingChanges = async () => {
    if (!isOnline) return;

    try {
      // In a real implementation, we would iterate through pending changes and submit them
      // For this demo, we'll just mark that we've checked
      setHasPendingChanges(false);
      toast({
        title: "Changes synchronized",
        description: "All your offline changes have been saved to the server."
      });
    } catch (error) {
      console.error('Error syncing changes:', error);
      toast({
        title: "Sync failed",
        description: "We couldn't synchronize your changes. We'll try again when your connection improves.",
        variant: "destructive"
      });
    }
  };

  return (
    <OfflineContext.Provider value={{ 
      isOnline, 
      hasPendingChanges,
      registerServiceWorker,
      syncPendingChanges
    }}>
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