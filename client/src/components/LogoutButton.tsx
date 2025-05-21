import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";

interface LogoutButtonProps {
  variant?: "ghost" | "outline" | "default";
  showIcon?: boolean;
  className?: string;
}

export default function LogoutButton({ 
  variant = "default", 
  showIcon = true,
  className = ""
}: LogoutButtonProps) {
  const { logoutMutation } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutMutation.mutateAsync();
      // Redirect happens in the mutation
    } catch (error) {
      console.error("Logout failed:", error);
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
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  );
}