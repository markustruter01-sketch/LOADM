import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

interface Props {
  navigation: any;
}

interface CalculatorTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'fuel' | 'weight' | 'restraint' | 'general';
}

const CALCULATOR_TOOLS: CalculatorTool[] = [
  {
    id: 'fuel',
    name: 'Fuel Calculator',
    description: 'Calculate fuel requirements for missions',
    icon: '⛽',
    category: 'fuel',
  },
  {
    id: 'wam',
    name: 'WAM Calculator',
    description: 'Weight and Moment calculations',
    icon: '⚖️',
    category: 'weight',
  },
  {
    id: 'restraint',
    name: 'Restraint Calculator',
    description: 'Calculate tie-down requirements',
    icon: '🔗',
    category: 'restraint',
  },
  {
    id: 'cgfa',
    name: 'Vehicle CGFA',
    description: 'Center of Gravity Floor Area calculator',
    icon: '🚗',
    category: 'weight',
  },
  {
    id: 'box-psi',
    name: 'Box PSI Calculator',
    description: 'Calculate pressure for box cargo',
    icon: '📦',
    category: 'weight',
  },
  {
    id: 'drum-psi',
    name: 'Drum PSI Calculator',
    description: 'Calculate pressure for drum cargo',
    icon: '🛢️',
    category: 'weight',
  },
  {
    id: 'tire-psi',
    name: 'Tire PSI Calculator',
    description: 'Tire pressure calculations',
    icon: '🔘',
    category: 'weight',
  },
  {
    id: 'pallet-builder',
    name: 'Pallet Builder',
    description: 'Build and optimize pallet loads',
    icon: '📐',
    category: 'general',
  },
];

const ToolsScreen: React.FC<Props> = ({ navigation }) => {
  const { isReadOnlyMode } = useAuth();

  const handleToolPress = (tool: CalculatorTool) => {
    if (isReadOnlyMode) {
      Alert.alert(
        'Read-Only Mode',
        'Calculator tools are view-only in Leadership mode.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      tool.name,
      `${tool.description}\n\nThis calculator will be available soon!`,
      [{ text: 'OK' }]
    );
  };

  const getCategoryColor = (category: CalculatorTool['category']) => {
    switch (category) {
      case 'fuel':
        return theme.colors.warning;
      case 'weight':
        return theme.colors.info;
      case 'restraint':
        return theme.colors.destructive;
      case 'general':
        return theme.colors.success;
      default:
        return theme.colors.primary;
    }
  };

  const renderToolCard = (tool: CalculatorTool) => (
    <TouchableOpacity
      key={tool.id}
      style={styles.toolCard}
      onPress={() => handleToolPress(tool)}
      activeOpacity={0.7}
    >
      <View style={[styles.toolIconContainer, { backgroundColor: getCategoryColor(tool.category) + '20' }]}>
        <Text style={styles.toolIcon}>{tool.icon}</Text>
      </View>
      <View style={styles.toolContent}>
        <Text style={styles.toolName}>{tool.name}</Text>
        <Text style={styles.toolDescription}>{tool.description}</Text>
      </View>
      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(tool.category) }]}>
        <Text style={styles.categoryBadgeText}>{tool.category}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loadmaster Tools</Text>
        <Text style={styles.headerSubtitle}>
          Quick access to essential calculators and utilities
        </Text>
        {isReadOnlyMode && (
          <View style={styles.readOnlyBanner}>
            <Text style={styles.readOnlyText}>
              👁️ Leadership Mode - View Only
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('LoadPlanning')}
          >
            <Text style={styles.quickActionIcon}>✈️</Text>
            <Text style={styles.quickActionText}>Load Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Documents')}
          >
            <Text style={styles.quickActionIcon}>📚</Text>
            <Text style={styles.quickActionText}>Manuals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Scenarios')}
          >
            <Text style={styles.quickActionIcon}>🎯</Text>
            <Text style={styles.quickActionText}>Scenarios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Quiz')}
          >
            <Text style={styles.quickActionIcon}>📝</Text>
            <Text style={styles.quickActionText}>Quizzes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calculator Tools */}
      <View style={styles.toolsContainer}>
        <Text style={styles.sectionTitle}>Calculators</Text>
        <View style={styles.toolsGrid}>
          {CALCULATOR_TOOLS.map(renderToolCard)}
        </View>
      </View>

      {/* Checklists Section */}
      <View style={styles.checklistsContainer}>
        <Text style={styles.sectionTitle}>Checklists</Text>
        <TouchableOpacity
          style={styles.checklistCard}
          onPress={() => Alert.alert('Coming Soon', 'Pre-flight checklists will be available soon!')}
        >
          <Text style={styles.checklistIcon}>✅</Text>
          <View style={styles.checklistContent}>
            <Text style={styles.checklistTitle}>Pre-Flight Checklist</Text>
            <Text style={styles.checklistDescription}>Standard pre-flight inspection items</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.checklistCard}
          onPress={() => Alert.alert('Coming Soon', 'Cargo inspection checklists will be available soon!')}
        >
          <Text style={styles.checklistIcon}>📋</Text>
          <View style={styles.checklistContent}>
            <Text style={styles.checklistTitle}>Cargo Inspection</Text>
            <Text style={styles.checklistDescription}>Cargo securing and inspection points</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.checklistCard}
          onPress={() => Alert.alert('Coming Soon', 'Safety checklists will be available soon!')}
        >
          <Text style={styles.checklistIcon}>⚠️</Text>
          <View style={styles.checklistContent}>
            <Text style={styles.checklistTitle}>Safety Checklist</Text>
            <Text style={styles.checklistDescription}>Hazardous material and safety protocols</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Spacer for bottom navigation */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.foreground,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
  readOnlyBanner: {
    backgroundColor: theme.colors.warning + '20',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  readOnlyText: {
    color: theme.colors.warning,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
  },
  quickActionsContainer: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '23%',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  quickActionText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  toolsContainer: {
    padding: theme.spacing.md,
  },
  toolsGrid: {
    gap: theme.spacing.sm,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  toolIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 24,
  },
  toolContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  toolName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.foreground,
  },
  toolDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium as any,
    textTransform: 'capitalize',
  },
  checklistsContainer: {
    padding: theme.spacing.md,
  },
  checklistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  checklistIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  checklistContent: {
    flex: 1,
  },
  checklistTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.foreground,
  },
  checklistDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});

export default ToolsScreen;
