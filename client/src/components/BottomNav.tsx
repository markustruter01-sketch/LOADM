import { Link, useLocation } from "wouter";
import { Home, ClipboardList, Plane, FileCheck, Wrench, GraduationCap } from "lucide-react";
import { useIsolatedAuth } from "../auth-isolated/auth-context";
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
  const { user } = useIsolatedAuth();
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
      icon: Plane,
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

  const allNavItems = [...navItems];

  const handleNavClick = (href: string) => {
    setLocation(href);
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-8 pointer-events-none">
      <div className="flex justify-between items-center pointer-events-auto max-w-screen-xl mx-auto">
        {allNavItems.map((item) => (
          <button
            key={item.href}
            onClick={() => handleNavClick(item.href)}
            className={cn(
              "relative group flex items-center justify-center rounded-full",
              "w-[84px] h-[84px] transition-all duration-300 shadow-lg hover:shadow-xl",
              "backdrop-blur-sm border-2",
              item.active 
                ? "bg-primary border-primary text-primary-foreground scale-[1.15]" 
                : "bg-card/90 border-border text-muted-foreground hover:text-foreground hover:scale-105 hover:bg-card"
            )}
            aria-label={item.label}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <item.icon className="h-9 w-9" />
            
            {/* Tooltip on hover */}
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-popover text-popover-foreground text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-md border border-border">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
