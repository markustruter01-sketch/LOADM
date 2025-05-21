import { Link, useLocation } from "wouter";
import { Home, ClipboardList, FileCheck, Wrench, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import { LucideProps } from "lucide-react";
import { CargoPlane } from "@/components/icons/CargoPlane";

interface NavItem {
  href: string;
  label: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  active: boolean;
}

export default function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const navItems: NavItem[] = [
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
      href: "/airframe",
      label: "Airframe",
      icon: CargoPlane,
      active: location.startsWith("/airframe") || location.startsWith("/load-planning") || location.startsWith("/training-modules")
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
      active: location.startsWith("/instructors-portal")
    });
  }

  const handleNavClick = (href: string) => {
    // Use the wouter setLocation for a faster navigation with no page refresh
    setLocation(href);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full border-t border-border bg-card shadow-lg z-50">
      <div className="grid grid-cols-6 h-16">
        {allNavItems.map((item) => (
          <div key={item.href} className="flex justify-center">
            <div 
              className="flex flex-col items-center justify-center w-full p-2 cursor-pointer"
              onClick={() => handleNavClick(item.href)}
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
          </div>
        ))}
      </div>
    </div>
  );
}