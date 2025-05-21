export function Logo({ className = "" }: { className?: string }) {
  // Using a direct public URL reference to ensure the image loads
  const logoUrl = "/logo.png";
  
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoUrl} 
        alt="Digital Dynamics Logo" 
        className="h-12 mr-4"
        onError={(e) => {
          // Fallback text if image fails to load
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.style.display = 'none';
        }}
      />
      <h1 className="text-2xl font-bold">
        <span className="text-white">LOADM</span><span className="text-primary">workflow</span>
      </h1>
    </div>
  );
}

export default Logo;
