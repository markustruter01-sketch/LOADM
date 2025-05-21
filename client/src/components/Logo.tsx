import React from "react";
import logoImage from "../assets/digital-dynamics-logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Digital Dynamics Logo */}
      <div className="mr-3 flex-shrink-0">
        <img 
          src={logoImage} 
          alt="Digital Dynamics Logo" 
          className="h-14 w-auto" 
        />
      </div>
      
      <h1 className="text-2xl font-bold">
        <span className="text-white">LOADM</span><span className="text-orange-500">workflow</span>
      </h1>
    </div>
  );
}

export default Logo;
