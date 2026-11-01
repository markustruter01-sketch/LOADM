import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useIsolatedAuth } from "@/auth-isolated/auth-context";
import logoImage from "@assets/DDG_Logo_New_1762131149453.png";
import nameImage from "@assets/DDG_NAME_New_1762131149454.png";

interface SimpleLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SimpleLoginModal({ open, onClose, onSuccess }: SimpleLoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const { toast } = useToast();
  const { login } = useIsolatedAuth();

  const validatePassword = (password: string) => {
    if (password.length < 6) return "Password must be at least 6 characters long";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one capital letter";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isFirstTimeUser) {
      // Handle first-time password setup
      if (!newPassword || !confirmPassword) {
        toast({
          title: "Missing information",
          description: "Please enter and confirm your new password",
          variant: "destructive",
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        toast({
          title: "Passwords don't match",
          description: "Please make sure both passwords are identical",
          variant: "destructive",
        });
        return;
      }

      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        toast({
          title: "Invalid password",
          description: passwordError,
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/setup-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword }),
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          toast({
            title: "Password created successfully",
            description: "You can now use your new password to log in",
          });
          setIsFirstTimeUser(false);
          onClose();
          if (onSuccess) onSuccess();
        } else {
          const error = await response.text();
          throw new Error(error || 'Failed to set password');
        }
      } catch (error: any) {
        toast({
          title: "Setup failed",
          description: error.message || "Failed to set up password",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle regular login
      if (!email || !password) {
        toast({
          title: "Missing credentials",
          description: "Please enter both email and password",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      try {
        await login(email, password);
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } catch (error: any) {
        // Check if this is a first-time user
        if (error.message && error.message.includes('first-time')) {
          setIsFirstTimeUser(true);
          setIsLoading(false);
          return;
        }
        
        toast({
          title: "Login failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      } finally {
        if (!isFirstTimeUser) {
          setIsLoading(false);
        }
      }
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsFirstTimeUser(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-[#333333] p-0 overflow-hidden">
        {/* Header Section with Logos */}
        <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] px-8 pt-8 pb-6 border-b border-[#333333]">
          <div className="flex flex-col items-center space-y-4">
            {/* DDG Circular Logo */}
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full"></div>
              <img 
                src={logoImage} 
                alt="DDG Logo" 
                className="h-20 w-auto relative z-10" 
              />
            </div>
            
            {/* Digital Dynamics Group Text Logo */}
            <img 
              src={nameImage} 
              alt="Digital Dynamics Group" 
              className="h-8 w-auto" 
            />
            
            {/* Welcome Text */}
            <div className="text-center space-y-1 pt-2">
              <h2 className="text-xl font-bold text-white">
                {isFirstTimeUser ? "Create Your Password" : "Welcome Back"}
              </h2>
              <p className="text-sm text-gray-400">
                {isFirstTimeUser 
                  ? "Set up a secure password for your account" 
                  : "Sign in to access your LOADMworkflow account"
                }
              </p>
            </div>
          </div>
        </div>
        
        {/* Form Section */}
        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                disabled={isLoading || isFirstTimeUser}
                className="bg-[#2a2a2a] border-[#444444] text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 h-11"
                data-testid="input-email"
              />
            </div>
            
            {!isFirstTimeUser && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="bg-[#2a2a2a] border-[#444444] text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 h-11"
                  data-testid="input-password"
                />
              </div>
            )}

            {isFirstTimeUser && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-300 text-sm font-medium">
                    Create Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create a secure password"
                    disabled={isLoading}
                    className="bg-[#2a2a2a] border-[#444444] text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 h-11"
                    data-testid="input-new-password"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 6 characters with 1 capital letter and 1 special character
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300 text-sm font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                    className="bg-[#2a2a2a] border-[#444444] text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 h-11"
                    data-testid="input-confirm-password"
                  />
                </div>
              </>
            )}
            
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 bg-transparent border-[#444444] text-gray-300 hover:bg-[#2a2a2a] hover:text-white h-11"
                disabled={isLoading}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 h-11 font-semibold shadow-lg shadow-orange-500/20"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isFirstTimeUser ? "Creating..." : "Signing in..."}
                  </>
                ) : (
                  isFirstTimeUser ? "Create Password" : "Sign In"
                )}
              </Button>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="bg-[#2a2a2a] px-8 py-4 border-t border-[#333333]">
          <p className="text-xs text-center text-gray-500">
            Royal Australian Air Force • LOADMworkflow
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
