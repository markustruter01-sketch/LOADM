import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Camera, ShieldAlert, Users, ClipboardCheck, Gauge as GaugeIcon, AlertTriangle } from "lucide-react";
import { FLYING_SQUADRONS, SQUADRON_LABELS, THRESHOLDS, type FlyingSquadron } from "@shared/constants";
import { keys } from "@/lib/keys";
import { post } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, Section, StatCard, QueryState, EmptyState, formatDate } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHART, ChartCard, Gauge, SquadronTabs, axisProps, readinessColor, readinessTone, tooltipStyle } from "@/components/command/charts";
import { RecommendationsBanner } from "@/components/command/RecommendationsBanner";
import { cn } from "@/lib/utils";
import type { CaptureSnapshotResponse, Overview, ReadinessFigures, ReadinessHistoryRow } from "./types";

const HISTORY_DAYS = [30, 90, 180] as const;
type HistoryDays = (typeof HISTORY_DAYS)[number];

export default function CommandReadiness() {
  const [squadron, setSquadron] = useState<FlyingSquadron | undefined>(undefined);
  const [days, setDays] = useState<HistoryDays>(90);
  const qc = useQueryClient();
  const { toast } = useToast();

  const overview = useQuery<Overview>({ queryKey: keys.analytics.overview({ squadron }) });
  const readiness = useQuery<ReadinessFigures[]>({ queryKey: keys.analytics.squadronReadiness });
  const history = useQuery<ReadinessHistoryRow[]>({ queryKey: keys.analytics.readinessHistory({ squadron: squadron ?? "ALL", days }) });

  const capture = useMutation({
    mutationFn: () => post<CaptureSnapshotResponse>("/api/analytics/capture-snapshot"),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: keys.analytics.all });
      toast({ title: "Snapshot captured", description: `${res.created} readiness snapshot${res.created === 1 ? "" : "s"} recorded for today.` });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Snapshot failed", description: e.message }),
  });

  return (
    <div>
      <PageHeader
        eyebrow="Command"
        title="Readiness"
        description={squadron ? `${SQUADRON_LABELS[squadron]} workforce readiness, currency and open items.` : "Workforce readiness across the flying squadrons."}
        actions={
          <>
            <SquadronTabs value={squadron} onChange={setSquadron} />
            <Button variant="outline" onClick={() => capture.mutate()} disabled={capture.isPending}>
              <Camera aria-hidden />
              {capture.isPending ? "Capturing…" : "Capture snapshot now"}
            </Button>
          </>
        }
      />

      <Section title="Recommendations" description="Rule-based checks against the shared thresholds.">
        <RecommendationsBanner squadron={squadron} />
      </Section>

      <Section title="At a glance">
        <QueryState query={overview} rows={2}>
          {(o) => (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard
                label="Readiness"
                value={`${Math.round(o.readiness.readyPercent)}%`}
                hint={`Target ${THRESHOLDS.READINESS_TARGET_PERCENT}% · critical below ${THRESHOLDS.READINESS_CRITICAL_PERCENT}%`}
                tone={readinessTone(o.readiness.readyPercent)}
                icon={<GaugeIcon className="h-4 w-4" aria-hidden />}
              />
              <StatCard
                label="Ready / total"
                value={`${o.readiness.readyCount} / ${o.readiness.totalPersonnel}`}
                hint={`${o.readiness.notReadyCount} not ready`}
                icon={<Users className="h-4 w-4" aria-hidden />}
              />
              <StatCard
                label="Personnel at risk"
                value={o.readiness.personnelAtRisk}
                hint="Expired quals, not flight-ready, or low recent average"
                tone={o.readiness.personnelAtRisk > 0 ? "warn" : "good"}
                icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
              />
              <StatCard
                label="Pending reviews"
                value={o.pendingReviews}
                hint="Scenario submissions awaiting an instructor"
                tone={o.pendingReviews > 10 ? "warn" : "default"}
                icon={<ClipboardCheck className="h-4 w-4" aria-hidden />}
              />
              <StatCard
                label="Open safety"
                value={o.safety.open}
                hint={`${o.safety.last90d} records in the last 90 days`}
                tone={o.safety.open > 0 ? "bad" : "good"}
                icon={<ShieldAlert className="h-4 w-4" aria-hidden />}
              />
            </div>
          )}
        </QueryState>
      </Section>

      <Section title="Squadron readiness" description="Share of aircrew who are flight-ready with no expired qualification. Tick marks the target.">
        <QueryState query={readiness} rows={1} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No readiness data" />}>
          {(figures) => (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FLYING_SQUADRONS.map((s) => {
                const f = figures.find((r) => r.squadron === s);
                const pct = f?.readyPercent ?? 0;
                const color = readinessColor(pct);
                return (
                  <Card
                    key={s}
                    className={cn("border-border/60 bg-card/60 transition-colors", squadron === s && "border-primary/60 ring-1 ring-primary/40")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-baseline justify-between">
                        <div className="text-sm font-semibold">{s}</div>
                        <div className="text-xs text-muted-foreground">{SQUADRON_LABELS[s]}</div>
                      </div>
                      <div className="mt-3">
                        <Gauge value={pct} color={color} target={THRESHOLDS.READINESS_TARGET_PERCENT} />
                      </div>
                      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <dt className="text-muted-foreground">Ready</dt>
                          <dd className="font-semibold tabular-nums">
                            {f?.readyCount ?? 0}/{f?.totalPersonnel ?? 0}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">At risk</dt>
                          <dd className={cn("font-semibold tabular-nums", (f?.personnelAtRisk ?? 0) > 0 && "text-amber-400")}>{f?.personnelAtRisk ?? 0}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Expired</dt>
                          <dd className={cn("font-semibold tabular-nums", (f?.expiredQuals ?? 0) > 0 && "text-red-400")}>{f?.expiredQuals ?? 0}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </QueryState>
      </Section>

      <div className="grid gap-4 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-3"
          title="Readiness history"
          reading={`Daily readiness snapshots for ${squadron ?? "all squadrons"}; the dashed line is the ${THRESHOLDS.READINESS_TARGET_PERCENT}% target.`}
          height={300}
          actions={
            <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v) as HistoryDays)}>
              <TabsList className="h-8" aria-label="History window">
                {HISTORY_DAYS.map((d) => (
                  <TabsTrigger key={d} value={String(d)} className="h-6 px-2 text-xs">
                    {d}d
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          }
        >
          <QueryState query={history} rows={2} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No snapshots yet" description="Capture a snapshot to start the history." />}>
            {(rows) => (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows.map((r) => ({ ...r, date: formatDate(r.snapshotDate, { day: "numeric", month: "short" }) }))} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" {...axisProps} minTickGap={24} />
                  <YAxis domain={[0, 100]} {...axisProps} unit="%" />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${Math.round(Number(v))}%`, "Ready"]} />
                  <ReferenceLine y={THRESHOLDS.READINESS_TARGET_PERCENT} stroke={CHART.good} strokeDasharray="4 4" label={{ value: "Target", fill: CHART.good, fontSize: 10, position: "insideTopRight" }} />
                  <ReferenceLine y={THRESHOLDS.READINESS_CRITICAL_PERCENT} stroke={CHART.bad} strokeDasharray="2 4" label={{ value: "Critical", fill: CHART.bad, fontSize: 10, position: "insideBottomRight" }} />
                  <Line type="monotone" dataKey="readyPercent" stroke={CHART.primary} strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </QueryState>
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title="Qualification status"
          reading="Current, expiring (within 90 days) and expired qualifications held by each squadron's aircrew."
          height={300}
        >
          <QueryState query={readiness} rows={2} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No qualification data" />}>
            {(figures) => (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={figures.filter((f) => f.squadron !== "ALL")} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="squadron" {...axisProps} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="currentQuals" name="Current" stackId="q" fill={CHART.good} isAnimationActive={false} />
                  <Bar dataKey="expiringQuals" name="Expiring" stackId="q" fill={CHART.warn} isAnimationActive={false} />
                  <Bar dataKey="expiredQuals" name="Expired" stackId="q" fill={CHART.bad} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </QueryState>
        </ChartCard>
      </div>
    </div>
  );
}
