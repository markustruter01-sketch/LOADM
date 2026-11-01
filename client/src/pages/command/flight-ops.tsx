import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock, Moon, Sun, PlaneTakeoff, Package, Users } from "lucide-react";
import { AIRCRAFT_LABELS, SQUADRON_LABELS, type FlyingSquadron } from "@shared/constants";
import { keys } from "@/lib/keys";
import { PageHeader, Section, StatCard, QueryState, EmptyState } from "@/components/common";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CHART, ChartCard, SquadronTabs, axisProps, monthLabel, personName, tooltipStyle } from "@/components/command/charts";
import { Panel } from "@/components/command/PerformanceTables";
import type { FlightHours } from "./types";

const nf = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 1 });

export default function CommandFlightOps() {
  const [squadron, setSquadron] = useState<FlyingSquadron | undefined>(undefined);
  const q = useQuery<FlightHours>({ queryKey: keys.analytics.flightHours({ squadron }) });

  return (
    <div>
      <PageHeader
        eyebrow="Command"
        title="Flight operations"
        description={`Logged flying for ${squadron ? SQUADRON_LABELS[squadron] : "all flying squadrons"}, from aircrew flight records.`}
        actions={<SquadronTabs value={squadron} onChange={setSquadron} />}
      />

      <QueryState query={q} rows={4}>
        {(f) => {
          const nightShare = f.totalHours ? Math.round((f.nightHours / f.totalHours) * 100) : 0;
          return (
            <>
              <Section>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                  <StatCard label="Total hours" value={nf.format(f.totalHours)} icon={<Clock className="h-4 w-4" aria-hidden />} />
                  <StatCard label="Day hours" value={nf.format(f.dayHours)} icon={<Sun className="h-4 w-4" aria-hidden />} />
                  <StatCard label="Night hours" value={nf.format(f.nightHours)} hint={`${nightShare}% of total`} icon={<Moon className="h-4 w-4" aria-hidden />} />
                  <StatCard label="Sorties" value={f.sorties} hint={f.sorties ? `${nf.format(f.totalHours / f.sorties)} h average` : undefined} icon={<PlaneTakeoff className="h-4 w-4" aria-hidden />} />
                  <StatCard label="Cargo" value={`${nf.format(f.cargoKg / 1000)} t`} icon={<Package className="h-4 w-4" aria-hidden />} />
                  <StatCard label="Passengers" value={f.passengers.toLocaleString("en-AU")} icon={<Users className="h-4 w-4" aria-hidden />} />
                </div>
              </Section>

              <div className="mb-8 grid gap-4 lg:grid-cols-5">
                <ChartCard className="lg:col-span-3" title="Hours by month" reading="Flying hours logged in each of the last 12 months, with sortie counts in the tooltip.">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={f.byMonth.map((m) => ({ ...m, label: monthLabel(m.month) }))} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="hoursFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={CHART.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" {...axisProps} />
                      <YAxis {...axisProps} />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="hours" name="Hours" stroke={CHART.primary} fill="url(#hoursFill)" strokeWidth={2} isAnimationActive={false} />
                      <Area type="monotone" dataKey="sorties" name="Sorties" stroke={CHART.c2} fill="none" strokeWidth={1.5} strokeDasharray="4 3" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard className="lg:col-span-2" title="Hours by aircraft" reading="Where the flying hours went, by airframe type.">
                  {f.byAircraft.length === 0 ? (
                    <EmptyState title="No flights logged" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={f.byAircraft.map((a) => ({ ...a, label: AIRCRAFT_LABELS[a.aircraft] }))} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" {...axisProps} />
                        <YAxis type="category" dataKey="label" width={130} {...axisProps} />
                        <Tooltip {...tooltipStyle} />
                        <Bar dataKey="hours" name="Hours" fill={CHART.c1} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>

              <Section>
                <Panel title="Top personnel" reading="The five aircrew with the most logged hours.">
                  {f.topPersonnel.length === 0 ? (
                    <EmptyState title="No flights logged" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead>Person</TableHead>
                          <TableHead className="text-right">Hours</TableHead>
                          <TableHead className="text-right">Sorties</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {f.topPersonnel.map((p, i) => (
                          <TableRow key={p.user.id}>
                            <TableCell className="tabular-nums text-muted-foreground">{i + 1}</TableCell>
                            <TableCell>
                              <Link href={`/instructor/students/${p.user.id}`} className="font-medium hover:text-primary">
                                {personName(p.user)}
                              </Link>
                              <div className="text-xs text-muted-foreground">{p.user.squadron}</div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{nf.format(p.hours)}</TableCell>
                            <TableCell className="text-right tabular-nums">{p.sorties}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Panel>
              </Section>
            </>
          );
        }}
      </QueryState>
    </div>
  );
}
