// COMPLETELY ISOLATED FRONTEND AUTHENTICATION
// This works independently of everything else in the app

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface IsolatedAuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const IsolatedAuthContext = createContext<IsolatedAuthContextType | undefined>(undefined);

export function IsolatedAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log('✅ ISOLATED CLIENT: Checking auth status...');
    try {
      const response = await fetch('/api/isolated-auth/user', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ ISOLATED CLIENT: Found authenticated user:', userData.email);
        setUser(userData);
      } else {
        console.log('✅ ISOLATED CLIENT: No authentication found');
        setUser(null);
      }
    } catch (error) {
      console.log('✅ ISOLATED CLIENT: Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('✅ ISOLATED CLIENT: Login attempt for', email);
    try {
      const response = await fetch('/api/isolated-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ ISOLATED CLIENT: Login SUCCESS');
        setUser(userData);
        return true;
      } else {
        console.log('✅ ISOLATED CLIENT: Login FAILED');
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        console.error('Login error:', errorData);
        return false;
      }
    } catch (error) {
      console.error('✅ ISOLATED CLIENT: Login error:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('✅ ISOLATED CLIENT: Logout initiated');
    
    // Clear user immediately
    setUser(null);
    
    // Clear cookies manually
    document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
    document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Call logout API
    fetch('/api/isolated-auth/logout', { 
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(() => {
      console.log('✅ ISOLATED CLIENT: Logout API call complete');
    }).catch(error => {
      console.error('✅ ISOLATED CLIENT: Logout API error:', error);
    });
    
    // Force page refresh to ensure clean state
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  const isAuthenticated = user !== null;

  return (
    <IsolatedAuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      logout, 
      isAuthenticated 
    }}>
      {children}
    </IsolatedAuthContext.Provider>
  );
}

export function useIsolatedAuth() {
  const context = useContext(IsolatedAuthContext);
  if (context === undefined) {
    throw new Error('useIsolatedAuth must be used within an IsolatedAuthProvider');
  }
  return context;
}