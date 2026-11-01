import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)} aria-label="LOADM">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Plane className="h-4 w-4 -rotate-45" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-base font-bold tracking-wide">LOADM</span>
          <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Loadmaster Ops</span>
        </span>
      )}
    </div>
  );
}

export default Logo;
