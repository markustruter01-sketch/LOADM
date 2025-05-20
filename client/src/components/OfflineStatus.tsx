import { useEffect } from 'react';
import { useOffline } from '@/hooks/use-offline';
import { Wifi, WifiOff } from 'lucide-react';

export default function OfflineStatus() {
  const { isOnline, hasPendingChanges, registerServiceWorker } = useOffline();

  // Register service worker on component mount
  useEffect(() => {
    registerServiceWorker();
  }, [registerServiceWorker]);

  // No visible component when online and no pending changes
  if (isOnline && !hasPendingChanges) {
    return null;
  }

  return (
    <div className={`fixed bottom-20 left-0 right-0 z-50 flex justify-center pointer-events-none`}>
      <div className={`
        px-4 py-2 rounded-lg shadow-lg pointer-events-auto 
        flex items-center gap-2 text-sm font-medium
        ${isOnline ? 'bg-green-600/90 text-white' : 'bg-red-600/90 text-white'}
      `}>
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Back online - Syncing your changes</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>You're offline - Limited functionality available</span>
          </>
        )}
      </div>
    </div>
  );
}