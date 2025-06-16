import { StyleSheet } from 'react-native';
import { theme } from './theme';

// Global styles matching web app design exactly
export const globalStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  contentContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
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
  
  primaryButtonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  
  headerText: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  
  bodyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.foreground,
  },
  
  mutedText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
});