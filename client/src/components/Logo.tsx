import { useEffect, useState } from "react";

export function Logo({ className = "" }: { className?: string }) {
  const [logoUrl, setLogoUrl] = useState("/logo512.png");
  
  useEffect(() => {
    // Ensure the logo is loaded from the public directory
    const img = new Image();
    img.src = "/logo512.png";
    img.onload = () => setLogoUrl("/logo512.png");
    img.onerror = () => {
      // Fallback to the original path if needed
      setLogoUrl("/assets/digital-dynamics-logo.png");
    };
  }, []);

  return (
    <div className={`flex items-center ${className}`}>
      <img src={logoUrl} alt="Digital Dynamics Logo" className="h-14 mr-4" style={{ objectFit: 'contain' }} />
      <h1 className="text-2xl font-bold">
        <span className="text-white">LOADM</span><span className="text-primary">workflow</span>
      </h1>
    </div>
  );
}

export default Logo;
