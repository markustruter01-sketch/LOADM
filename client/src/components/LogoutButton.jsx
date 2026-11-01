import { useState } from "react";
import { useIsolatedAuth } from "@/auth-isolated/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function LogoutButton({ variant = "ghost", className = "" }) {
  const { logoutMutation } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutMutation.mutateAsync();
      // Redirect is handled in the auth hook
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };
  
  return (
    <Button 
      variant={variant} 
      onClick={handleLogout} 
      disabled={isLoggingOut}
      className={className}
    >
      <LogOut className="h-4 w-4 mr-2" />
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  );
}