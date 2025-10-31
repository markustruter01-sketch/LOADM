import React from "react";
import logoImage from "@assets/DDG_Logo_New_1761874170755.png";
import nameImage from "@assets/DDG_NAME_New_1761874703030.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* DDG Logo */}
      <div className="flex-shrink-0">
        <img 
          src={logoImage} 
          alt="DDG Logo" 
          className="h-16 w-auto" 
        />
      </div>
      
      {/* Digital Dynamics Group Text Logo */}
      <div className="flex-shrink-0">
        <img 
          src={nameImage} 
          alt="Digital Dynamics Group" 
          className="h-11 w-auto" 
        />
      </div>
    </div>
  );
}

export default Logo;
