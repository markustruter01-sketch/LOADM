import React from "react";
import logoImage from "@assets/ddg-logo.png";
import nameImage from "@assets/ddg-name.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* DDG Logo */}
      <div className="flex-shrink-0">
        <img 
          src={logoImage} 
          alt="DDG Logo" 
          className="h-8 w-auto" 
        />
      </div>
      
      {/* Digital Dynamics Group Text Logo */}
      <div className="flex-shrink-0">
        <img 
          src={nameImage} 
          alt="Digital Dynamics Group" 
          className="h-5 w-auto" 
        />
      </div>
    </div>
  );
}

export default Logo;
