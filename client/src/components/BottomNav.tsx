import { Link, useLocation } from "wouter";
import { Home, FileText, ClipboardList, UserCircle, Package2, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: location === "/"
    },
    {
      href: "/scenarios",
      label: "Scenarios",
      icon: ClipboardList,
      active: location.startsWith("/scenarios")
    },
    {
      href: "/load-planning",
      label: "Load Plan",
      icon: Package2,
      active: location.startsWith("/load-planning")
    },
    {
      href: "/documents",
      label: "Documents",
      icon: FileCheck,
      active: location === "/documents" || location === "/cargo-manifest" || location.startsWith("/documents/")
    },
    {
      href: "/profile",
      label: "Profile",
      icon: UserCircle,
      active: location === "/profile" || location === "/auth" || location.startsWith("/instructors-portal")
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full border-t border-border bg-card shadow-lg z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="flex flex-col items-center justify-center w-full p-2 cursor-pointer">
              <div 
                className={cn(
                  "flex flex-col items-center justify-center",
                  item.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}