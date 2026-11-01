import { useEffect, useState } from 'react';
import { useOffline } from '@/hooks/use-offline';
import { Wifi, WifiOff, CheckCircle2, Loader2 } from 'lucide-react';

type SyncState = 'idle' | 'syncing' | 'complete' | 'offline';

export default function OfflineStatus() {
  const { isOnline, hasPendingChanges, registerServiceWorker } = useOffline();
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    registerServiceWorker();
  }, [registerServiceWorker]);

  useEffect(() => {
    if (!isOnline) {
      setSyncState('offline');
      setShowComplete(false);
    } else if (hasPendingChanges) {
      setSyncState('syncing');
      setShowComplete(false);
    } else if (syncState === 'syncing' || syncState === 'offline') {
      setSyncState('complete');
      setShowComplete(true);
      const timer = setTimeout(() => {
        setShowComplete(false);
        setSyncState('idle');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, hasPendingChanges]);

  if (syncState === 'idle' && !showComplete) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div 
        className={`
          px-4 py-2 rounded-lg shadow-lg pointer-events-auto 
          flex items-center gap-2 text-sm font-medium
          transition-all duration-300
          ${syncState === 'offline' ? 'bg-amber-600/90 text-white' : ''}
          ${syncState === 'syncing' ? 'bg-blue-600/90 text-white' : ''}
          ${syncState === 'complete' || showComplete ? 'bg-green-600/90 text-white' : ''}
        `}
        data-testid="sync-status-banner"
      >
        {syncState === 'offline' && (
          <>
            <WifiOff className="h-4 w-4" />
            <span>You're offline - Do not close this tab</span>
          </>
        )}
        {syncState === 'syncing' && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Syncing your changes...</span>
          </>
        )}
        {(syncState === 'complete' || showComplete) && syncState !== 'offline' && syncState !== 'syncing' && (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span>Sync Complete</span>
          </>
        )}
      </div>
    </div>
  );
}
