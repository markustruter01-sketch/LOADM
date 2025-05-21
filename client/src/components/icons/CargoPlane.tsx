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
        {/* Nose and fuselage */}
        <path d="M12,4 L14,7 L14,16 L12,19 L10,16 L10,7 L12,4" />
        
        {/* Main wings */}
        <path d="M4,11 L10,8 L14,8 L20,11" />
        
        {/* Tail wings */}
        <path d="M8,16 L10,15 L14,15 L16,16" />
      </svg>
    );
  }
);

CargoPlane.displayName = 'CargoPlane';