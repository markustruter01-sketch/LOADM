import React from "react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Simplified Digital Dynamics Logo */}
      <div className="mr-3 flex-shrink-0">
        <svg 
          width="40" 
          height="40" 
          viewBox="0 0 100 100" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shield Shape */}
          <path d="M15 25 L50 15 L85 25 L85 60 C85 70 75 85 50 90 C25 85 15 70 15 60 Z" 
                fill="#1e1e1e" stroke="#ff6600" strokeWidth="2" />
          
          {/* Orange Diagonal Stripes */}
          <path d="M25 30 L35 45" stroke="#ff6600" strokeWidth="3" strokeLinecap="round" />
          <path d="M30 25 L40 40" stroke="#ff6600" strokeWidth="3" strokeLinecap="round" />
          <path d="M20 40 L30 55" stroke="#ff6600" strokeWidth="3" strokeLinecap="round" />
          
          {/* Aircraft Silhouette */}
          <path d="M25 45 L75 45 M30 40 L70 40 M35 50 L65 50" 
                stroke="#ff6600" strokeWidth="2" fill="none" />
          <path d="M40 35 L60 35 L65 40 L65 50 L60 55 L40 55 L35 50 L35 40 Z" 
                fill="#333333" stroke="#ff6600" strokeWidth="1" />
          <circle cx="30" cy="45" r="3" fill="#333333" stroke="#ff6600" strokeWidth="1" />
          <circle cx="70" cy="45" r="3" fill="#333333" stroke="#ff6600" strokeWidth="1" />
          
          {/* "DD" for Digital Dynamics */}
          <path d="M40 65 L45 65 C47 65 49 67 49 70 C49 73 47 75 45 75 L40 75 Z" 
                fill="#ffffff" />
          <path d="M55 65 L60 65 C62 65 64 67 64 70 C64 73 62 75 60 75 L55 75 Z" 
                fill="#ff6600" />
        </svg>
      </div>
      
      <h1 className="text-2xl font-bold">
        <span className="text-white">LOADM</span><span className="text-orange-500">workflow</span>
      </h1>
    </div>
  );
}

export default Logo;
