import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Add a small delay to prevent immediate redirects during auth state transitions
    const timer = setTimeout(() => {
      if (!isLoading && !user) {
        setLocation("/");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, isLoading, setLocation]);

  // Show loading indicator while authentication state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated, render the children components
  if (user) {
    return <>{children}</>;
  }

  // Return loading state instead of null to prevent flashing
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}