import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Info, ShieldCheck } from "lucide-react";
import {
  SAFETY_RECORD_TYPES,
  SAFETY_SEVERITIES,
  SAFETY_STATUSES,
  SQUADRON_LABELS,
  THRESHOLDS,
  type FlyingSquadron,
} from "@shared/constants";
import { keys } from "@/lib/keys";
import { PageHeader, Section, StatCard, QueryState, EmptyState, formatDate } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CHART, ChartCard, ScoreRing, SquadronTabs, StatusPill, axisProps, monthLabel, personName, tooltipStyle } from "@/components/command/charts";
import { Panel } from "@/components/command/PerformanceTables";
import type { SafetyRecordWithPeople, SafetySummary } from "./types";

const TYPE_LABELS: Record<(typeof SAFETY_RECORD_TYPES)[number], string> = {
  incident: "Incident",
  observation: "Observation",
  commendation: "Commendation",
  training_failure: "Training failure",
};
const TYPE_COLORS = [CHART.c5, CHART.c2, CHART.c3, CHART.c4];
const SEVERITY_COLORS: Record<(typeof SAFETY_SEVERITIES)[number], string> = { minor: CHART.c2, moderate: CHART.warn, major: CHART.bad };
const STATUS_COLORS: Record<(typeof SAFETY_STATUSES)[number], string> = { open: CHART.bad, reviewed: CHART.warn, closed: CHART.good };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function scoreColor(score: number): string {
  if (score >= THRESHOLDS.SAFETY_SCORE_MIN) return CHART.good;
  if (score >= THRESHOLDS.SAFETY_SCORE_MIN - 20) return CHART.warn;
  return CHART.bad;
}

function Donut({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  const shown = data.filter((d) => d.value > 0);
  if (shown.length === 0) return <EmptyState title="No records in window" />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={shown} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="none" isAnimationActive={false}>
          {shown.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function CommandSafety() {
  const [squadron, setSquadron] = useState<FlyingSquadron | undefined>(undefined);
  const summary = useQuery<SafetySummary>({ queryKey: keys.analytics.safety({ squadron }) });
  const open = useQuery<SafetyRecordWithPeople[]>({ queryKey: keys.personnel.safety({ squadron, status: "open" }) });

  return (
    <div>
      <PageHeader
        eyebrow="Command"
        title="Safety"
        description={`Safety records and compliance for ${squadron ? SQUADRON_LABELS[squadron] : "all flying squadrons"} over the last 12 months.`}
        actions={
          <>
            <SquadronTabs value={squadron} onChange={setSquadron} />
            <Button asChild variant="outline">
              <Link href="/instructor/safety">Manage records</Link>
            </Button>
          </>
        }
      />

      <QueryState query={summary} rows={3}>
        {(s) => (
          <>
            <div className="mb-8 grid gap-4 lg:grid-cols-4">
              <Card className="border-border/60 bg-card/60 lg:row-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    Compliance score
                    <UiTooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="How the compliance score is calculated" className="text-muted-foreground hover:text-foreground">
                          <Info className="h-4 w-4" aria-hidden />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        100 − (open incidents × 5 + major × 10 + moderate × 5 + minor × 2), clamped to 0–100. Severity counts cover every record in the window,
                        whatever its status.
                      </TooltipContent>
                    </UiTooltip>
                  </CardTitle>
                  <CardDescription className="text-xs">Healthy at {THRESHOLDS.SAFETY_SCORE_MIN} or above.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3 pt-2">
                  <ScoreRing value={s.complianceScore} color={scoreColor(s.complianceScore)} size={150} stroke={12} label={s.complianceScore} sublabel="of 100" />
                  <div className="text-center text-xs text-muted-foreground">
                    {s.openIncidents} open incident{s.openIncidents === 1 ? "" : "s"} · {s.bySeverity.major} major · {s.bySeverity.moderate} moderate ·{" "}
                    {s.bySeverity.minor} minor
                  </div>
                </CardContent>
              </Card>
              <StatCard label="Records" value={s.total} hint={`${formatDate(s.window.from)} – ${formatDate(s.window.to)}`} />
              <StatCard label="Open" value={s.open} tone={s.open > 0 ? "warn" : "good"} hint="Awaiting review or closure" />
              <StatCard label="Open incidents" value={s.openIncidents} tone={s.openIncidents > 0 ? "bad" : "good"} hint="Each costs 5 compliance points" />
              <ChartCard className="lg:col-span-3" title="Records by month" reading="All safety records per month, with incidents shown alongside the total." height={220}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={s.byMonth.map((m) => ({ ...m, other: m.total - m.incidents, label: monthLabel(m.month) }))} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" {...axisProps} />
                    <YAxis allowDecimals={false} {...axisProps} />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="incidents" name="Incidents" stackId="m" fill={CHART.bad} isAnimationActive={false} />
                    <Bar dataKey="other" name="Other records" stackId="m" fill={CHART.c2} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <ChartCard title="By type" reading="Mix of incidents, observations, commendations and training failures." height={240}>
                <Donut data={SAFETY_RECORD_TYPES.map((t, i) => ({ name: TYPE_LABELS[t], value: s.byType[t], color: TYPE_COLORS[i % TYPE_COLORS.length] }))} />
              </ChartCard>
              <ChartCard title="By severity" reading="Records that carry a severity rating; major weighs heaviest on compliance." height={240}>
                <Donut data={SAFETY_SEVERITIES.map((v) => ({ name: cap(v), value: s.bySeverity[v], color: SEVERITY_COLORS[v] }))} />
              </ChartCard>
              <ChartCard title="By status" reading="How far records have progressed from open to closed." height={240}>
                <Donut data={SAFETY_STATUSES.map((v) => ({ name: cap(v), value: s.byStatus[v], color: STATUS_COLORS[v] }))} />
              </ChartCard>
            </div>
          </>
        )}
      </QueryState>

      <Section>
        <Panel title="Open records" reading="Every safety record still open, newest first.">
          <QueryState
            query={open}
            isEmpty={(d) => d.length === 0}
            empty={<EmptyState icon={<ShieldCheck className="h-8 w-8" />} title="No open records" description="Every safety record has been reviewed or closed." />}
          >
            {(rows) => (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Person</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="hidden lg:table-cell">Reported by</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDate(r.date)}</TableCell>
                      <TableCell className="text-sm">{TYPE_LABELS[r.recordType]}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{personName(r.user)}</div>
                        <div className="text-xs text-muted-foreground">{r.squadron}</div>
                      </TableCell>
                      <TableCell className="hidden max-w-md md:table-cell">
                        <div className="line-clamp-2 text-sm text-muted-foreground">{r.description}</div>
                      </TableCell>
                      <TableCell>
                        {r.severity ? (
                          <StatusPill tone={r.severity === "major" ? "bad" : r.severity === "moderate" ? "warn" : "muted"}>{cap(r.severity)}</StatusPill>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{r.reportedBy ? personName(r.reportedBy) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </QueryState>
        </Panel>
      </Section>
    </div>
  );
}
