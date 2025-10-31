import React from "react";
import logoImage from "@assets/DDG_Logo_New_1761874170755.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      {/* DDG Logo */}
      <div className="mr-3 flex-shrink-0">
        <img 
          src={logoImage} 
          alt="DDG Logo" 
          className="h-16 w-auto" 
        />
      </div>
      
      <h1 className="text-2xl font-bold">
        <span className="text-white">LOADM</span><span className="text-orange-500">workflow</span>
      </h1>
    </div>
  );
}

export default Logo;
