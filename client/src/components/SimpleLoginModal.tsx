import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useIsolatedAuth } from "@/auth-isolated/auth-context";

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isFirstTimeUser ? "Create Your Password" : "Login Required"}
          </DialogTitle>
        </DialogHeader>
        <div className="text-center text-muted-foreground mb-6">
          {isFirstTimeUser 
            ? "Welcome! Please create a secure password for your account." 
            : "Please log in to access this feature"
          }
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={isLoading || isFirstTimeUser}
            />
          </div>
          
          {!isFirstTimeUser && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>
          )}

          {isFirstTimeUser && (
            <>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Create Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a secure password"
                  disabled={isLoading}
                />
                <div className="text-xs text-muted-foreground">
                  Must be at least 6 characters with 1 capital letter and 1 special character
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
              </div>
            </>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isFirstTimeUser ? "Creating..." : "Logging in..."}
                </>
              ) : (
                isFirstTimeUser ? "Create Password" : "Login"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}