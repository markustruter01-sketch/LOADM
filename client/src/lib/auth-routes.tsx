import React from "react";
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

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    navigate("/auth");
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
}