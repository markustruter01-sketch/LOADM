import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Award, AlertTriangle } from "lucide-react";
import { AIRCRAFT_LABELS, QUESTION_CATEGORY_LABELS, THRESHOLDS, passMarkFor, type FlyingSquadron } from "@shared/constants";
import { keys } from "@/lib/keys";
import { QueryState, EmptyState, ScoreBadge, relativeTime } from "@/components/common";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusPill, personName } from "@/components/command/charts";
import { cn } from "@/lib/utils";
import type { AtRiskStudent, CertificationReady, InstructorWorkload, ModuleCompletion, QuestionDifficultyResponse } from "@/pages/command/types";

const HARDEST_LIMIT = 15;

function Panel({ title, reading, children, className }: { title: string; reading: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("border-border/60 bg-card/60", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs">{reading}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  );
}

function rateTone(rate: number): "good" | "warn" | "bad" {
  if (rate >= THRESHOLDS.CERTIFICATION_READY_SCORE) return "good";
  if (rate >= THRESHOLDS.AT_RISK_AVERAGE_SCORE) return "warn";
  return "bad";
}

export function ModuleCompletionTable({ squadron }: { squadron: FlyingSquadron | undefined }) {
  const q = useQuery<ModuleCompletion[]>({ queryKey: keys.analytics.moduleCompletion({ squadron }) });
  return (
    <Panel title="Module completion" reading="Share of aircrew who have passed each training module, with attempts and average score.">
      <QueryState query={q} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No active modules" />}>
        {(rows) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead className="hidden sm:table-cell">Aircraft</TableHead>
                <TableHead className="text-right">Attempts</TableHead>
                <TableHead className="text-right">Passes</TableHead>
                <TableHead className="text-right">Completion</TableHead>
                <TableHead className="text-right">Avg score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.module.id}>
                  <TableCell>
                    <div className="font-medium">{r.module.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.module.difficulty} · pass mark {passMarkFor(r.module)}%
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{r.module.aircraft ? AIRCRAFT_LABELS[r.module.aircraft] : "General"}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.attempts}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.passes}</TableCell>
                  <TableCell className="text-right">
                    <StatusPill tone={r.attempts === 0 ? "muted" : rateTone(r.completionRate)}>{r.completionRate}%</StatusPill>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.attempts === 0 ? "—" : `${r.averageScore}%`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </QueryState>
    </Panel>
  );
}

