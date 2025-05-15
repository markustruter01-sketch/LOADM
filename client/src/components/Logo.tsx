import logoPath from "@assets/VirtualDynamicsLogo_2.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <img src={logoPath} alt="Virtual Dynamics Logo" className="h-12 mr-4" />
      <h1 className="text-2xl font-bold text-white">
        LOADM<span className="text-primary">docs</span>
      </h1>
    </div>
  );
}

export default Logo;
