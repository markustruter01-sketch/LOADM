import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useDatabase } from './DatabaseContext';
import { API_ENDPOINTS } from '../config/api';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  squadron?: string;
  category?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { db } = useDatabase();

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
             (id, email, first_name, last_name, role, squadron, category, is_active, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userInfo.id,
              userInfo.email,
              userInfo.firstName || '',
              userInfo.lastName || '',
              userInfo.role,
              userInfo.squadron || '',
              userInfo.category || '',
              1,
              new Date().toISOString()
            ]
          );
        }
        
        setUser(data.user);
        return true;
      } else {
        // If online authentication fails, try offline authentication
        if (db) {
          const result = await db.getFirstAsync(
            'SELECT * FROM users WHERE email = ? AND is_active = 1',
            [email]
          );
          
          if (result) {
            setUser({
              id: result.id as number,
              email: result.email as string,
              firstName: result.first_name as string,
              lastName: result.last_name as string,
              role: result.role as string,
              squadron: result.squadron as string,
              category: result.category as string,
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
            setUser({
              id: result.id as number,
              email: result.email as string,
              firstName: result.first_name as string,
              lastName: result.last_name as string,
              role: result.role as string,
              squadron: result.squadron as string,
              category: result.category as string,
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
        setUser(userData);
      } else {
        // If server request fails, load from local database
        if (db && user) {
          const result = await db.getFirstAsync(
            'SELECT * FROM users WHERE id = ?',
            [user.id]
          );
          
          if (result) {
            setUser({
              id: result.id as number,
              email: result.email as string,
              firstName: result.first_name as string,
              lastName: result.last_name as string,
              role: result.role as string,
              squadron: result.squadron as string,
              category: result.category as string,
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

  useEffect(() => {
    refreshUser();
  }, [db]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
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