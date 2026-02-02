import React, { useEffect } from 'react';
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
  const { user, logout, isReadOnlyMode, isLeadershipRole } = useAuth();
  const { isOnline, isSyncing, lastSyncTime, syncData } = useSync();

  useEffect(() => {
    if (isLeadershipRole) {
      Alert.alert(
        'Leadership Mode',
        'You are logged in with read-only access. You can view all data but cannot make changes.',
        [{ text: 'OK' }]
      );
    }
  }, [isLeadershipRole]);

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

  const getRoleDisplayName = () => {
    if (isLeadershipRole) return 'Leadership (Read-Only)';
    const role = user?.licenseType || user?.role || '';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Read-Only Mode Banner */}
      {isReadOnlyMode && (
        <View style={styles.readOnlyBanner}>
          <Text style={styles.readOnlyText}>
            👁️ Leadership Mode - View Only Access
          </Text>
        </View>
      )}

      {/* Header with Sync Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0] || user?.email?.[0] || 'U'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.firstName || user?.email}
            </Text>
            <Text style={styles.userRole}>
              {getRoleDisplayName()} • {user?.squadron}
            </Text>
          </View>
        </TouchableOpacity>
        
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

      {/* Quick Access Bar */}
      <View style={styles.quickAccessBar}>
        <TouchableOpacity
          style={styles.quickAccessItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.quickAccessIcon}>👤</Text>
          <Text style={styles.quickAccessText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAccessItem}
          onPress={() => navigation.navigate('Tools')}
        >
          <Text style={styles.quickAccessIcon}>🔧</Text>
          <Text style={styles.quickAccessText}>Tools</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAccessItem}
          onPress={() => navigation.navigate('Documents')}
        >
          <Text style={styles.quickAccessIcon}>📚</Text>
          <Text style={styles.quickAccessText}>Docs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAccessItem}
          onPress={() => navigation.navigate('Chat')}
        >
          <Text style={styles.quickAccessIcon}>💬</Text>
          <Text style={styles.quickAccessText}>Chat</Text>
        </TouchableOpacity>
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
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.menuIcon}>👤</Text>
          <Text style={styles.menuTitle}>My Profile</Text>
          <Text style={styles.menuDescription}>
            View qualifications, flight records & activity
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Tools')}
        >
          <Text style={styles.menuIcon}>🔧</Text>
          <Text style={styles.menuTitle}>Tools & Calculators</Text>
          <Text style={styles.menuDescription}>
            Fuel, WAM, restraint & PSI calculators
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
  readOnlyBanner: {
    backgroundColor: theme.colors.warning + '20',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  readOnlyText: {
    color: theme.colors.warning,
    textAlign: 'center',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.primaryForeground,
  },
  userDetails: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  welcomeText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  userName: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    marginTop: theme.spacing.xs,
  },
  userRole: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
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
    fontWeight: theme.fontWeight.bold as any,
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
    fontWeight: theme.fontWeight.medium as any,
    flex: 1,
  },
  lastSyncText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
  },
  quickAccessBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  quickAccessItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickAccessIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  quickAccessText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.foreground,
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
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  menuDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  logoutButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.destructive,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: theme.colors.destructiveForeground,
    fontWeight: theme.fontWeight.bold as any,
    fontSize: theme.fontSize.md,
  },
});

export default HomeScreen;
