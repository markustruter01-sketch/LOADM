import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { SQUADRON_LABELS, THRESHOLDS, type FlyingSquadron } from "@shared/constants";
import { keys } from "@/lib/keys";
import { PageHeader, Section, StatCard, QueryState, EmptyState, formatDate } from "@/components/common";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CHART, ChartCard, SquadronTabs, StatusPill, axisProps, monthLabel, personName, tooltipStyle } from "@/components/command/charts";
import { Panel } from "@/components/command/PerformanceTables";
import type { CurrencyStatus, ExpiringQualification, ForecastMonth, QualItem } from "./types";

const FORECAST_MONTHS = [6, 12] as const;
type ForecastMonths = (typeof FORECAST_MONTHS)[number];
const EXPIRING_DAYS = [30, 60, 90, 180] as const;

function daysText(d: number | null): string {
  if (d === null) return "No expiry";
  if (d < 0) return `${Math.abs(d)} d overdue`;
  if (d === 0) return "Today";
  return `${d} d left`;
}

/** Tooltip listing the qualifications that lapse in the hovered month. */
function ForecastTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload as ForecastMonth;
  return (
    <div style={tooltipStyle.contentStyle} className="max-w-xs px-3 py-2">
      <div style={tooltipStyle.labelStyle}>{monthLabel(row.month)}</div>
      <div className="font-medium">
        {row.expiring} expiring · {row.personnel} people
      </div>
      {row.names.length > 0 && (
        <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
          {row.names.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QualList({ items, tone }: { items: QualItem[]; tone: "warn" | "bad" }) {
  if (items.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((q) => (
        <StatusPill key={q.id} tone={tone}>
          {q.name} · {daysText(q.daysRemaining)}
        </StatusPill>
      ))}
    </div>
  );
}

export default function CommandCurrency() {
  const [squadron, setSquadron] = useState<FlyingSquadron | undefined>(undefined);
  const [months, setMonths] = useState<ForecastMonths>(6);
  const [days, setDays] = useState<number>(THRESHOLDS.QUALIFICATION_EXPIRY_WARNING_DAYS);

  const currency = useQuery<CurrencyStatus>({ queryKey: keys.analytics.currency({ squadron }) });
  const forecast = useQuery<ForecastMonth[]>({ queryKey: keys.analytics.forecast({ squadron, months }) });
  const expiring = useQuery<ExpiringQualification[]>({ queryKey: keys.personnel.expiring({ squadron, days }) });

  return (
    <div>
      <PageHeader
        eyebrow="Command"
        title="Currency & forecast"
        description={`Qualification currency for ${squadron ? SQUADRON_LABELS[squadron] : "all flying squadrons"}. Expiring means within ${THRESHOLDS.QUALIFICATION_EXPIRY_WARNING_DAYS} days.`}
        actions={<SquadronTabs value={squadron} onChange={setSquadron} />}
      />

      <Section>
        <QueryState query={currency} rows={1}>
          {(c) => {
            const total = c.current + c.expiring + c.expired;
            const share = (n: number) => (total ? `${Math.round((n / total) * 100)}% of ${total}` : "No qualifications held");
            return (
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Current" value={c.current} hint={share(c.current)} tone="good" icon={<CheckCircle2 className="h-4 w-4" aria-hidden />} />
                <StatCard label="Expiring" value={c.expiring} hint={share(c.expiring)} tone={c.expiring > 0 ? "warn" : "default"} icon={<Clock className="h-4 w-4" aria-hidden />} />
                <StatCard label="Expired" value={c.expired} hint={share(c.expired)} tone={c.expired > 0 ? "bad" : "good"} icon={<XCircle className="h-4 w-4" aria-hidden />} />
              </div>
            );
          }}
        </QueryState>
      </Section>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Currency by qualification" reading="Each qualification type split into current, expiring and expired holdings; worst first." height={340}>
          <QueryState query={currency} isEmpty={(d) => d.byQualification.length === 0} empty={<EmptyState title="No qualifications recorded" />}>
            {(c) => (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={c.byQualification} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} {...axisProps} />
                  <YAxis type="category" dataKey="name" width={150} {...axisProps} interval={0} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="current" name="Current" stackId="q" fill={CHART.good} isAnimationActive={false} />
                  <Bar dataKey="expiring" name="Expiring" stackId="q" fill={CHART.warn} isAnimationActive={false} />
                  <Bar dataKey="expired" name="Expired" stackId="q" fill={CHART.bad} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </QueryState>
        </ChartCard>

        <ChartCard
          title="Expiry forecast"
          reading={`Qualifications that lapse in each of the next ${months} months; hover to see which.`}
          height={340}
          actions={
            <Tabs value={String(months)} onValueChange={(v) => setMonths(Number(v) as ForecastMonths)}>
              <TabsList className="h-8" aria-label="Forecast window">
                {FORECAST_MONTHS.map((m) => (
                  <TabsTrigger key={m} value={String(m)} className="h-6 px-2 text-xs">
                    {m}m
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          }
        >
          <QueryState query={forecast} isEmpty={(d) => d.length === 0}>
            {(rows) => (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows.map((r) => ({ ...r, label: monthLabel(r.month) }))} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis allowDecimals={false} {...axisProps} />
                  <Tooltip content={<ForecastTooltip />} cursor={tooltipStyle.cursor} />
                  <Bar dataKey="expiring" name="Expiring" fill={CHART.warn} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </QueryState>
        </ChartCard>
      </div>

      <Section>
        <Panel title="Personnel with lapsing currency" reading="Aircrew holding an expired or expiring qualification, most expired first.">
          <QueryState query={currency} isEmpty={(d) => d.personnel.length === 0} empty={<EmptyState title="Everyone is current" />}>
            {(c) => (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead>Expired</TableHead>
                    <TableHead>Expiring</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Current</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {c.personnel.map((p) => (
                    <TableRow key={p.user.id}>
                      <TableCell>
                        <Link href={`/instructor/students/${p.user.id}`} className="font-medium hover:text-primary">
                          {personName(p.user)}
                        </Link>
                        <div className="text-xs text-muted-foreground">{p.user.squadron}</div>
                      </TableCell>
                      <TableCell>
                        <QualList items={p.expired} tone="bad" />
                      </TableCell>
                      <TableCell>
                        <QualList items={p.expiring} tone="warn" />
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">{p.current}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </QueryState>
        </Panel>
      </Section>

      <Section>
        <Panel
          title="Expiring list"
          reading={`Every qualification that has expired or will expire within ${days} days, soonest first.`}
          actions={
            <div className="flex items-center gap-2">
              <Label htmlFor="expiring-days" className="text-xs text-muted-foreground">
                Window
              </Label>
              <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                <SelectTrigger id="expiring-days" className="h-8 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRING_DAYS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} days
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        >
          <QueryState query={expiring} isEmpty={(d) => d.length === 0} empty={<EmptyState title="Nothing expiring in this window" />}>
            {(rows) => (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Person</TableHead>
                    <TableHead className="hidden sm:table-cell">Expiry</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.qualification.id}>
                      <TableCell className="font-medium">{r.qualification.name}</TableCell>
                      <TableCell>
                        <Link href={`/instructor/students/${r.user.id}`} className="hover:text-primary">
                          {personName(r.user)}
                        </Link>
                        <div className="text-xs text-muted-foreground">{r.user.squadron}</div>
                      </TableCell>
                      <TableCell className="hidden text-sm sm:table-cell">{formatDate(r.qualification.expiryDate)}</TableCell>
                      <TableCell className="text-right">
                        <StatusPill tone={r.status === "expired" ? "bad" : r.status === "expiring" ? "warn" : "muted"}>{daysText(r.daysRemaining)}</StatusPill>
                      </TableCell>
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
