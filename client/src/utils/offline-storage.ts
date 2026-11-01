// Define the structure for different offline data types
export type OfflineStorageKey = 
  | 'training-modules'
  | 'aircraft-configs'
  | 'documents-templates'
  | 'tools-calculators'
  | 'pending-operations';

// Interface for pending operations
export interface PendingOperation {
  id: string; // Unique identifier for the operation
  timestamp: number;
  endpoint: string;
  method: string;
  data?: any;
  status: 'pending' | 'processing' | 'failed';
  retryCount: number;
}

// Check if the browser is online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

// Get data from localStorage
export function getOfflineData<T>(key: OfflineStorageKey): T | null {
  try {
    const item = localStorage.getItem(`loadmaster-offline-${key}`);
    if (!item) return null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error retrieving offline data for ${key}:`, error);
    return null;
  }
}

// Store data in localStorage
export function storeOfflineData<T>(key: OfflineStorageKey, data: T): void {
  try {
    localStorage.setItem(`loadmaster-offline-${key}`, JSON.stringify(data));
  } catch (error) {
    console.error(`Error storing offline data for ${key}:`, error);
  }
}

// Store a pending API operation
export function storePendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>): string {
  try {
    const pendingOps = getOfflineData<PendingOperation[]>('pending-operations') || [];
    
    // Create a new operation with id and timestamp
    const newOp: PendingOperation = {
      ...operation,
      id: generateUniqueId(),
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };
    
    // Store the updated operations list
    storeOfflineData('pending-operations', [...pendingOps, newOp]);
    
    return newOp.id;
  } catch (error) {
    console.error('Error storing pending operation:', error);
    return '';
  }
}

// Get all pending operations
export function getPendingOperations(): PendingOperation[] {
  return getOfflineData<PendingOperation[]>('pending-operations') || [];
}

// Update the status of a pending operation
export function updatePendingOperation(id: string, updates: Partial<PendingOperation>): void {
  try {
    const pendingOps = getOfflineData<PendingOperation[]>('pending-operations') || [];
    const updatedOps = pendingOps.map(op => 
      op.id === id ? { ...op, ...updates } : op
    );
    
    storeOfflineData('pending-operations', updatedOps);
  } catch (error) {
    console.error(`Error updating pending operation ${id}:`, error);
  }
}

// Remove a pending operation
export function removePendingOperation(id: string): void {
  try {
    const pendingOps = getOfflineData<PendingOperation[]>('pending-operations') || [];
    const filteredOps = pendingOps.filter(op => op.id !== id);
    
    storeOfflineData('pending-operations', filteredOps);
  } catch (error) {
    console.error(`Error removing pending operation ${id}:`, error);
  }
}

// Generate a unique ID for operations
function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Clear specific offline storage
export function clearOfflineData(key: OfflineStorageKey): void {
  localStorage.removeItem(`loadmaster-offline-${key}`);
}

// Clear all offline data
export function clearAllOfflineData(): void {
  const keys: OfflineStorageKey[] = [
    'training-modules',
    'aircraft-configs',
    'documents-templates',
    'tools-calculators',
    'pending-operations'
  ];
  
  keys.forEach(key => clearOfflineData(key));
}