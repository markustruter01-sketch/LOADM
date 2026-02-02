import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { useSync } from '../contexts/SyncContext';
import { OfflineDataService, Qualification, FlightRecord, FlightStatistics } from '../services/OfflineDataService';
import { theme } from '../theme';

type TabType = 'qualifications' | 'activity' | 'flight-records';

interface Props {
  navigation: any;
}

const UserProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, isReadOnlyMode } = useAuth();
  const { db } = useDatabase();
  const { queueForSync } = useSync();

  const [activeTab, setActiveTab] = useState<TabType>('qualifications');
  const [isLoading, setIsLoading] = useState(true);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [flightRecords, setFlightRecords] = useState<FlightRecord[]>([]);
  const [flightStats, setFlightStats] = useState<FlightStatistics | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'qualification' | 'flight'>('qualification');

  // Form state for adding qualification
  const [qualName, setQualName] = useState('');
  const [qualStartDate, setQualStartDate] = useState('');
  const [qualExpiryDate, setQualExpiryDate] = useState('');
  const [hasNoExpiry, setHasNoExpiry] = useState(false);

  // Form state for adding flight record
  const [flightDate, setFlightDate] = useState('');
  const [flightCallsign, setFlightCallsign] = useState('');
  const [flightDeparture, setFlightDeparture] = useState('');
  const [flightArrival, setFlightArrival] = useState('');
  const [flightCaptain, setFlightCaptain] = useState('');
  const [flightPassengers, setFlightPassengers] = useState('0');
  const [flightCargo, setFlightCargo] = useState('0');
  const [flightNightHours, setFlightNightHours] = useState('0');
  const [flightDayHours, setFlightDayHours] = useState('0');

  useEffect(() => {
    loadData();
  }, [db, user]);

  const loadData = async () => {
    if (!db || !user) return;

    setIsLoading(true);
    try {
      const service = new OfflineDataService(db);
      
      const [quals, flights, stats, activity] = await Promise.all([
        service.getUserQualifications(user.id),
        service.getUserFlightRecords(user.id),
        service.getFlightStatistics(user.id),
        service.getRecentActivity(user.id, 20),
      ]);

      setQualifications(quals);
      setFlightRecords(flights);
      setFlightStats(stats);
      setRecentActivity(activity);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQualification = async () => {
    if (!db || !user || isReadOnlyMode) return;
    if (!qualName || !qualStartDate) {
      Alert.alert('Error', 'Please fill in name and start date');
      return;
    }

    try {
      const service = new OfflineDataService(db);
      const id = await service.saveQualification({
        userId: user.id,
        name: qualName,
        startDate: qualStartDate,
        expiryDate: hasNoExpiry ? null : qualExpiryDate || null,
      });

      await queueForSync('user_qualifications', id, 'CREATE');
      
      resetQualificationForm();
      setShowAddModal(false);
      loadData();
      Alert.alert('Success', 'Qualification added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add qualification');
    }
  };

  const handleAddFlightRecord = async () => {
    if (!db || !user || isReadOnlyMode) return;
    if (!flightDate || !flightDeparture || !flightArrival || !flightCaptain) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      const service = new OfflineDataService(db);
      const id = await service.saveFlightRecord({
        userId: user.id,
        date: flightDate,
        callsign: flightCallsign || undefined,
        departure: flightDeparture,
        arrival: flightArrival,
        captain: flightCaptain,
        passengersCarried: parseInt(flightPassengers) || 0,
        cargoWeight: parseFloat(flightCargo) || 0,
        nightHours: parseFloat(flightNightHours) || 0,
        dayHours: parseFloat(flightDayHours) || 0,
      });

      await queueForSync('flight_records', id, 'CREATE');

      resetFlightForm();
      setShowAddModal(false);
      loadData();
      Alert.alert('Success', 'Flight record added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add flight record');
    }
  };

  const resetQualificationForm = () => {
    setQualName('');
    setQualStartDate('');
    setQualExpiryDate('');
    setHasNoExpiry(false);
  };

  const resetFlightForm = () => {
    setFlightDate('');
    setFlightCallsign('');
    setFlightDeparture('');
    setFlightArrival('');
    setFlightCaptain('');
    setFlightPassengers('0');
    setFlightCargo('0');
    setFlightNightHours('0');
    setFlightDayHours('0');
  };

  const getQualificationStatus = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return { status: 'active', color: theme.colors.success };
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return { status: 'expired', color: theme.colors.destructive };
    if (daysUntilExpiry <= 90) return { status: 'expiring', color: theme.colors.warning };
    return { status: 'active', color: theme.colors.success };
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'qualifications' && styles.activeTab]}
        onPress={() => setActiveTab('qualifications')}
      >
        <Text style={[styles.tabText, activeTab === 'qualifications' && styles.activeTabText]}>
          Qualifications
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
        onPress={() => setActiveTab('activity')}
      >
        <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
          Activity
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'flight-records' && styles.activeTab]}
        onPress={() => setActiveTab('flight-records')}
      >
        <Text style={[styles.tabText, activeTab === 'flight-records' && styles.activeTabText]}>
          Flight Records
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderQualifications = () => (
    <View style={styles.tabContent}>
      {!isReadOnlyMode && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => { setModalType('qualification'); setShowAddModal(true); }}
        >
          <Text style={styles.addButtonText}>+ Add Qualification</Text>
        </TouchableOpacity>
      )}

      {qualifications.length === 0 ? (
        <Text style={styles.emptyText}>No qualifications recorded</Text>
      ) : (
        qualifications.map((qual) => {
          const { status, color } = getQualificationStatus(qual.expiryDate);
          return (
            <View key={qual.id} style={styles.qualCard}>
              <View style={styles.qualHeader}>
                <Text style={styles.qualName}>{qual.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: color }]}>
                  <Text style={styles.statusBadgeText}>
                    {status === 'active' ? 'Active' : status === 'expiring' ? 'Expiring Soon' : 'Expired'}
                  </Text>
                </View>
              </View>
              <Text style={styles.qualDate}>
                Started: {formatDate(qual.startDate)}
              </Text>
              <Text style={styles.qualDate}>
                Expires: {qual.expiryDate ? formatDate(qual.expiryDate) : 'No End Date'}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );

  const renderActivity = () => (
    <View style={styles.tabContent}>
      {recentActivity.length === 0 ? (
        <Text style={styles.emptyText}>No recent activity</Text>
      ) : (
        recentActivity.map((activity, index) => (
          <View key={index} style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityIconText}>
                {activity.type === 'quiz' ? '📝' : 
                 activity.type === 'scenario' ? '🎯' : 
                 activity.type === 'flight' ? '✈️' : '📋'}
              </Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title || activity.type}</Text>
              <Text style={styles.activityMeta}>
                {formatDate(activity.timestamp)}
                {activity.score !== undefined && ` • Score: ${activity.score}%`}
              </Text>
            </View>
            {activity.passed !== undefined && (
              <View style={[
                styles.activityStatus, 
                { backgroundColor: activity.passed ? theme.colors.success : theme.colors.destructive }
              ]}>
                <Text style={styles.activityStatusText}>
                  {activity.passed ? '✓' : '✗'}
                </Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderFlightRecords = () => (
    <View style={styles.tabContent}>
      {flightStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{flightStats.totalFlightHours.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Total Hours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{flightStats.dayHours.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Day Hours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{flightStats.nightHours.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Night Hours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{flightStats.totalMissions}</Text>
            <Text style={styles.statLabel}>Missions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{(flightStats.totalCargoWeight / 1000).toFixed(1)}t</Text>
            <Text style={styles.statLabel}>Cargo Moved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{flightStats.totalPassengers}</Text>
            <Text style={styles.statLabel}>Passengers</Text>
          </View>
        </View>
      )}

      {!isReadOnlyMode && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => { setModalType('flight'); setShowAddModal(true); }}
        >
          <Text style={styles.addButtonText}>+ Add Flight Record</Text>
        </TouchableOpacity>
      )}

      {flightRecords.length === 0 ? (
        <Text style={styles.emptyText}>No flight records</Text>
      ) : (
        flightRecords.slice(0, 10).map((record) => (
          <View key={record.id} style={styles.flightCard}>
            <View style={styles.flightHeader}>
              <Text style={styles.flightCallsign}>{record.callsign || 'No Callsign'}</Text>
              <Text style={styles.flightDate}>{formatDate(record.date)}</Text>
            </View>
            <Text style={styles.flightRoute}>
              {record.departure} → {record.arrival}
            </Text>
            <View style={styles.flightDetails}>
              <Text style={styles.flightDetailText}>
                Day: {record.dayHours}h | Night: {record.nightHours}h
              </Text>
              <Text style={styles.flightDetailText}>
                Cargo: {record.cargoWeight}kg | PAX: {record.passengersCarried}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {modalType === 'qualification' ? 'Add Qualification' : 'Add Flight Record'}
          </Text>

          <ScrollView style={styles.modalScroll}>
            {modalType === 'qualification' ? (
              <>
                <Text style={styles.inputLabel}>Qualification Name *</Text>
                <TextInput
                  style={styles.input}
                  value={qualName}
                  onChangeText={setQualName}
                  placeholder="e.g., ICC C-130J"
                  placeholderTextColor={theme.colors.mutedForeground}
                />

                <Text style={styles.inputLabel}>Start Date * (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={qualStartDate}
                  onChangeText={setQualStartDate}
                  placeholder="2024-01-15"
                  placeholderTextColor={theme.colors.mutedForeground}
                />

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setHasNoExpiry(!hasNoExpiry)}
                >
                  <View style={[styles.checkbox, hasNoExpiry && styles.checkboxChecked]}>
                    {hasNoExpiry && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>No End Date</Text>
                </TouchableOpacity>

                {!hasNoExpiry && (
                  <>
                    <Text style={styles.inputLabel}>Expiry Date (YYYY-MM-DD)</Text>
                    <TextInput
                      style={styles.input}
                      value={qualExpiryDate}
                      onChangeText={setQualExpiryDate}
                      placeholder="2025-01-15"
                      placeholderTextColor={theme.colors.mutedForeground}
                    />
                  </>
                )}
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Date * (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={flightDate}
                  onChangeText={setFlightDate}
                  placeholder="2024-01-15"
                  placeholderTextColor={theme.colors.mutedForeground}
                />

                <Text style={styles.inputLabel}>Callsign</Text>
                <TextInput
                  style={styles.input}
                  value={flightCallsign}
                  onChangeText={setFlightCallsign}
                  placeholder="RAAF 123"
                  placeholderTextColor={theme.colors.mutedForeground}
                />

                <Text style={styles.inputLabel}>Departure *</Text>
                <TextInput
                  style={styles.input}
                  value={flightDeparture}
                  onChangeText={setFlightDeparture}
                  placeholder="YSBK"
                  placeholderTextColor={theme.colors.mutedForeground}
                />

                <Text style={styles.inputLabel}>Arrival *</Text>
                <TextInput
                  style={styles.input}
                  value={flightArrival}
                  onChangeText={setFlightArrival}
                  placeholder="YSSY"
                  placeholderTextColor={theme.colors.mutedForeground}
                />

                <Text style={styles.inputLabel}>Captain *</Text>
                <TextInput
                  style={styles.input}
                  value={flightCaptain}
                  onChangeText={setFlightCaptain}
                  placeholder="SQNLDR Smith"
                  placeholderTextColor={theme.colors.mutedForeground}
                />

                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Day Hours</Text>
                    <TextInput
                      style={styles.input}
                      value={flightDayHours}
                      onChangeText={setFlightDayHours}
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.mutedForeground}
                    />
                  </View>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Night Hours</Text>
                    <TextInput
                      style={styles.input}
                      value={flightNightHours}
                      onChangeText={setFlightNightHours}
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.mutedForeground}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Cargo (kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={flightCargo}
                      onChangeText={setFlightCargo}
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.mutedForeground}
                    />
                  </View>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Passengers</Text>
                    <TextInput
                      style={styles.input}
                      value={flightPassengers}
                      onChangeText={setFlightPassengers}
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.mutedForeground}
                    />
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowAddModal(false);
                resetQualificationForm();
                resetFlightForm();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={modalType === 'qualification' ? handleAddQualification : handleAddFlightRecord}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* User Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0] || user?.email?.[0] || 'U'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.profileMeta}>
            {user?.rank} • {user?.squadron}
          </Text>
          <Text style={styles.profileRole}>
            {user?.licenseType || user?.role}
            {isReadOnlyMode && ' (Read Only)'}
          </Text>
        </View>
      </View>

      {renderTabs()}

      <ScrollView style={styles.scrollView}>
        {activeTab === 'qualifications' && renderQualifications()}
        {activeTab === 'activity' && renderActivity()}
        {activeTab === 'flight-records' && renderFlightRecords()}
      </ScrollView>

      {renderAddModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.primaryForeground,
  },
  profileInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  profileName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.foreground,
  },
  profileMeta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
  profileRole: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium as any,
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: theme.spacing.md,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addButtonText: {
    color: theme.colors.primaryForeground,
    fontWeight: theme.fontWeight.bold as any,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xl,
  },
  qualCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  qualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  qualName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.foreground,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium as any,
  },
  qualDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityIconText: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  activityTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.foreground,
  },
  activityMeta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
  activityStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityStatusText: {
    color: '#fff',
    fontWeight: theme.fontWeight.bold as any,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statCard: {
    width: '31%',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  flightCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  flightCallsign: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.foreground,
  },
  flightDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  flightRoute: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  flightDetails: {
    marginTop: theme.spacing.xs,
  },
  flightDetailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.foreground,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalScroll: {
    padding: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  inputHalf: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontWeight: theme.fontWeight.bold as any,
  },
  checkboxLabel: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.md,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.muted,
    marginRight: theme.spacing.sm,
  },
  cancelButtonText: {
    color: theme.colors.foreground,
    fontWeight: theme.fontWeight.medium as any,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    color: theme.colors.primaryForeground,
    fontWeight: theme.fontWeight.bold as any,
  },
});

export default UserProfileScreen;
