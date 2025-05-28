import { createContext, ReactNode, useContext, useState, useEffect } from "react";

type AuthContextType = {
  user: any | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/user', { credentials: 'include' });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const userData = await response.json();
    setUser(userData);
  };

  const logout = () => {
    // Clear user immediately
    setUser(null);
    
    // Call logout API in background
    fetch('/api/logout', { 
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    }).catch(console.error);
    
    // Force immediate redirect
    window.location.replace('/');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};

// Also export as useSimpleAuth for compatibility
export const useSimpleAuth = useAuth;