import { Link, useLocation } from "wouter";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
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
                <DropdownMenuItem>
                  <Link href="/profile">
                    <div className="w-full cursor-pointer">Profile</div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/instructors-portal">
                    <div className="w-full cursor-pointer">Instructors Portal</div>
                  </Link>
                </DropdownMenuItem>
                {user.isAdmin && (
                  <>
                    <DropdownMenuItem>
                      <Link href="/admin">
                        <div className="w-full cursor-pointer">Admin Dashboard</div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  Logout
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
