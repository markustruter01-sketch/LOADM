// 🔥 NUCLEAR AUTHENTICATION - Complete frontend rebuild
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 NUCLEAR: Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {

    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('🔥 NUCLEAR CLIENT: Auth found:', userData.email);
        setUser(userData);
      } else {
        console.log('🔥 NUCLEAR CLIENT: No authentication');
        setUser(null);
      }
    } catch (error) {
      console.log('🔥 NUCLEAR CLIENT: Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔥 NUCLEAR CLIENT: Login attempt for', email);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('🔥 NUCLEAR CLIENT: Login success');
        setUser(userData);
        return true;
      } else {
        console.log('🔥 NUCLEAR CLIENT: Login failed');
        return false;
      }
    } catch (error) {
      console.error('🔥 NUCLEAR CLIENT: Login error:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('🔥 NUCLEAR CLIENT: Logout initiated');
    setUser(null);
    
    // Clear any cookies manually
    document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Call logout API
    fetch('/api/logout', { 
      method: 'POST',
      credentials: 'include'
    }).catch(console.error);
    
    // Force redirect
    window.location.replace('/');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}