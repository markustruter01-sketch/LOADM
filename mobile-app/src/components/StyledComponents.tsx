import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

// Card component matching web app cards
export const Card: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

// Button component matching web app primary buttons
export const PrimaryButton: React.FC<{
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}> = ({ title, onPress, disabled, style }) => (
  <TouchableOpacity
    style={[styles.primaryButton, disabled && styles.primaryButtonDisabled, style]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.primaryButtonText}>{title}</Text>
  </TouchableOpacity>
);

// Secondary button component
export const SecondaryButton: React.FC<{
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}> = ({ title, onPress, disabled, style }) => (
  <TouchableOpacity
    style={[styles.secondaryButton, disabled && styles.secondaryButtonDisabled, style]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.secondaryButtonText}>{title}</Text>
  </TouchableOpacity>
);

// Header text component
export const HeaderText: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({ children, style }) => (
  <Text style={[styles.headerText, style]}>{children}</Text>
);

// Body text component
export const BodyText: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({ children, style }) => (
  <Text style={[styles.bodyText, style]}>{children}</Text>
);

// Muted text component
export const MutedText: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({ children, style }) => (
  <Text style={[styles.mutedText, style]}>{children}</Text>
);

// Container component matching web app layout
export const Container: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => (
  <View style={[styles.container, style]}>
    {children}
  </View>
);

// Screen wrapper component
export const ScreenWrapper: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => (
  <View style={[styles.screenWrapper, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
  },
  
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  primaryButtonDisabled: {
    backgroundColor: theme.colors.muted,
  },
  
  primaryButtonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  secondaryButtonDisabled: {
    borderColor: theme.colors.muted,
  },
  
  secondaryButtonText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  
  headerText: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  
  bodyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.foreground,
    lineHeight: 20,
  },
  
  mutedText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  
  container: {
    padding: theme.spacing.md,
  },
  
  screenWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

export default {
  Card,
  PrimaryButton,
  SecondaryButton,
  HeaderText,
  BodyText,
  MutedText,
  Container,
  ScreenWrapper,
};