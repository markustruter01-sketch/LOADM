// COMPLETELY ISOLATED FRONTEND AUTHENTICATION
// This works independently of everything else in the app

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  userRole?: string;
  licenseType?: string;
  squadron?: string;
  isFirstLogin?: boolean;
  hasCompletedOnboarding?: boolean;
}

interface IsolatedAuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
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
      const response = await fetch('/auth-isolated/user', {
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
      const response = await fetch('/auth-isolated/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      console.log('✅ ISOLATED CLIENT: Response status:', response.status);
      console.log('✅ ISOLATED CLIENT: Response headers:', response.headers.get('content-type'));
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('✅ ISOLATED CLIENT: Raw response:', responseText);
        
        try {
          const userData = JSON.parse(responseText);
          console.log('✅ ISOLATED CLIENT: Login SUCCESS');
          setUser(userData);
          return true;
        } catch (parseError) {
          console.error('✅ ISOLATED CLIENT: JSON parse error:', parseError);
          console.error('✅ ISOLATED CLIENT: Response was:', responseText);
          return false;
        }
      } else {
        const errorText = await response.text();
        console.log('✅ ISOLATED CLIENT: Login FAILED - Response:', errorText);
        
        // Handle license expiry errors
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.code === 'LICENSE_EXPIRED') {
            throw new Error('Your license has expired. Please contact your administrator to renew your access.');
          } else if (errorData.code === 'INVALID_LICENSE') {
            throw new Error('Your license is invalid or inactive. Please contact your administrator.');
          }
        } catch (parseError) {
          // If JSON parsing fails, continue with generic error
        }
        
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
    fetch('/auth-isolated/logout', { 
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

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  const isAuthenticated = user !== null;

  return (
    <IsolatedAuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      logout, 
      refreshUser,
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