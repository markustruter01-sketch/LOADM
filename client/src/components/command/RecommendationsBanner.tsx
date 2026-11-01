import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, ArrowRight } from "lucide-react";
import type { FlyingSquadron } from "@shared/constants";
import { keys } from "@/lib/keys";
import { LoadingState, ErrorState } from "@/components/common";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/pages/command/types";

const SEVERITY = {
  critical: { icon: AlertOctagon, cls: "border-red-400/40 bg-red-400/10 text-red-400", label: "Critical" },
  warning: { icon: AlertTriangle, cls: "border-amber-400/40 bg-amber-400/10 text-amber-400", label: "Warning" },
  info: { icon: Info, cls: "border-border/60 bg-muted/40 text-muted-foreground", label: "Info" },
} as const;

const ORDER: Record<Recommendation["severity"], number> = { critical: 0, warning: 1, info: 2 };

/** Rule-based recommendations for the selected squadron; "All clear" when the engine returns nothing. */
export function RecommendationsBanner({ squadron }: { squadron: FlyingSquadron | undefined }) {
  const q = useQuery<Recommendation[]>({ queryKey: keys.analytics.recommendations({ squadron }) });
  if (q.isLoading) return <LoadingState rows={1} />;
  if (q.isError) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const items = [...(q.data ?? [])].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-400/30 bg-emerald-400/5 px-4 py-3 text-sm">
        <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
        <div>
          <span className="font-medium text-emerald-400">All clear.</span>{" "}
          <span className="text-muted-foreground">No readiness, review, currency or safety rules are tripped right now.</span>
        </div>
      </div>
    );
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2" aria-label="Recommendations">
      {items.map((r) => {
        const s = SEVERITY[r.severity];
        const Icon = s.icon;
        return (
          <li key={r.id}>
            <Link
              href={r.link}
              className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-muted/40", s.cls)}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{r.title}</span>
                  {r.squadron && <span className="rounded bg-background/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{r.squadron}</span>}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{r.detail}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {r.metric}: <span className="font-semibold tabular-nums text-foreground">{r.value}</span> · threshold {r.threshold}
                </div>
              </div>
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
