import { Link, useLocation } from "wouter";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import { useIsolatedAuth } from "../auth-isolated/auth-context";
import SimpleLoginModal from "./SimpleLoginModal";
import { useState, useEffect } from "react";
import { ROLE_LABELS } from "@shared/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useIsolatedAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navigateTo = (targetPath: string) => {
    setLocation(targetPath);
  };

  const handleLoginSuccess = () => {
    if (pendingNavigation) {
      setLocation(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  return (
    <header className="backdrop-blur-md bg-background/70 border-b border-border shadow-md">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <Logo />
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          {/* Network Status Indicator */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-default" data-testid="network-status-indicator">
                  <div 
                    className={`w-2.5 h-2.5 rounded-full ${
                      isOnline 
                        ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' 
                        : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                    } animate-pulse`}
                  />
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isOnline ? (
                  <p className="text-xs">Connected to server</p>
                ) : (
                  <div className="text-xs">
                    <p className="font-medium">Offline - Local Mode</p>
                    <p className="text-muted-foreground">Working locally. Do not refresh.</p>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground px-2 gap-2 h-auto">
                  <span className="text-right leading-tight">
                    <span className="block text-sm font-medium text-foreground">{ROLE_LABELS[user.demoRole]}</span>
                    <span className="block text-xs">{user.firstName} {user.lastName}</span>
                  </span>
                  <UserCircle style={{ height: '1.8rem', width: '1.8rem' }} />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="font-medium">
                  {ROLE_LABELS[user.demoRole]} · {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {(user.role === 'leadership' || user.role === 'superadmin') && (
                  <DropdownMenuItem asChild>
                    <div className="w-full cursor-pointer" onClick={() => setLocation("/leadership-portal")}>
                      Command Dashboard
                    </div>
                  </DropdownMenuItem>
                )}

                {(user.role === 'instructor' || user.role === 'leadership' || user.role === 'superadmin') && (
                  <DropdownMenuItem asChild>
                    <div className="w-full cursor-pointer" onClick={() => setLocation("/instructors-portal")}>
                      Instructors Portal
                    </div>
                  </DropdownMenuItem>
                )}
                

                
                {user.role === 'superadmin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <div className="w-full cursor-pointer" onClick={() => setLocation("/superadmin-dashboard")}>
                        Admin Dashboard
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuItem asChild>
                  <div className="w-full cursor-pointer" onClick={() => setLocation("/user-profile")}>
                    User Profile
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <div className="w-full cursor-pointer">
                    <button 
                      onClick={logout} 
                      className="w-full text-left px-2 py-1.5 text-sm"
                    >
                      Switch role
                    </button>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            location !== "/auth" && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground p-0"
                onClick={() => setShowLoginModal(true)}
              >
                <UserCircle style={{ height: '1.8rem', width: '1.8rem' }} />
                <span className="sr-only">Login</span>
              </Button>
            )
          )}
        </div>
      </div>

      {/* Login Modal */}
      <SimpleLoginModal 
        open={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </header>
  );
}
