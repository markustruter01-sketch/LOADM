import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { OfflineDataService } from '../services/OfflineDataService';

interface Props {
  navigation: any;
  route: {
    params: {
      planId?: number;
      aircraftType: string;
    };
  };
}

interface CargoItem {
  id: string;
  name: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  type: 'pallet' | 'container' | 'vehicle' | 'personnel';
  position?: { x: number; y: number };
}

interface LoadPlan {
  id?: number;
  title: string;
  aircraftType: string;
  cargoItems: CargoItem[];
  totalWeight: number;
  centerOfGravity: number;
  balanceStatus: 'within_limits' | 'forward_limit' | 'aft_limit' | 'overweight';
}

const AIRCRAFT_SPECS = {
  'C-130': { maxWeight: 19356, length: 12.5, width: 3.05, cgRange: { min: 28.5, max: 34.5 } },
  'C-17': { maxWeight: 77519, length: 26.82, width: 5.49, cgRange: { min: 28.0, max: 34.5 } },
  'C-27J': { maxWeight: 11500, length: 11.5, width: 2.98, cgRange: { min: 28.2, max: 33.8 } },
  'KC30A': { maxWeight: 45000, length: 18.5, width: 4.2, cgRange: { min: 27.5, max: 35.0 } },
};

const LoadPlannerScreen: React.FC<Props> = ({ navigation, route }) => {
  const { planId, aircraftType } = route.params;
  const [loadPlan, setLoadPlan] = useState<LoadPlan>({
    title: `Load Plan - ${aircraftType}`,
    aircraftType,
    cargoItems: [],
    totalWeight: 0,
    centerOfGravity: 0,
    balanceStatus: 'within_limits',
  });
  const [selectedCargo, setSelectedCargo] = useState<CargoItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCargoLibrary, setShowCargoLibrary] = useState(false);

  const { db } = useDatabase();
  const { user } = useAuth();
  const { queueForSync } = useSync();

  const screenWidth = Dimensions.get('window').width;
  const aircraftSpecs = AIRCRAFT_SPECS[aircraftType as keyof typeof AIRCRAFT_SPECS];

  useEffect(() => {
    if (planId) {
      loadExistingPlan();
    }
  }, [planId]);

  useEffect(() => {
    calculateBalance();
  }, [loadPlan.cargoItems]);

  const loadExistingPlan = async () => {
    if (!db || !planId) return;

    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM load_plans WHERE id = ?',
        [planId]
      );

      if (result) {
        const cargoData = JSON.parse(result.cargo_data as string);
        const balanceData = JSON.parse(result.balance_data as string);
        
        setLoadPlan({
          id: result.id as number,
          title: result.title as string,
          aircraftType: result.aircraft_type as string,
          cargoItems: cargoData.items || [],
          totalWeight: balanceData.totalWeight || 0,
          centerOfGravity: balanceData.centerOfGravity || 0,
          balanceStatus: balanceData.balanceStatus || 'within_limits',
        });
      }
    } catch (error) {
      console.error('Failed to load plan:', error);
    }
  };

  const calculateBalance = () => {
    if (loadPlan.cargoItems.length === 0) {
      setLoadPlan(prev => ({
        ...prev,
        totalWeight: 0,
        centerOfGravity: 0,
        balanceStatus: 'within_limits',
      }));
      return;
    }

    let totalWeight = 0;
    let totalMoment = 0;

    loadPlan.cargoItems.forEach(item => {
      totalWeight += item.weight;
      const itemCG = item.position ? item.position.x : 30; // Default CG position
      totalMoment += item.weight * itemCG;
    });

    const centerOfGravity = totalWeight > 0 ? totalMoment / totalWeight : 0;
    
    let balanceStatus: LoadPlan['balanceStatus'] = 'within_limits';
    
    if (totalWeight > aircraftSpecs.maxWeight) {
      balanceStatus = 'overweight';
    } else if (centerOfGravity < aircraftSpecs.cgRange.min) {
      balanceStatus = 'forward_limit';
    } else if (centerOfGravity > aircraftSpecs.cgRange.max) {
      balanceStatus = 'aft_limit';
    }

    setLoadPlan(prev => ({
      ...prev,
      totalWeight,
      centerOfGravity,
      balanceStatus,
    }));
  };

  const addCargoItem = (cargoType: CargoItem['type']) => {
    const newItem: CargoItem = {
      id: `cargo_${Date.now()}`,
      name: `${cargoType.charAt(0).toUpperCase() + cargoType.slice(1)} ${loadPlan.cargoItems.length + 1}`,
      weight: getDefaultWeight(cargoType),
      length: getDefaultLength(cargoType),
      width: getDefaultWidth(cargoType),
      height: getDefaultHeight(cargoType),
      type: cargoType,
      position: { x: 30, y: 50 }, // Default center position
    };

    setLoadPlan(prev => ({
      ...prev,
      cargoItems: [...prev.cargoItems, newItem],
    }));
    setShowCargoLibrary(false);
  };

  const getDefaultWeight = (type: CargoItem['type']): number => {
    switch (type) {
      case 'pallet': return 500;
      case 'container': return 1000;
      case 'vehicle': return 3000;
      case 'personnel': return 80;
      default: return 500;
    }
  };

  const getDefaultLength = (type: CargoItem['type']): number => {
    switch (type) {
      case 'pallet': return 2.24;
      case 'container': return 6.06;
      case 'vehicle': return 4.5;
      case 'personnel': return 0.6;
      default: return 2.0;
    }
  };

  const getDefaultWidth = (type: CargoItem['type']): number => {
    switch (type) {
      case 'pallet': return 2.74;
      case 'container': return 2.44;
      case 'vehicle': return 2.0;
      case 'personnel': return 0.5;
      default: return 1.5;
    }
  };

  const getDefaultHeight = (type: CargoItem['type']): number => {
    switch (type) {
      case 'pallet': return 1.5;
      case 'container': return 2.59;
      case 'vehicle': return 2.5;
      case 'personnel': return 1.8;
      default: return 1.5;
    }
  };

  const removeCargoItem = (itemId: string) => {
    setLoadPlan(prev => ({
      ...prev,
      cargoItems: prev.cargoItems.filter(item => item.id !== itemId),
    }));
    setSelectedCargo(null);
  };

  const updateCargoWeight = (itemId: string, newWeight: number) => {
    setLoadPlan(prev => ({
      ...prev,
      cargoItems: prev.cargoItems.map(item =>
        item.id === itemId ? { ...item, weight: newWeight } : item
      ),
    }));
  };

  const savePlan = async () => {
    if (!db || !user) return;

    setIsSaving(true);
    try {
      const dataService = new OfflineDataService(db);
      
      const cargoData = {
        items: loadPlan.cargoItems,
        aircraftType: loadPlan.aircraftType,
      };

      const balanceData = {
        totalWeight: loadPlan.totalWeight,
        centerOfGravity: loadPlan.centerOfGravity,
        balanceStatus: loadPlan.balanceStatus,
        maxWeight: aircraftSpecs.maxWeight,
        cgLimits: aircraftSpecs.cgRange,
      };

      if (loadPlan.id) {
        // Update existing plan
        await dataService.updateLoadPlan(loadPlan.id, cargoData, balanceData);
        await queueForSync('load_plans', loadPlan.id, 'UPDATE', { cargoData, balanceData });
      } else {
        // Create new plan
        const planId = await dataService.saveLoadPlan({
          title: loadPlan.title,
          aircraftType: loadPlan.aircraftType,
          userId: user.id,
          cargoData,
          balanceData,
        });
        
        setLoadPlan(prev => ({ ...prev, id: planId }));
        await queueForSync('load_plans', planId, 'CREATE', { loadPlan });
      }

      Alert.alert('Success', 'Load plan saved successfully!');
    } catch (error) {
      console.error('Failed to save plan:', error);
      Alert.alert('Error', 'Failed to save load plan');
    } finally {
      setIsSaving(false);
    }
  };

  const getBalanceStatusColor = (): string => {
    switch (loadPlan.balanceStatus) {
      case 'within_limits': return '#10b981';
      case 'forward_limit': return '#f59e0b';
      case 'aft_limit': return '#f59e0b';
      case 'overweight': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getBalanceStatusText = (): string => {
    switch (loadPlan.balanceStatus) {
      case 'within_limits': return 'Within Limits';
      case 'forward_limit': return 'Forward Limit';
      case 'aft_limit': return 'Aft Limit';
      case 'overweight': return 'Overweight';
      default: return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{loadPlan.title}</Text>
        <Text style={styles.aircraftType}>{loadPlan.aircraftType}</Text>
      </View>

      {/* Balance Status */}
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Weight:</Text>
          <Text style={styles.statusValue}>
            {loadPlan.totalWeight.toFixed(0)} / {aircraftSpecs.maxWeight} kg
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Center of Gravity:</Text>
          <Text style={styles.statusValue}>
            {loadPlan.centerOfGravity.toFixed(1)}% MAC
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[styles.statusValue, { color: getBalanceStatusColor() }]}>
            {getBalanceStatusText()}
          </Text>
        </View>
      </View>

      {/* Aircraft Visualization */}
      <View style={styles.aircraftContainer}>
        <Text style={styles.sectionTitle}>Cargo Layout</Text>
        <View style={styles.aircraftView}>
          {/* Aircraft outline */}
          <View style={styles.aircraftOutline}>
            {/* Cargo items */}
            {loadPlan.cargoItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.cargoItem,
                  {
                    left: `${(item.position?.x || 30) - 5}%`,
                    top: `${(item.position?.y || 50) - 5}%`,
                  },
                  selectedCargo?.id === item.id && styles.selectedCargoItem,
                ]}
                onPress={() => setSelectedCargo(item)}
              >
                <Text style={styles.cargoItemText}>
                  {item.type.charAt(0).toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Cargo List */}
      <ScrollView style={styles.cargoList}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cargo Items</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCargoLibrary(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {loadPlan.cargoItems.map((item) => (
          <View key={item.id} style={styles.cargoListItem}>
            <View style={styles.cargoInfo}>
              <Text style={styles.cargoName}>{item.name}</Text>
              <Text style={styles.cargoDetails}>
                {item.weight}kg • {item.length}×{item.width}×{item.height}m
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeCargoItem(item.id)}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {loadPlan.cargoItems.length === 0 && (
          <Text style={styles.emptyText}>
            No cargo items added. Tap "Add" to begin load planning.
          </Text>
        )}
      </ScrollView>

      {/* Cargo Library Modal */}
      {showCargoLibrary && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Cargo Item</Text>
            <TouchableOpacity
              style={styles.cargoTypeButton}
              onPress={() => addCargoItem('pallet')}
            >
              <Text style={styles.cargoTypeText}>📦 Pallet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cargoTypeButton}
              onPress={() => addCargoItem('container')}
            >
              <Text style={styles.cargoTypeText}>📫 Container</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cargoTypeButton}
              onPress={() => addCargoItem('vehicle')}
            >
              <Text style={styles.cargoTypeText}>🚗 Vehicle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cargoTypeButton}
              onPress={() => addCargoItem('personnel')}
            >
              <Text style={styles.cargoTypeText}>👤 Personnel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCargoLibrary(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={savePlan}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Plan</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  aircraftType: {
    fontSize: 16,
    color: '#6b7280',
  },
  statusContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  aircraftContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  aircraftView: {
    height: 150,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  aircraftOutline: {
    flex: 1,
    position: 'relative',
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  cargoItem: {
    position: 'absolute',
    width: 30,
    height: 30,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCargoItem: {
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  cargoItemText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cargoList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cargoListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cargoInfo: {
    flex: 1,
  },
  cargoName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  cargoDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
    padding: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  cargoTypeButton: {
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  cargoTypeText: {
    fontSize: 16,
    color: '#374151',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  bottomActions: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoadPlannerScreen;