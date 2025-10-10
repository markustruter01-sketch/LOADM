/**
 * ISOLATED BIOMETRIC AUTHENTICATION UTILITIES
 * WebAuthn / Face ID / Touch ID helper functions
 * 
 * This file can be safely deleted to disable biometric features
 */

import { 
  startRegistration, 
  startAuthentication,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';

const API_BASE = '/api/biometric';

/**
 * Check if biometric authentication is supported on this device
 */
export function isBiometricSupported(): boolean {
  // Check if browser supports Web Authentication API
  return window.PublicKeyCredential !== undefined && 
         navigator.credentials !== undefined;
}

/**
 * Check if platform authenticator (Face ID/Touch ID) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  try {
    if (!isBiometricSupported()) return false;
    
    // Check if platform authenticator is available
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('Error checking platform authenticator:', error);
    return false;
  }
}

/**
 * Register a new biometric credential (Face ID/Touch ID)
 */
export async function registerBiometric(deviceName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Get registration options from server
    const optionsResponse = await fetch(`${API_BASE}/register-options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!optionsResponse.ok) {
      const error = await optionsResponse.json();
      return { success: false, error: error.error || 'Failed to get registration options' };
    }

    const options: PublicKeyCredentialCreationOptionsJSON = await optionsResponse.json();

    // Step 2: Use browser's WebAuthn API to create credential
    const credential = await startRegistration({ optionsJSON: options });

    // Step 3: Send credential to server for verification
    const verifyResponse = await fetch(`${API_BASE}/register-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        credential,
        deviceName: deviceName || getDeviceName(),
      }),
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      return { success: false, error: error.error || 'Failed to verify registration' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Biometric registration error:', error);
    
    // Handle user cancellation
    if (error.name === 'NotAllowedError') {
      return { success: false, error: 'Biometric registration was cancelled' };
    }
    
    return { success: false, error: error.message || 'Biometric registration failed' };
  }
}

/**
 * Authenticate using biometric (Face ID/Touch ID)
 */
export async function authenticateBiometric(email: string): Promise<{ 
  success: boolean; 
  user?: any; 
  error?: string 
}> {
  try {
    // Step 1: Get authentication options from server
    const optionsResponse = await fetch(`${API_BASE}/login-options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    if (!optionsResponse.ok) {
      const error = await optionsResponse.json();
      return { success: false, error: error.error || 'Failed to get authentication options' };
    }

    const options: PublicKeyCredentialRequestOptionsJSON = await optionsResponse.json();

    // Step 2: Use browser's WebAuthn API to get assertion
    const credential = await startAuthentication({ optionsJSON: options });

    // Step 3: Send credential to server for verification
    const verifyResponse = await fetch(`${API_BASE}/login-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential }),
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      return { success: false, error: error.error || 'Failed to verify authentication' };
    }

    const result = await verifyResponse.json();
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('Biometric authentication error:', error);
    
    // Handle user cancellation
    if (error.name === 'NotAllowedError') {
      return { success: false, error: 'Biometric authentication was cancelled' };
    }
    
    return { success: false, error: error.message || 'Biometric authentication failed' };
  }
}

/**
 * Get user's registered biometric credentials
 */
export async function getBiometricCredentials(): Promise<{
  success: boolean;
  credentials?: Array<{
    id: number;
    deviceName: string;
    createdAt: Date;
    lastUsedAt: Date | null;
  }>;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/credentials`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to fetch credentials' };
    }

    const credentials = await response.json();
    return { success: true, credentials };
  } catch (error: any) {
    console.error('Error fetching biometric credentials:', error);
    return { success: false, error: error.message || 'Failed to fetch credentials' };
  }
}

/**
 * Delete a biometric credential
 */
export async function deleteBiometricCredential(credentialId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/credentials/${credentialId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to delete credential' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting biometric credential:', error);
    return { success: false, error: error.message || 'Failed to delete credential' };
  }
}

/**
 * Update user's biometric setting (enable/disable)
 */
export async function updateBiometricSetting(enabled: boolean): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ biometricEnabled: enabled }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to update setting' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating biometric setting:', error);
    return { success: false, error: error.message || 'Failed to update setting' };
  }
}

/**
 * Get a user-friendly device name
 */
function getDeviceName(): string {
  const userAgent = navigator.userAgent;
  
  if (/iPad/i.test(userAgent)) return 'iPad';
  if (/iPhone/i.test(userAgent)) return 'iPhone';
  if (/Mac/i.test(userAgent)) return 'Mac';
  if (/Windows/i.test(userAgent)) return 'Windows PC';
  if (/Android/i.test(userAgent)) return 'Android Device';
  
  return 'Unknown Device';
}

/**
 * Get biometric capability description
 */
export async function getBiometricCapability(): Promise<{
  supported: boolean;
  available: boolean;
  type: 'face-id' | 'touch-id' | 'platform-auth' | 'none';
  message: string;
}> {
  const supported = isBiometricSupported();
  
  if (!supported) {
    return {
      supported: false,
      available: false,
      type: 'none',
      message: 'Biometric authentication is not supported in this browser',
    };
  }

  const available = await isPlatformAuthenticatorAvailable();
  
  if (!available) {
    return {
      supported: true,
      available: false,
      type: 'none',
      message: 'No biometric hardware detected on this device',
    };
  }

  const userAgent = navigator.userAgent;
  if (/iPad|iPhone/i.test(userAgent)) {
    return {
      supported: true,
      available: true,
      type: 'face-id',
      message: 'Face ID available',
    };
  }

  if (/Mac/i.test(userAgent)) {
    return {
      supported: true,
      available: true,
      type: 'touch-id',
      message: 'Touch ID available',
    };
  }

  return {
    supported: true,
    available: true,
    type: 'platform-auth',
    message: 'Biometric authentication available',
  };
}
