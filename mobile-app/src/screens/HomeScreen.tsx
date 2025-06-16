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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1f2937',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  userRole: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  lastSyncText: {
    color: '#6b7280',
    fontSize: 12,
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HomeScreen;