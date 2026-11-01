import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Pencil } from "lucide-react";
import { QUESTION_CATEGORY_LABELS, SQUADRON_LABELS, passMarkFor, type QuestionCategory } from "@shared/constants";
import type { Quiz } from "@shared/schema";
import { keys } from "@/lib/keys";
import { PageHeader, Section, StatCard, QueryState, EmptyState, ScoreBadge, formatDate, formatDateTime } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActiveBadge, personName } from "@/components/instructor/shared";
import type { QuizSubmissionRow } from "../types";

const TOOLTIP_STYLE = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };
const AXIS = "hsl(var(--muted-foreground))";
const BUCKETS = [
  { label: "0–49", min: 0, max: 49 },
  { label: "50–59", min: 50, max: 59 },
  { label: "60–69", min: 60, max: 69 },
  { label: "70–79", min: 70, max: 79 },
  { label: "80–89", min: 80, max: 89 },
  { label: "90–100", min: 90, max: 100 },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

function Insights({ quiz, submissions }: { quiz: Quiz; submissions: QuizSubmissionRow[] }) {
  const passMark = passMarkFor(quiz);

  const stats = useMemo(() => {
    const n = submissions.length;
    const passed = submissions.filter((s) => s.passed).length;
    const avg = n ? Math.round(submissions.reduce((s, x) => s + x.score, 0) / n) : null;
    const timed = submissions.filter((s): s is QuizSubmissionRow & { timeSpentSeconds: number } => s.timeSpentSeconds !== null);
    const avgTime = timed.length ? timed.reduce((s, x) => s + x.timeSpentSeconds, 0) / timed.length : null;
    return { n, passRate: n ? Math.round((passed / n) * 100) : null, avg, avgTime };
  }, [submissions]);

  const distribution = useMemo(
    () =>
      BUCKETS.map((b) => ({
        label: b.label,
        count: submissions.filter((s) => s.score >= b.min && s.score <= b.max).length,
        // Bucket counts as passing when its floor meets the pass mark.
        passing: b.min >= passMark,
      })),
    [submissions, passMark],
  );

  return (
    <>
      <Card className="mb-6 border-border/60 bg-card/60">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
          <ActiveBadge active={quiz.isActive} />
          <span>
            <span className="text-muted-foreground">Questions</span> {quiz.questionCount}
          </span>
          <span>
            <span className="text-muted-foreground">Pass mark</span> {passMark}%
          </span>
          <span>
            <span className="text-muted-foreground">Time limit</span> {quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : "None"}
          </span>
          {quiz.expiresAt && (
            <span>
              <span className="text-muted-foreground">Expires</span> {formatDate(quiz.expiresAt)}
            </span>
          )}
          <div className="flex flex-wrap gap-1">
            {quiz.categories.map((c) => (
              <Badge key={c} variant="outline" className="font-normal">
                {QUESTION_CATEGORY_LABELS[c as QuestionCategory] ?? c}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attempts" value={stats.n} />
        <StatCard label="Pass rate" value={stats.passRate === null ? "—" : `${stats.passRate}%`} tone={stats.passRate === null ? "default" : stats.passRate >= 70 ? "good" : stats.passRate < 50 ? "bad" : "warn"} />
        <StatCard label="Average score" value={stats.avg === null ? "—" : `${stats.avg}%`} tone={stats.avg === null ? "default" : stats.avg >= passMark ? "good" : "bad"} hint={`Pass mark ${passMark}%`} />
        <StatCard label="Average time" value={stats.avgTime === null ? "—" : formatDuration(stats.avgTime)} />
      </div>

      {submissions.length === 0 ? (
        <EmptyState title="No attempts yet" description="Results will appear here once students sit this quiz." />
      ) : (
        <>
          <Section title="Score distribution">
            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-4">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" stroke={AXIS} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} stroke={AXIS} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} formatter={(v: number) => [v, "Submissions"]} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {distribution.map((d) => (
                          <Cell key={d.label} fill={d.passing ? "hsl(var(--chart-3))" : "hsl(var(--chart-1))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Green buckets sit at or above the pass mark.</p>
              </CardContent>
            </Card>
          </Section>

          <Section title="Submissions">
            <Card className="border-border/60 bg-card/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden md:table-cell">Squadron</TableHead>
                    <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                    <TableHead className="hidden sm:table-cell">Correct</TableHead>
                    <TableHead className="hidden lg:table-cell">Time</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.user ? (
                          <Link href={`/instructor/students/${s.user.id}`} className="hover:text-primary">
                            {personName(s.user)}
                          </Link>
                        ) : (
                          "Unknown"
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{SQUADRON_LABELS[s.squadron]}</TableCell>
                      <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">{formatDateTime(s.submittedAt)}</TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">
                        {s.correctCount} / {s.totalQuestions}
                      </TableCell>
                      <TableCell className="hidden tabular-nums lg:table-cell">{s.timeSpentSeconds === null ? "—" : formatDuration(s.timeSpentSeconds)}</TableCell>
                      <TableCell>
                        <ScoreBadge score={s.score} passed={s.passed} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </Section>
        </>
      )}
    </>
  );
}

export default function QuizInsights() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = Number(idParam);
  const quiz = useQuery<Quiz>({ queryKey: keys.quizzes.one(id), enabled: Number.isFinite(id) });
  const submissions = useQuery<QuizSubmissionRow[]>({ queryKey: keys.quizzes.submissions(id), enabled: Number.isFinite(id) });

  return (
    <>
      <PageHeader
        backHref="/instructor/quizzes"
        eyebrow="Quiz insights"
        title={quiz.data?.title ?? "Quiz"}
        description={quiz.data?.description || undefined}
        actions={
          <Button asChild variant="outline">
            <Link href={`/instructor/quizzes/${id}/edit`}>
              <Pencil className="h-4 w-4" /> Edit quiz
            </Link>
          </Button>
        }
      />
      <QueryState query={quiz}>{(q) => <QueryState query={submissions}>{(subs) => <Insights quiz={q} submissions={subs} />}</QueryState>}</QueryState>
    </>
  );
}
