import logoPath from "@assets/digital-dynamics-logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <img src={logoPath} alt="Digital Dynamics Logo" className="h-16 mr-4" />
      <h1 className="text-2xl font-bold">
        <span className="text-white">LOADM</span><span className="text-primary">workflow</span>
      </h1>
    </div>
  );
}

export default Logo;