export function QuestionDifficultyPanel() {
  const q = useQuery<QuestionDifficultyResponse>({ queryKey: keys.analytics.questionDifficulty });
  return (
    <Panel title="Hardest questions" reading={`The ${HARDEST_LIMIT} question-bank items with the lowest correct rate across quiz sittings, plus the weakest categories.`}>
      <QueryState query={q} isEmpty={(d) => d.questions.length === 0} empty={<EmptyState title="No quiz sittings yet" />}>
        {(d) => (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead className="text-right">Attempts</TableHead>
                    <TableHead className="text-right">Correct</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.questions.slice(0, HARDEST_LIMIT).map((r) => (
                    <TableRow key={r.questionId}>
                      <TableCell>
                        <div className="line-clamp-2 text-sm">{r.questionText}</div>
                        <div className="text-xs text-muted-foreground">{r.difficulty}</div>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{QUESTION_CATEGORY_LABELS[r.category]}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.attempts}</TableCell>
                      <TableCell className="text-right">
                        <StatusPill tone={r.correctRate < 40 ? "bad" : r.correctRate < THRESHOLDS.AT_RISK_AVERAGE_SCORE ? "warn" : "good"}>{r.correctRate}%</StatusPill>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">By category</div>
              <ul className="space-y-2">
                {d.categories.map((c) => (
                  <li key={c.category} className="rounded-md border border-border/60 p-2">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{c.label}</span>
                      <StatusPill tone={rateTone(c.correctRate)}>{c.correctRate}%</StatusPill>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${c.correctRate}%` }} />
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {c.questions} questions · {c.attempts} attempts
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </QueryState>
    </Panel>
  );
}

export function CertificationReadyList({ squadron }: { squadron: FlyingSquadron | undefined }) {
  const q = useQuery<CertificationReady[]>({ queryKey: keys.analytics.certificationReadiness({ squadron }) });
  return (
    <Panel
      title="Certification ready"
      reading={`Aircrew averaging ${THRESHOLDS.CERTIFICATION_READY_SCORE}% or better over the last 90 days with no expired qualification.`}
    >
      <QueryState
        query={q}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={<Award className="h-8 w-8" />} title="Nobody is certification-ready yet" description="Averages are below the threshold or a qualification has lapsed." />}
      >
        {(rows) => (
          <ul className="divide-y divide-border/60">
            {rows.map((r) => (
              <li key={r.user.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <Link href={`/instructor/students/${r.user.id}`} className="truncate text-sm font-medium hover:text-primary">
                    {personName(r.user)}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {r.user.squadron} · {r.submissions} graded · {r.passRate}% pass
                    {r.qualifications.expiring > 0 && <span className="text-amber-400"> · {r.qualifications.expiring} expiring</span>}
                  </div>
                </div>
                <ScoreBadge score={r.averageScore} passed />
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </Panel>
  );
}

const FLAG_LABEL: Record<AtRiskStudent["flags"][number], string> = {
  low_average: "Low average",
  inactive: "Inactive",
  consecutive_fails: "Consecutive fails",
};

export function AtRiskList({ squadron }: { squadron: FlyingSquadron | undefined }) {
  const q = useQuery<AtRiskStudent[]>({ queryKey: keys.analytics.atRisk({ squadron }) });
  return (
    <Panel
      title="At risk"
      reading={`Average under ${THRESHOLDS.AT_RISK_AVERAGE_SCORE}%, no activity for ${THRESHOLDS.INACTIVE_AFTER_WEEKS} weeks, or two or more fails in a row.`}
    >
      <QueryState query={q} isEmpty={(d) => d.length === 0} empty={<EmptyState icon={<AlertTriangle className="h-8 w-8" />} title="Nobody is flagged" description="All aircrew are active and above the at-risk average." />}>
        {(rows) => (
          <ul className="divide-y divide-border/60">
            {rows.map((r) => (
              <li key={r.user.id} className="py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/instructor/students/${r.user.id}`} className="truncate text-sm font-medium hover:text-primary">
                      {personName(r.user)}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {r.user.squadron} · {r.gradedCount} graded · last active {relativeTime(r.lastActivityAt)}
                    </div>
                  </div>
                  <ScoreBadge score={r.averageScore} passed={r.averageScore === null ? null : r.averageScore >= THRESHOLDS.AT_RISK_AVERAGE_SCORE} />
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.flags.map((f) => (
                    <Badge key={f} variant="outline" className="border-red-400/40 text-red-400">
                      {FLAG_LABEL[f]}
                    </Badge>
                  ))}
                </div>
                {r.reasons.length > 0 && <div className="mt-1 text-xs text-muted-foreground">{r.reasons.join(" · ")}</div>}
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </Panel>
  );
}

export function InstructorWorkloadTable() {
  const q = useQuery<InstructorWorkload[]>({ queryKey: keys.analytics.instructorWorkload });
  return (
    <Panel title="Instructor workload" reading="Reviews completed in the last 30 days, the queue each instructor can see, and content they have authored.">
      <QueryState query={q} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No instructors" />}>
        {(rows) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instructor</TableHead>
                <TableHead className="text-right">Reviews (30d)</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Reviews (all)</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Authored</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.user.id}>
                  <TableCell>
                    <div className="font-medium">{personName(r.user)}</div>
                    <div className="text-xs text-muted-foreground">{r.user.squadron}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.reviewsLast30d}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{r.reviewsTotal}</TableCell>
                  <TableCell className="text-right">
                    <StatusPill tone={r.pendingInSquadron > 10 ? "warn" : r.pendingInSquadron > 0 ? "muted" : "good"}>{r.pendingInSquadron}</StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="tabular-nums">{r.contentAuthored.total}</span>
                    <div className="text-[11px] text-muted-foreground">
                      {r.contentAuthored.quizzes}q · {r.contentAuthored.scenarios}s · {r.contentAuthored.modules}m · {r.contentAuthored.questions} items
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </QueryState>
    </Panel>
  );
}
