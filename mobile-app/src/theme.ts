// Theme colors matching the web app's design system
export const theme = {
  colors: {
    // Main colors from web app CSS variables
    background: '#1e1e1e',        // --background: 0 0% 12%
    foreground: '#fafafa',        // --foreground: 0 0% 98%
    muted: '#2d2d2d',            // --muted: 0 0% 18%
    mutedForeground: '#e1e1e1',   // --muted-foreground: 0 0% 88%
    card: '#2d2d2d',             // --card: 0 0% 18%
    cardForeground: '#fafafa',    // --card-foreground: 0 0% 98%
    border: '#404040',           // --border: 0 0% 25%
    input: '#404040',            // --input: 0 0% 25%
    primary: '#ff8c00',          // --primary: 30 100% 54% (orange)
    primaryForeground: '#ffffff', // --primary-foreground: 0 0% 100%
    secondary: '#262626',        // --secondary: 0 0% 15%
    secondaryForeground: '#fafafa', // --secondary-foreground: 0 0% 98%
    accent: '#ff8c00',           // --accent: 30 100% 54%
    accentForeground: '#ffffff', // --accent-foreground: 0 0% 100%
    destructive: '#ef4444',      // --destructive: 0 84% 60%
    destructiveForeground: '#fafafa',
    
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6',
    
    // Specific UI elements
    sidebarBackground: '#262626', // --sidebar-background: 0 0% 15%
    sidebarForeground: '#fafafa',
    sidebarBorder: '#404040',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
    heading: 32,
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;