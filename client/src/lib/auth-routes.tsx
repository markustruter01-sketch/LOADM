import React, { useEffect } from "react";
import { Route, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

/**
 * ProtectedRoute - Route that requires admin privileges
 * Redirects to login if user is not authenticated or not an admin
 */
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  return (
    <Route path={path}>
      {(params) => (
        <AdminCheck>
          <Component {...params} />
        </AdminCheck>
      )}
    </Route>
  );
}

/**
 * AuthenticatedRoute - Route that requires user authentication
 * Redirects to login if user is not authenticated
 */
export function AuthenticatedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  return (
    <Route path={path}>
      {(params) => (
        <UserCheck>
          <Component {...params} />
        </UserCheck>
      )}
    </Route>
  );
}

/**
 * SuperAdminRoute - Route that requires superadmin privileges
 * Redirects to login if user is not authenticated or not a superadmin
 */
export function SuperAdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  return (
    <Route path={path}>
      {(params) => (
        <SuperAdminCheck>
          <Component {...params} />
        </SuperAdminCheck>
      )}
    </Route>
  );
}

/**
 * AdminCheck - Component that checks if user is an admin
 * Redirects to login if not
 */
function AdminCheck({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!user || !user.isAdmin) {
    navigate("/auth");
    return null;
  }

  // User is admin, render children
  return <>{children}</>;
}

/**
 * UserCheck - Component that checks if user is authenticated
 * Redirects to login if not
 */
function UserCheck({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Only redirect if explicitly not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      // Store the current path to return after login
      const returnPath = window.location.pathname;
      navigate(`/auth?returnTo=${encodeURIComponent(returnPath)}`);
    }
  }, [user, isLoading, navigate]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we have a user or we're still loading, render children
  return user ? <>{children}</> : null;
}

/**
 * SuperAdminCheck - Component that checks if user is a superadmin
 * Redirects to home if not a superadmin, redirects to login if not authenticated
 */
function SuperAdminCheck({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!user.isSuperAdmin) {
        navigate("/"); // Redirect non-superadmins to home
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !user.isSuperAdmin) {
    return null;
  }

  return <>{children}</>;
}