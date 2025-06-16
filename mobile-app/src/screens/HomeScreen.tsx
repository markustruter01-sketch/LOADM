import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { theme } from '../theme';

interface Props {
  navigation: any;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { isOnline, isSyncing, lastSyncTime, syncData } = useSync();

  const handleRefresh = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline. Please check your internet connection.');
      return;
    }
    
    try {
      await syncData();
      Alert.alert('Success', 'Data synced successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data. Please try again.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ]
    );
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never synced';
    return `Last sync: ${lastSyncTime.toLocaleTimeString()}`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with Sync Button */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>
            {user?.firstName || user?.email}
          </Text>
          <Text style={styles.userRole}>
            {user?.role} • {user?.squadron}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.syncButton, !isOnline && styles.syncButtonDisabled]}
          onPress={handleRefresh}
          disabled={isSyncing || !isOnline}
        >
          {isSyncing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.syncButtonText}>
              {isOnline ? 'Sync' : 'Offline'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, isOnline ? styles.online : styles.offline]} />
        <Text style={styles.statusText}>
          {isOnline ? 'Online' : 'Offline Mode'}
        </Text>
        <Text style={styles.lastSyncText}>{formatLastSync()}</Text>
      </View>

      {/* Main Menu */}
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('LoadPlanning')}
        >
          <Text style={styles.menuIcon}>✈️</Text>
          <Text style={styles.menuTitle}>Load Planning</Text>
          <Text style={styles.menuDescription}>
            Create and manage aircraft load plans
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Quiz')}
        >
          <Text style={styles.menuIcon}>📝</Text>
          <Text style={styles.menuTitle}>Quizzes</Text>
          <Text style={styles.menuDescription}>
            Take quizzes and track your progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Scenarios')}
        >
          <Text style={styles.menuIcon}>🎯</Text>
          <Text style={styles.menuTitle}>Training Scenarios</Text>
          <Text style={styles.menuDescription}>
            Practice with realistic scenarios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Documents')}
        >
          <Text style={styles.menuIcon}>📚</Text>
          <Text style={styles.menuTitle}>Documents</Text>
          <Text style={styles.menuDescription}>
            View technical manuals and guides
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Chat')}
        >
          <Text style={styles.menuIcon}>💬</Text>
          <Text style={styles.menuTitle}>Chat</Text>
          <Text style={styles.menuDescription}>
            Communicate with instructors and peers
          </Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.md,
  },
  userName: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    marginTop: theme.spacing.xs,
  },
  userRole: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  syncButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: theme.colors.muted,
  },
  syncButtonText: {
    color: theme.colors.primaryForeground,
    fontWeight: theme.fontWeight.bold,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  online: {
    backgroundColor: theme.colors.success,
  },
  offline: {
    backgroundColor: theme.colors.destructive,
  },
  statusText: {
    color: theme.colors.foreground,
    fontWeight: theme.fontWeight.medium,
    flex: 1,
  },
  lastSyncText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
  },
  menuContainer: {
    gap: theme.spacing.md,
  },
  menuItem: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  menuTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  menuDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  logoutButton: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.destructive,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: theme.colors.destructiveForeground,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
  },
});

export default HomeScreen;