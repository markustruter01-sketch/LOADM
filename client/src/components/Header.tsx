import { Link, useLocation } from "wouter";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import { useIsolatedAuth } from "../auth-isolated/auth-context";
import DownloadApp from "./DownloadApp";
import SimpleLoginModal from "./SimpleLoginModal";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useIsolatedAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

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
    <header className="bg-muted shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <Logo />
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          <DownloadApp />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground p-0">
                  <UserCircle style={{ height: '1.7rem', width: '1.7rem' }} />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="font-medium">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {/* Show different menu options based on user role */}
                {(() => { console.log('Header user data:', user); return null; })()}
                {(user.role === 'instructor' || user.role === 'superadmin') && (
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
                      Logout
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
                <UserCircle style={{ height: '1.7rem', width: '1.7rem' }} />
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
