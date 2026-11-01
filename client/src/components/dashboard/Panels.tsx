import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BellRing, BookOpen, Clock, Gauge, X } from "lucide-react";
import { AIRCRAFT_LABELS, THRESHOLDS } from "@shared/constants";
import { keys } from "@/lib/keys";
import { post } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, QueryState, ScoreBadge, Spinner, formatDate } from "@/components/common";
import { cn } from "@/lib/utils";
import type { ScenarioNotification, ScenarioSubmissionRow } from "@/pages/scenarios/types";
import type { TrainingModuleListItem } from "@/pages/training/types";

/** Reviewed-scenario notifications, dismissible one at a time or all at once. */
export function ReviewedNotifications() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery<ScenarioNotification[]>({ queryKey: keys.scenarios.notifications });
  const dismiss = useMutation({
    mutationFn: (ids?: number[]) => post<{ dismissed: number }>("/api/scenarios/notifications/dismiss", ids ? { ids } : {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.scenarios.notifications });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not dismiss", description: e.message }),
  });

  const items = q.data ?? [];
  if (items.length === 0) return null;

  return (
    <Alert className="mb-6 border-primary/40 bg-primary/5">
      <BellRing className="h-4 w-4 text-primary" aria-hidden />
      <AlertTitle className="flex items-center justify-between gap-2">
        <span>
          {items.length === 1 ? "A scenario has been reviewed" : `${items.length} scenarios have been reviewed`}
        </span>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => dismiss.mutate(undefined)} disabled={dismiss.isPending}>
          Dismiss all
        </Button>
      </AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1.5">
          {items.map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-3 text-sm">
              <Link href={`/scenarios/results/${n.id}`} className="flex min-w-0 items-center gap-2 hover:text-primary">
                <span className="truncate">{n.scenarioTitle}</span>
                <ScoreBadge score={n.score} passed={n.passed} />
                <span className="hidden text-xs text-muted-foreground sm:inline">pass mark {n.passMark}% · {formatDate(n.reviewedAt)}</span>
              </Link>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Dismiss notification" onClick={() => dismiss.mutate([n.id])} disabled={dismiss.isPending}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

/** Modules the person has not yet passed. */
export function ContinueTraining({ limit = 4 }: { limit?: number }) {
  const q = useQuery<TrainingModuleListItem[]>({ queryKey: keys.training.modules() });
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Continue training</CardTitle>
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
          <Link href="/training">
            All modules <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <QueryState
          query={q}
          rows={2}
          isEmpty={(d) => d.filter((m) => !m.myCompletion?.passed).length === 0}
          empty={<EmptyState title="All modules passed" description="Nice work. New modules will appear here when they are published." />}
        >
          {(modules) => (
            <ul className="divide-y divide-border/60">
              {modules
                .filter((m) => !m.myCompletion?.passed)
                .slice(0, limit)
                .map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link href={`/training/${m.id}`} className="block truncate text-sm font-medium hover:text-primary">
                        {m.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        {m.aircraft && <span>{AIRCRAFT_LABELS[m.aircraft]}</span>}
                        <span className="capitalize">{m.difficulty}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" aria-hidden />
                          {m.durationMinutes} min
                        </span>
                      </div>
                    </div>
                    {m.myCompletion ? (
                      <Badge variant="outline" className="shrink-0 border-amber-500/50 text-amber-400">
                        Retry · {m.myCompletion.score}%
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-muted-foreground">
                        Not started
                      </Badge>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </QueryState>
      </CardContent>
    </Card>
  );
}

/** Compact instructor hub: pending reviews with a link to the instructor area. */
export function InstructorPanel() {
  const q = useQuery<ScenarioSubmissionRow[]>({ queryKey: keys.scenarios.submissions({ status: "submitted" }) });
  const pending = q.data?.length ?? 0;
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4 text-primary" aria-hidden /> Instructor
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <div>
          <div className={cn("text-3xl font-semibold tabular-nums", pending > 0 ? "text-amber-400" : "")}>{q.isLoading ? <Spinner /> : pending}</div>
          <div className="text-xs text-muted-foreground">scenario{pending === 1 ? "" : "s"} awaiting review</div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Button asChild size="sm" variant={pending > 0 ? "default" : "outline"}>
            <Link href="/instructor/reviews">Review queue</Link>
          </Button>
          <Link href="/instructor" className="text-xs text-muted-foreground hover:text-primary">
            Instructor dashboard →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

type OverviewReadiness = { readiness: { readyPercent: number; readyCount?: number; totalPersonnel?: number } };

/** Compact command hub: overall readiness with a link to the command area. */
export function CommandPanel() {
  const q = useQuery<OverviewReadiness>({ queryKey: keys.analytics.overview() });
  const pct = q.data ? Math.round(q.data.readiness.readyPercent) : null;
  const tone = pct === null ? "" : pct < THRESHOLDS.READINESS_CRITICAL_PERCENT ? "text-red-400" : pct < THRESHOLDS.READINESS_TARGET_PERCENT ? "text-amber-400" : "text-emerald-400";
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-4 w-4 text-primary" aria-hidden /> Command
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <div>
          <div className={cn("text-3xl font-semibold tabular-nums", tone)}>{q.isLoading ? <Spinner /> : pct === null ? "—" : `${pct}%`}</div>
          <div className="text-xs text-muted-foreground">
            workforce ready · target {THRESHOLDS.READINESS_TARGET_PERCENT}%
            {q.data?.readiness.readyCount !== undefined && q.data.readiness.totalPersonnel !== undefined && (
              <> · {q.data.readiness.readyCount}/{q.data.readiness.totalPersonnel}</>
            )}
          </div>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/command">Readiness</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
