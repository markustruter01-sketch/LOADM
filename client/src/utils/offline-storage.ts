/**
 * Utility for managing offline storage and data synchronization
 * Implements a local storage caching system for offline functionality
 */

interface CachedItem<T> {
  data: T;
  timestamp: number;
  syncStatus: 'synced' | 'pending';
}

// Types of data that can be cached
export type StorageKey = 
  | 'aircraft-configs' 
  | 'training-modules' 
  | 'documents-templates'
  | 'training-progress'
  | 'pending-submissions';

// Helper function to generate a storage key with prefix to avoid conflicts
const getStorageKey = (key: StorageKey): string => `loadmworkflow_${key}`;

/**
 * Store data in local storage
 */
export function storeOfflineData<T>(key: StorageKey, data: T): void {
  try {
    const item: CachedItem<T> = {
      data,
      timestamp: Date.now(),
      syncStatus: 'synced'
    };
    localStorage.setItem(getStorageKey(key), JSON.stringify(item));
  } catch (error) {
    console.error(`Failed to store offline data for ${key}:`, error);
  }
}

/**
 * Retrieve data from local storage
 */
export function getOfflineData<T>(key: StorageKey): T | null {
  try {
    const storedData = localStorage.getItem(getStorageKey(key));
    if (!storedData) return null;
    
    const item: CachedItem<T> = JSON.parse(storedData);
    return item.data;
  } catch (error) {
    console.error(`Failed to retrieve offline data for ${key}:`, error);
    return null;
  }
}

/**
 * Store a pending change that needs to be synchronized when online
 */
export function storePendingChange<T>(key: StorageKey, data: T): void {
  try {
    const item: CachedItem<T> = {
      data,
      timestamp: Date.now(),
      syncStatus: 'pending'
    };
    localStorage.setItem(getStorageKey(key), JSON.stringify(item));
    
    // Also add to pending changes list
    const pendingKeys = getPendingChanges();
    if (!pendingKeys.includes(key)) {
      pendingKeys.push(key);
      localStorage.setItem('loadmworkflow_pending_changes', JSON.stringify(pendingKeys));
    }
  } catch (error) {
    console.error(`Failed to store pending change for ${key}:`, error);
  }
}

/**
 * Get all keys with pending changes
 */
export function getPendingChanges(): StorageKey[] {
  try {
    const pending = localStorage.getItem('loadmworkflow_pending_changes');
    return pending ? JSON.parse(pending) : [];
  } catch (error) {
    console.error('Failed to get pending changes:', error);
    return [];
  }
}

/**
 * Mark a pending change as synchronized
 */
export function markAsSynced(key: StorageKey): void {
  try {
    // Get the item
    const storedData = localStorage.getItem(getStorageKey(key));
    if (!storedData) return;
    
    // Update sync status
    const item: CachedItem<any> = JSON.parse(storedData);
    item.syncStatus = 'synced';
    localStorage.setItem(getStorageKey(key), JSON.stringify(item));
    
    // Remove from pending list
    const pendingKeys = getPendingChanges().filter(k => k !== key);
    localStorage.setItem('loadmworkflow_pending_changes', JSON.stringify(pendingKeys));
  } catch (error) {
    console.error(`Failed to mark ${key} as synced:`, error);
  }
}

/**
 * Clear all stored offline data
 */
export function clearOfflineData(): void {
  try {
    const keysToRemove = Object.keys(localStorage).filter(
      key => key.startsWith('loadmworkflow_')
    );
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear offline data:', error);
  }
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Add event listeners for online/offline status
 */
export function setupConnectivityListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  // Add event listeners
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  // Return a cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}