import { Link, useLocation } from "wouter";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import DownloadApp from "./DownloadApp";
import LogoutButton from "./LogoutButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

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
                  {user.username}
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {/* Show different menu options based on user role */}
                {(user.userRole === 'instructor' || user.isSuperAdmin) && (
                  <DropdownMenuItem asChild>
                    <Link href="/instructors-portal">
                      <div className="w-full cursor-pointer">Instructors Portal</div>
                    </Link>
                  </DropdownMenuItem>
                )}
                
                {user.isSuperAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/superadmin-dashboard">
                        <div className="w-full cursor-pointer">Admin Dashboard</div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <div className="w-full cursor-pointer">
                    <button 
                      onClick={() => window.location.href = "/auth?logout=true"} 
                      className="w-full text-left px-2 py-1.5 text-sm"
                    >
                      Logout
                    </button>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            location !== "/auth" && location !== "/profile" && (
              <Link href="/profile">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground p-0">
                  <UserCircle style={{ height: '1.7rem', width: '1.7rem' }} />
                  <span className="sr-only">Login</span>
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
