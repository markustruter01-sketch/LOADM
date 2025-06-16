import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSync } from '../contexts/SyncContext';
import { useDatabase } from '../contexts/DatabaseContext';

const SyncStatusWidget: React.FC = () => {
  const { isOnline, performSync, lastSyncTime } = useSync();
  const { db } = useDatabase();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState({
    pendingQuizzes: 0,
    pendingScenarios: 0,
    pendingLoadPlans: 0,
    pendingMessages: 0,
  });

  useEffect(() => {
    loadSyncStats();
  }, [db]);

  const loadSyncStats = async () => {
    if (!db) return;

    try {
      const quizzes = await db.getAllAsync('SELECT COUNT(*) as count FROM quiz_submissions WHERE synced = 0');
      const scenarios = await db.getAllAsync('SELECT COUNT(*) as count FROM scenario_submissions WHERE synced = 0');
      const loadPlans = await db.getAllAsync('SELECT COUNT(*) as count FROM load_plans WHERE synced = 0');
      const messages = await db.getAllAsync('SELECT COUNT(*) as count FROM chat_messages WHERE synced = 0');

      setSyncStats({
        pendingQuizzes: quizzes[0]?.count || 0,
        pendingScenarios: scenarios[0]?.count || 0,
        pendingLoadPlans: loadPlans[0]?.count || 0,
        pendingMessages: messages[0]?.count || 0,
      });
    } catch (error) {
      console.error('Failed to load sync stats:', error);
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Please connect to the internet to sync data.');
      return;
    }

    setIsSyncing(true);
    try {
      await performSync();
      await loadSyncStats();
      Alert.alert('Success', 'Data synchronized successfully!');
    } catch (error) {
      console.error('Sync failed:', error);
      Alert.alert('Sync Failed', 'Failed to synchronize data. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const getTotalPending = () => {
    return syncStats.pendingQuizzes + syncStats.pendingScenarios + 
           syncStats.pendingLoadPlans + syncStats.pendingMessages;
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const now = new Date();
    const sync = new Date(lastSyncTime);
    const diffMinutes = Math.floor((now.getTime() - sync.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return sync.toLocaleDateString();
  };

  const totalPending = getTotalPending();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, isOnline ? styles.online : styles.offline]} />
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.syncButton, (!isOnline || isSyncing) && styles.syncButtonDisabled]}
          onPress={handleManualSync}
          disabled={!isOnline || isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.syncButtonText}>Sync</Text>
          )}
        </TouchableOpacity>
      </View>

      {totalPending > 0 && (
        <View style={styles.pendingContainer}>
          <Text style={styles.pendingTitle}>Pending Sync ({totalPending})</Text>
          <View style={styles.pendingStats}>
            {syncStats.pendingQuizzes > 0 && (
              <Text style={styles.pendingStat}>📝 {syncStats.pendingQuizzes} quizzes</Text>
            )}
            {syncStats.pendingScenarios > 0 && (
              <Text style={styles.pendingStat}>📋 {syncStats.pendingScenarios} scenarios</Text>
            )}
            {syncStats.pendingLoadPlans > 0 && (
              <Text style={styles.pendingStat}>✈️ {syncStats.pendingLoadPlans} load plans</Text>
            )}
            {syncStats.pendingMessages > 0 && (
              <Text style={styles.pendingStat}>💬 {syncStats.pendingMessages} messages</Text>
            )}
          </View>
        </View>
      )}

      <Text style={styles.lastSync}>
        Last sync: {formatLastSync()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  online: {
    backgroundColor: '#10b981',
  },
  offline: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  syncButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pendingContainer: {
    marginBottom: 12,
  },
  pendingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 8,
  },
  pendingStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pendingStat: {
    fontSize: 11,
    color: '#6b7280',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lastSync: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default SyncStatusWidget;