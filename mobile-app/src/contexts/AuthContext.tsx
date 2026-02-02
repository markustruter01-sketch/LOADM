import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useDatabase } from './DatabaseContext';
import { API_ENDPOINTS } from '../config/api';

// License types matching web app permissions
export type LicenseType = 'loadmaster' | 'instructor' | 'superadmin' | 'readonly' | 'leadership';

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  licenseType?: LicenseType;
  squadron?: string;
  category?: string;
  rank?: string;
  hasCompletedOnboarding?: boolean;
  profilePhotoUrl?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isReadOnlyMode: boolean;
  isLeadershipRole: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { db } = useDatabase();

  // Check if user is in read-only mode (leadership or readonly roles)
  const isReadOnlyMode = user?.licenseType === 'leadership' || 
                         user?.licenseType === 'readonly' ||
                         user?.role === 'leadership' ||
                         user?.role === 'readonly';

  const isLeadershipRole = user?.licenseType === 'leadership' || user?.role === 'leadership';

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // First try to authenticate with the backend server
      const response = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store session token securely
        await SecureStore.setItemAsync('sessionToken', data.sessionToken);
        
        // Store user data locally
        if (db) {
          const userInfo = data.user;
          await db.runAsync(
            `INSERT OR REPLACE INTO users 
             (id, email, first_name, last_name, role, squadron, category, rank, has_completed_onboarding, is_active, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userInfo.id,
              userInfo.email,
              userInfo.firstName || '',
              userInfo.lastName || '',
              userInfo.licenseType || userInfo.role,
              userInfo.squadron || '',
              userInfo.category || '',
              userInfo.rank || '',
              userInfo.hasCompletedOnboarding ? 1 : 0,
              1,
              new Date().toISOString()
            ]
          );
        }
        
        setUser({
          ...data.user,
          licenseType: data.user.licenseType || data.user.role,
        });
        return true;
      } else {
        // If online authentication fails, try offline authentication
        if (db) {
          const result = await db.getFirstAsync(
            'SELECT * FROM users WHERE email = ? AND is_active = 1',
            [email]
          );
          
          if (result) {
            const role = result.role as string;
            setUser({
              id: result.id as number,
              email: result.email as string,
              firstName: result.first_name as string,
              lastName: result.last_name as string,
              role: role,
              licenseType: role as LicenseType,
              squadron: result.squadron as string,
              category: result.category as string,
              rank: result.rank as string,
              hasCompletedOnboarding: Boolean(result.has_completed_onboarding),
            });
            return true;
          }
        }
        return false;
      }
    } catch (error) {
      console.log('Online authentication failed, trying offline...');
      
      // Fallback to offline authentication
      if (db) {
        try {
          const result = await db.getFirstAsync(
            'SELECT * FROM users WHERE email = ? AND is_active = 1',
            [email]
          );
          
          if (result) {
            const role = result.role as string;
            setUser({
              id: result.id as number,
              email: result.email as string,
              firstName: result.first_name as string,
              lastName: result.last_name as string,
              role: role,
              licenseType: role as LicenseType,
              squadron: result.squadron as string,
              category: result.category as string,
              rank: result.rank as string,
              hasCompletedOnboarding: Boolean(result.has_completed_onboarding),
            });
            return true;
          }
        } catch (dbError) {
          console.error('Offline authentication failed:', dbError);
        }
      }
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear session from server
      const sessionToken = await SecureStore.getItemAsync('sessionToken');
      if (sessionToken) {
        await fetch(API_ENDPOINTS.AUTH_LOGOUT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
          },
        });
      }
    } catch (error) {
      console.log('Logout request failed (offline mode)');
    }
    
    // Clear local session
    await SecureStore.deleteItemAsync('sessionToken');
    setUser(null);
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const sessionToken = await SecureStore.getItemAsync('sessionToken');
      if (!sessionToken) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.AUTH_USER, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser({
          ...userData,
          licenseType: userData.licenseType || userData.role,
        });
      } else {
        // If server request fails, load from local database
        if (db && user) {
          const result = await db.getFirstAsync(
            'SELECT * FROM users WHERE id = ?',
            [user.id]
          );
          
          if (result) {
            const role = result.role as string;
            setUser({
              id: result.id as number,
              email: result.email as string,
              firstName: result.first_name as string,
              lastName: result.last_name as string,
              role: role,
              licenseType: role as LicenseType,
              squadron: result.squadron as string,
              category: result.category as string,
              rank: result.rank as string,
              hasCompletedOnboarding: Boolean(result.has_completed_onboarding),
            });
          }
        }
      }
    } catch (error) {
      console.log('User refresh failed, using cached data');
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (): Promise<void> => {
    if (!user) return;

    try {
      // Update local database
      if (db) {
        await db.runAsync(
          'UPDATE users SET has_completed_onboarding = 1 WHERE id = ?',
          [user.id]
        );
      }

      // Update server
      const sessionToken = await SecureStore.getItemAsync('sessionToken');
      if (sessionToken) {
        await fetch(API_ENDPOINTS.COMPLETE_ONBOARDING, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json',
          },
        });
      }

      // Update local state
      setUser({ ...user, hasCompletedOnboarding: true });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [db]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isReadOnlyMode,
        isLeadershipRole,
        login,
        logout,
        refreshUser,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
