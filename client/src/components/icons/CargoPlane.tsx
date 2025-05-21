import { forwardRef } from "react";
import { LucideProps } from "lucide-react";

export const CargoPlane = forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {/* C-17 Globemaster style fuselage */}
        <path d="M9,8 L12,6 L15,8 L15,14 L12,16 L9,14 Z" />
        
        {/* Main wings */}
        <path d="M3,12 L9,10 L15,10 L21,12" />
        
        {/* Engine pods */}
        <circle cx="7" cy="11" r="1" />
        <circle cx="17" cy="11" r="1" />
        
        {/* Tail fin */}
        <line x1="12" y1="16" x2="12" y2="18" />
      </svg>
    );
  }
);

CargoPlane.displayName = 'CargoPlane';