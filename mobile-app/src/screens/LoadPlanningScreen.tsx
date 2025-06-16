import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';

interface Props {
  navigation: any;
}

interface LoadPlan {
  id: number;
  title: string;
  aircraft_type: string;
  created_at: string;
}

const LoadPlanningScreen: React.FC<Props> = ({ navigation }) => {
  const [loadPlans, setLoadPlans] = useState<LoadPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { db } = useDatabase();
  const { user } = useAuth();
  const { queueForSync } = useSync();

  useEffect(() => {
    loadLoadPlans();
  }, [db]);

  const loadLoadPlans = async () => {
    if (!db || !user) return;
    
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM load_plans WHERE user_id = ? ORDER BY created_at DESC',
        [user.id]
      );
      setLoadPlans(result as LoadPlan[]);
    } catch (error) {
      console.error('Failed to load load plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewPlan = () => {
    Alert.alert(
      'Aircraft Type',
      'Select aircraft type for new load plan:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'C-130', onPress: () => createPlan('C-130') },
        { text: 'C-17', onPress: () => createPlan('C-17') },
        { text: 'C-27J', onPress: () => createPlan('C-27J') },
        { text: 'KC30A', onPress: () => createPlan('KC30A') },
      ]
    );
  };

  const createPlan = async (aircraftType: string) => {
    if (!db || !user) return;

    try {
      const title = `Load Plan - ${aircraftType} - ${new Date().toLocaleDateString()}`;
      const result = await db.runAsync(
        'INSERT INTO load_plans (title, aircraft_type, user_id, cargo_data, balance_data, created_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, aircraftType, user.id, '{}', '{}', new Date().toISOString(), 0]
      );

      await queueForSync('load_plans', result.lastInsertRowId as number, 'CREATE');
      loadLoadPlans();
      
      Alert.alert('Success', 'New load plan created!');
    } catch (error) {
      console.error('Failed to create load plan:', error);
      Alert.alert('Error', 'Failed to create load plan');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading load plans...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Load Planning</Text>
        <TouchableOpacity style={styles.createButton} onPress={createNewPlan}>
          <Text style={styles.createButtonText}>+ New Plan</Text>
        </TouchableOpacity>
      </View>

      {loadPlans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>✈️</Text>
          <Text style={styles.emptyText}>No load plans yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first load plan to get started
          </Text>
        </View>
      ) : (
        <View style={styles.plansList}>
          {loadPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={styles.planCard}
              onPress={() => {
                Alert.alert('Load Plan', 'Load plan editor coming soon!');
              }}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.aircraftType}>{plan.aircraft_type}</Text>
              </View>
              
              <Text style={styles.planDate}>
                Created: {new Date(plan.created_at).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  plansList: {
    padding: 20,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    flex: 1,
  },
  aircraftType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  planDate: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default LoadPlanningScreen;