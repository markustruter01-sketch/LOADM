import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSync } from '../contexts/SyncContext';

const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingSyncCount, lastSyncTime } = useSync();

  if (isOnline && pendingSyncCount === 0) {
    return null; // Don't show anything when online and synced
  }

  return (
    <View style={[styles.container, isOnline ? styles.syncing : styles.offline]}>
      <Text style={styles.text}>
        {isOnline 
          ? `Syncing ${pendingSyncCount} items...`
          : `Offline • ${pendingSyncCount} items pending sync`
        }
      </Text>
      {lastSyncTime && (
        <Text style={styles.timestamp}>
          Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  offline: {
    backgroundColor: '#fef2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  syncing: {
    backgroundColor: '#fefbf2',
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: '#dc2626',
  },
  timestamp: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
});

export default OfflineIndicator;