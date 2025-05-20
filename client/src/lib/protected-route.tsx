import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

// Route that requires admin privileges
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    async function verifyAdminAccess() {
      try {
        const response = await fetch("/api/user", {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json"
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData && userData.isAdmin) {
            setIsAuthorized(true);
          }
        }
      } catch (error) {
        console.error("Error verifying admin access:", error);
      } finally {
        setIsVerifying(false);
      }
    }

    if (!isLoading) {
      verifyAdminAccess();
    }
  }, [isLoading]);

  if (isLoading || isVerifying) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!isAuthorized) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
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
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    async function verifyAuthentication() {
      try {
        const response = await fetch("/api/user", {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json"
          }
        });
        
        if (response.ok) {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error("Error verifying authentication:", error);
      } finally {
        setIsVerifying(false);
      }
    }

    if (!isLoading) {
      verifyAuthentication();
    }
  }, [isLoading]);

  if (isLoading || isVerifying) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!isAuthorized) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
