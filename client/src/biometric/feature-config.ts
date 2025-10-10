/**
 * BIOMETRIC FEATURE FLAG CONFIGURATION
 * 
 * Set BIOMETRIC_ENABLED to false to completely disable biometric features
 * This will hide all biometric UI and prevent biometric API calls
 */

export const BIOMETRIC_FEATURES = {
  // Master switch - set to false to disable all biometric features
  ENABLED: true,
  
  // Show biometric option in login dialog
  SHOW_IN_LOGIN: true,
  
  // Show biometric settings in user profile
  SHOW_IN_PROFILE: true,
  
  // Allow new biometric registrations
  ALLOW_REGISTRATION: true,
  
  // Supported platforms
  SUPPORTED_PLATFORMS: {
    IOS: true,
    MAC: true,
    ANDROID: true,
    WINDOWS: true,
  },
};

/**
 * Check if biometric features are enabled globally
 */
export function isBiometricFeatureEnabled(): boolean {
  return BIOMETRIC_FEATURES.ENABLED;
}

/**
 * Check if biometric login should be shown
 */
export function shouldShowBiometricLogin(): boolean {
  return BIOMETRIC_FEATURES.ENABLED && BIOMETRIC_FEATURES.SHOW_IN_LOGIN;
}

/**
 * Check if biometric settings should be shown in profile
 */
export function shouldShowBiometricSettings(): boolean {
  return BIOMETRIC_FEATURES.ENABLED && BIOMETRIC_FEATURES.SHOW_IN_PROFILE;
}

/**
 * Check if new biometric registrations are allowed
 */
export function canRegisterBiometric(): boolean {
  return BIOMETRIC_FEATURES.ENABLED && BIOMETRIC_FEATURES.ALLOW_REGISTRATION;
}
