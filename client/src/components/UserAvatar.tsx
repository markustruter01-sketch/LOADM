import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

/** Generic profile icon. The app stores no profile photos. */
export function UserAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary", className)}
      aria-hidden
    >
      <UserRound className="h-1/2 w-1/2" />
    </span>
  );
}
