import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect to Instructors Portal if logged in
        setLocation("/instructors-portal");
      } else {
        // Redirect to Auth page if not logged in
        setLocation("/auth");
      }
    }
  }, [user, isLoading, setLocation]);

  // Show loading indicator while authentication state is being determined
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}