import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";

// Route that requires admin privileges
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // If user is not logged in or not an admin, redirect to auth page
  if (!user || !user.isAdmin) {
    // Check if we have a session cookie even if the user state is empty
    return (
      <Route path={path}>
        <AdminCheckWrapper>
          <Component />
        </AdminCheckWrapper>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}

// Route that only requires authentication (any user, not just admin)
export function AuthenticatedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // If user is not logged in, redirect to auth page
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // User is logged in, render the component
  return <Route path={path} component={Component} />;
}

// Component that checks for admin auth and either renders children or redirects
function AdminCheckWrapper({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data?.isAdmin === true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAdmin();
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return isAdmin ? <>{children}</> : <Redirect to="/auth" />;
}

// Component that checks for auth and either renders children or redirects
function AuthCheckWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Redirect to="/auth" />;
}
