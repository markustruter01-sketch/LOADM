import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function SuperAdminRedirect() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.isSuperAdmin) {
      // Force redirect to superadmin dashboard
      setLocation('/superadmin-dashboard');
    }
  }, [user, setLocation]);

  return null;
}