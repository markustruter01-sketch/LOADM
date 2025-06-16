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

interface Props {
  navigation: any;
}

interface Scenario {
  id: number;
  title: string;
  description: string;
  passing_threshold: number;
}

const ScenariosScreen: React.FC<Props> = ({ navigation }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { db } = useDatabase();
  const { user } = useAuth();

  useEffect(() => {
    loadScenarios();
  }, [db]);

  const loadScenarios = async () => {
    if (!db) return;
    
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM scenarios WHERE is_active = 1 ORDER BY created_at DESC'
      );
      setScenarios(result as Scenario[]);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startScenario = (scenario: Scenario) => {
    Alert.alert(
      'Start Scenario',
      `Ready to begin "${scenario.title}"?\n\nPassing Score: ${scenario.passing_threshold}%`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: () => {
            Alert.alert('Coming Soon', 'Scenario training interface will be available soon!');
          }
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading scenarios...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Training Scenarios</Text>
        <Text style={styles.subtitle}>
          Practice with realistic training exercises
        </Text>
      </View>

      {scenarios.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyText}>No scenarios available</Text>
          <Text style={styles.emptySubtext}>
            Sync with the server to download training scenarios
          </Text>
        </View>
      ) : (
        <View style={styles.scenariosList}>
          {scenarios.map((scenario) => (
            <TouchableOpacity
              key={scenario.id}
              style={styles.scenarioCard}
              onPress={() => startScenario(scenario)}
            >
              <Text style={styles.scenarioTitle}>{scenario.title}</Text>
              <Text style={styles.scenarioDescription}>
                {scenario.description}
              </Text>
              
              <View style={styles.scenarioMeta}>
                <Text style={styles.metaText}>
                  {scenario.passing_threshold}% to pass
                </Text>
              </View>
              
              <View style={styles.startButton}>
                <Text style={styles.startButtonText}>Start Scenario</Text>
              </View>
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
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
  scenariosList: {
    padding: 20,
  },
  scenarioCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
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
  scenarioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  scenarioDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  scenarioMeta: {
    marginBottom: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ScenariosScreen;