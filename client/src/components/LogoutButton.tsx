import { useIsolatedAuth } from "@/auth-isolated/auth-context";
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
  const { logout } = useIsolatedAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = () => {
    setIsLoggingOut(true);
    logout(); // The isolated logout handles everything
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