import { CheckCircle2, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MissionStatusBadge({ completed }: { completed: boolean }) {
  return completed ? (
    <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-400">
      <CheckCircle2 className="h-3 w-3" /> Completed
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 border-primary/50 text-primary">
      <CircleDot className="h-3 w-3" /> Active
    </Badge>
  );
}
