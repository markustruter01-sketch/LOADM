import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface AuthCheckProps {
  children: ReactNode;
}

/**
 * AuthCheck - A component that ensures the user is authenticated.
 * If the user is not authenticated, they are redirected to the login page.
 */
export default function AuthCheck({ children }: AuthCheckProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Use effect for redirecting unauthenticated users
  useEffect(() => {
    if (!isLoading && !user) {
      // Only redirect if we're sure the user is not authenticated
      navigate("/auth");
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

  // If authenticated, render children
  return user ? <>{children}</> : null;
}