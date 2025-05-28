import { Link, useLocation } from "wouter";
import { Home, ClipboardList, Package2, FileCheck, Wrench, GraduationCap } from "lucide-react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import SimpleLoginModal from "./SimpleLoginModal";
import { cn } from "@/lib/utils";
import { ForwardRefExoticComponent, RefAttributes, useState } from "react";
import { LucideProps } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  active: boolean;
}

export default function BottomNav() {
  const [location] = useLocation();
  const { user } = useSimpleAuth();
  const [, setLocation] = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const requireLogin = (targetPath: string) => {
    if (!user) {
      setPendingNavigation(targetPath);
      setShowLoginModal(true);
      return;
    }
    setLocation(targetPath);
  };

  const handleLoginSuccess = () => {
    if (pendingNavigation) {
      setLocation(pendingNavigation);
      setPendingNavigation(null);
    }
  };

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
      icon: Package2,
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
    },
    {
      href: "/instructors-portal",
      label: "Instructor",
      icon: GraduationCap,
      active: location.startsWith("/instructors-portal")
    }
  ];

  // Create a combined array of all navigation items for consistent spacing
  const allNavItems = [...navItems];

  const handleNavClick = (href: string) => {
    // Only allow home page access without login, everything else requires authentication
    if (href === "/") {
      setLocation(href);
    } else {
      requireLogin(href);
    }
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

      {/* Login Modal */}
      <SimpleLoginModal 
        open={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}