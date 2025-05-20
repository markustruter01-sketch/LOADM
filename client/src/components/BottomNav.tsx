import { Link, useLocation } from "wouter";
import { Home, ClipboardList, Package2, FileCheck, Wrench, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

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
      href: "/tools",
      label: "Tools",
      icon: Wrench,
      active: location.startsWith("/tools")
    }
  ];

  // Create a combined array of all navigation items for consistent spacing
  const allNavItems = [...navItems];
  
  // Add the Instructor Portal item to the navigation array if user is logged in
  if (user) {
    allNavItems.push({
      href: "/instructors-portal",
      label: "Instructor",
      icon: GraduationCap,
      active: location.startsWith("/instructors-portal"),
      useDirectNavigation: true // Special flag to use direct navigation
    });
  }

  return (
    <div className="fixed bottom-0 left-0 w-full border-t border-border bg-card shadow-lg z-50">
      <div className="grid grid-cols-6 h-16">
        {allNavItems.map((item) => (
          <div key={item.href} className="flex justify-center">
            {item.useDirectNavigation ? (
              <div 
                className="flex flex-col items-center justify-center w-full p-2 cursor-pointer"
                onClick={() => {
                  window.location.href = item.href;
                }}
              >
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
            ) : (
              <Link href={item.href}>
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}