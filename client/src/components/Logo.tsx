import React from "react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/logo.png" 
        alt="Digital Dynamics Logo" 
        className="h-12 mr-4"
      />
      <h1 className="text-2xl font-bold">
        <span className="text-white">LOADM</span><span className="text-primary">workflow</span>
      </h1>
    </div>
  );
}

export default Logo;
