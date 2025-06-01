import { useEffect } from "react";
import { useLocation } from "wouter";
import { useIsolatedAuth } from "@/auth-isolated/auth-context";

export default function SuperAdminRedirect() {
  const { user } = useIsolatedAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.isSuperAdmin) {
      // Force redirect to superadmin dashboard
      setLocation('/superadmin-dashboard');
    }
  }, [user, setLocation]);

  return null;
}