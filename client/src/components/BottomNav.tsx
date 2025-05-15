import { Link, useLocation } from "wouter";
import { Home, FileText, ClipboardList, UserCircle } from "lucide-react";
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
      href: "/documents",
      label: "Documents",
      icon: FileText,
      active: location.startsWith("/documents")
    },
    {
      href: "/scenarios",
      label: "Scenarios",
      icon: ClipboardList,
      active: location.startsWith("/scenarios")
    },
    {
      href: "/auth",
      label: "Profile",
      icon: UserCircle,
      active: location === "/auth"
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full border-t border-border bg-muted z-50 lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="flex flex-col items-center justify-center flex-1 h-full cursor-pointer">
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