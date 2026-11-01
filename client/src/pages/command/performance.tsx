import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SQUADRON_LABELS, THRESHOLDS, type FlyingSquadron } from "@shared/constants";
import { keys } from "@/lib/keys";
import { PageHeader, Section, QueryState, EmptyState } from "@/components/common";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHART, ChartCard, SquadronTabs, axisProps, monthLabel, tooltipStyle } from "@/components/command/charts";
import {
  AtRiskList,
  CertificationReadyList,
  InstructorWorkloadTable,
  ModuleCompletionTable,
  QuestionDifficultyPanel,
} from "@/components/command/PerformanceTables";
import type { ScoreDistribution, SquadronPerformance, TrendPoint } from "./types";

const TREND_MONTHS = [6, 12] as const;
type TrendMonths = (typeof TREND_MONTHS)[number];

export default function CommandPerformance() {
  const [squadron, setSquadron] = useState<FlyingSquadron | undefined>(undefined);
  const [months, setMonths] = useState<TrendMonths>(6);

  const performance = useQuery<SquadronPerformance[]>({ queryKey: keys.analytics.squadronPerformance });
  const trend = useQuery<TrendPoint[]>({ queryKey: keys.analytics.performanceTrend({ squadron, months }) });
  const distribution = useQuery<ScoreDistribution>({ queryKey: keys.analytics.scoreDistribution({ squadron }) });

  return (
    <div>
      <PageHeader
        eyebrow="Command"
        title="Squadron performance"
        description={squadron ? `Assessment results for ${SQUADRON_LABELS[squadron]}.` : "Assessment results across quizzes, scenarios and training modules."}
        actions={<SquadronTabs value={squadron} onChange={setSquadron} />}
      />

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Squadron comparison"
          reading={`Pass rate and average score per squadron over the last 6 months; the dashed line is the ${THRESHOLDS.DEFAULT_PASS_MARK}% default pass mark.`}
        >
          <QueryState query={performance} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No graded work yet" />}>
            {(rows) => (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="squadron" {...axisProps} />
                  <YAxis domain={[0, 100]} unit="%" {...axisProps} />
                  <Tooltip {...tooltipStyle} formatter={(v) => `${Number(v)}%`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine y={THRESHOLDS.DEFAULT_PASS_MARK} stroke={CHART.axis} strokeDasharray="4 4" />
                  <Bar dataKey="passRate" name="Pass rate" fill={CHART.c1} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="averageScore" name="Average score" fill={CHART.c2} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </QueryState>
        </ChartCard>

        <ChartCard
          title="Performance trend"
          reading={`Monthly average score and pass rate for ${squadron ?? "all squadrons"}.`}
          actions={
            <Tabs value={String(months)} onValueChange={(v) => setMonths(Number(v) as TrendMonths)}>
              <TabsList className="h-8" aria-label="Trend window">
                {TREND_MONTHS.map((m) => (
                  <TabsTrigger key={m} value={String(m)} className="h-6 px-2 text-xs">
                    {m}m
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          }
        >
          <QueryState query={trend} isEmpty={(d) => d.every((p) => p.submissions === 0)} empty={<EmptyState title="No graded work in this window" />}>
            {(rows) => (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows.map((r) => ({ ...r, label: monthLabel(r.month) }))} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis domain={[0, 100]} unit="%" {...axisProps} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v, name, item) => {
                      const subs = (item.payload as TrendPoint | undefined)?.submissions ?? 0;
                      return [`${Number(v)}%${name === "Average score" ? ` (${subs} graded)` : ""}`, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="averageScore" name="Average score" stroke={CHART.c1} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="passRate" name="Pass rate" stroke={CHART.c3} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </QueryState>
        </ChartCard>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Score distribution" reading="How graded results from the last 180 days fall into score bands, split by assessment type.">
          <QueryState query={distribution} isEmpty={(d) => d.total === 0} empty={<EmptyState title="No graded work yet" />}>
            {(d) => (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.buckets} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis allowDecimals={false} {...axisProps} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="quiz" name="Quiz" stackId="t" fill={CHART.c1} isAnimationActive={false} />
                  <Bar dataKey="scenario" name="Scenario" stackId="t" fill={CHART.c2} isAnimationActive={false} />
                  <Bar dataKey="module" name="Module" stackId="t" fill={CHART.c4} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </QueryState>
        </ChartCard>

        <ChartCard title="Average by assessment type" reading="Quiz, scenario and module averages per squadron, showing where each unit is strongest.">
          <QueryState query={performance} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No graded work yet" />}>
            {(rows) => (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="squadron" {...axisProps} />
                  <YAxis domain={[0, 100]} unit="%" {...axisProps} />
                  <Tooltip {...tooltipStyle} formatter={(v) => `${Number(v)}%`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="quizAvg" name="Quiz" fill={CHART.c1} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="scenarioAvg" name="Scenario" fill={CHART.c2} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="moduleAvg" name="Module" fill={CHART.c4} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </QueryState>
        </ChartCard>
      </div>

      <Section>
        <ModuleCompletionTable squadron={squadron} />
      </Section>

      <Section>
        <QuestionDifficultyPanel />
      </Section>

      <Section>
        <div className="grid gap-4 lg:grid-cols-2">
          <CertificationReadyList squadron={squadron} />
          <AtRiskList squadron={squadron} />
        </div>
      </Section>

      <Section>
        <InstructorWorkloadTable />
      </Section>
    </div>
  );
}
