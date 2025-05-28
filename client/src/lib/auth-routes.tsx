import React, { useEffect } from "react";
import { Route, useLocation } from "wouter";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
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
 * InstructorRoute - Route that requires instructor privileges or superadmin
 * Redirects to home if user is not an instructor or superadmin
 */
export function InstructorRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  return (
    <Route path={path}>
      {(params) => (
        <InstructorCheck>
          <Component {...params} />
        </InstructorCheck>
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
  const { user, isLoading } = useSimpleAuth();
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
  const { user, isLoading } = useSimpleAuth();
  const [, navigate] = useLocation();

  // Only redirect if explicitly not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to home page instead of auth page
      navigate("/");
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
  const { user, isLoading } = useSimpleAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !user.isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need superadmin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * InstructorCheck - Component that checks if user is an instructor or superadmin
 * Redirects to home if not authorized
 */
function InstructorCheck({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSimpleAuth();

  // Debug logging
  console.log('InstructorCheck - User:', user);
  console.log('InstructorCheck - isLoading:', isLoading);
  console.log('InstructorCheck - user?.isAdmin:', user?.isAdmin);
  console.log('InstructorCheck - user?.isSuperAdmin:', user?.isSuperAdmin);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (!user.isAdmin && !user.isSuperAdmin)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need instructor privileges to access this page.</p>
          <p className="text-xs text-gray-500 mt-2">Debug: User: {JSON.stringify(user)}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}