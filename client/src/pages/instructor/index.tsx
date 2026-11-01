import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Database, FileQuestion, GraduationCap, Info, ListChecks, ShieldAlert, Users } from "lucide-react";
import { SQUADRON_LABELS } from "@shared/constants";
import { keys } from "@/lib/keys";
import { PageHeader, Section, StatCard, QueryState, EmptyState, relativeTime } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { personName } from "@/components/instructor/shared";
import { cn } from "@/lib/utils";
import { AT_RISK_LABELS, type CategoryCount, type Recommendation, type RosterEntry, type ScenarioSubmissionRow } from "./types";

const QUICK_LINKS = [
  { label: "Question bank", href: "/instructor/question-bank", icon: Database },
  { label: "Quizzes", href: "/instructor/quizzes", icon: FileQuestion },
  { label: "Scenarios", href: "/instructor/scenarios", icon: ClipboardCheck },
  { label: "Modules", href: "/instructor/modules", icon: GraduationCap },
  { label: "Checklists", href: "/instructor/checklists", icon: ListChecks },
  { label: "Safety records", href: "/instructor/safety", icon: ShieldAlert },
];

const SEVERITY_STYLE: Record<Recommendation["severity"], { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "text-sky-400" },
  warning: { icon: AlertTriangle, className: "text-amber-400" },
  critical: { icon: AlertTriangle, className: "text-red-400" },
};

export default function InstructorDashboard() {
  const pending = useQuery<ScenarioSubmissionRow[]>({ queryKey: keys.scenarios.submissions({ status: "submitted" }) });
  const roster = useQuery<RosterEntry[]>({ queryKey: keys.personnel.roster() });
  const categories = useQuery<CategoryCount[]>({ queryKey: keys.questionBank.categories });
  const recommendations = useQuery<Recommendation[]>({ queryKey: keys.analytics.recommendations() });

  const pendingCount = pending.data?.length;
  const studentCount = roster.data?.length;
  const atRisk = roster.data?.filter((r) => r.atRisk.length > 0) ?? [];
  const bankSize = categories.data?.reduce((sum, c) => sum + c.activeCount, 0);

  // Oldest first so the queue surfaces what has waited longest.
  const oldestPending = (pending.data ?? [])
    .slice()
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Instructor dashboard"
        description="What needs your attention: reviews waiting, students at risk and the health of your training content."
        actions={
          <Button asChild>
            <Link href="/instructor/reviews">Open review queue</Link>
          </Button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending reviews" value={pendingCount ?? "—"} tone={pendingCount ? "warn" : "default"} icon={<ClipboardCheck className="h-4 w-4" />} hint="Scenario submissions awaiting marking" />
        <StatCard label="Students" value={studentCount ?? "—"} icon={<Users className="h-4 w-4" />} hint="Aircrew on the readiness roster" />
        <StatCard label="At risk" value={roster.data ? atRisk.length : "—"} tone={atRisk.length ? "bad" : "good"} icon={<AlertTriangle className="h-4 w-4" />} hint="Students with one or more flags" />
        <StatCard label="Question bank" value={bankSize ?? "—"} icon={<Database className="h-4 w-4" />} hint="Active questions across all categories" />
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Section
            title="Review queue"
            description="Oldest submissions first."
            actions={
              <Button asChild variant="ghost" size="sm">
                <Link href="/instructor/reviews">View all</Link>
              </Button>
            }
          >
            <QueryState
              query={pending}
              isEmpty={(d) => d.length === 0}
              empty={<EmptyState title="Nothing to review" description="Every scenario submission has been marked." icon={<CheckCircle2 className="h-8 w-8 text-emerald-400" />} />}
            >
              {() => (
                <Card className="border-border/60 bg-card/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="hidden sm:table-cell">Scenario</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">
                          <span className="sr-only">Action</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {oldestPending.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div className="font-medium">{personName(s.user)}</div>
                            <div className="text-xs text-muted-foreground">{SQUADRON_LABELS[s.squadron]}</div>
                          </TableCell>
                          <TableCell className="hidden max-w-[16rem] truncate sm:table-cell">{s.scenarioTitle ?? "—"}</TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">{relativeTime(s.submittedAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button asChild size="sm">
                              <Link href={`/instructor/reviews/${s.id}`}>Review</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </QueryState>
          </Section>

          <Section
            title="At-risk students"
            description="Flags are computed from readiness, qualifications, scores and activity."
            actions={
              <Button asChild variant="ghost" size="sm">
                <Link href="/instructor/students">All students</Link>
              </Button>
            }
          >
            <QueryState
              query={roster}
              isEmpty={(d) => d.every((r) => r.atRisk.length === 0)}
              empty={<EmptyState title="No students at risk" description="Everyone on the roster is clear of flags." icon={<CheckCircle2 className="h-8 w-8 text-emerald-400" />} />}
            >
              {() => (
                <ul className="space-y-2">
                  {atRisk.slice(0, 8).map((r) => (
                    <li key={r.user.id}>
                      <Link
                        href={`/instructor/students/${r.user.id}`}
                        className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card/60 p-3 transition-colors hover:border-primary/50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">{personName(r.user)}</div>
                          <div className="text-xs text-muted-foreground">{SQUADRON_LABELS[r.user.squadron]}</div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {r.atRisk.map((f) => (
                            <Badge key={f} variant="outline" className="border-amber-500/40 text-amber-400">
                              {AT_RISK_LABELS[f]}
                            </Badge>
                          ))}
                        </div>
                      </Link>
                    </li>
                  ))}
                  {atRisk.length > 8 && <li className="text-xs text-muted-foreground">And {atRisk.length - 8} more on the students page.</li>}
                </ul>
              )}
            </QueryState>
          </Section>
        </div>

        <div className="lg:col-span-2">
          <Section title="Recommendations" description="Rule-based checks across readiness, reviews, currency, safety and content.">
            <QueryState
              query={recommendations}
              isEmpty={(d) => d.length === 0}
              empty={<EmptyState title="All clear" description="No rules are currently tripping." icon={<CheckCircle2 className="h-8 w-8 text-emerald-400" />} />}
            >
              {(items) => (
                <ul className="space-y-2">
                  {items.map((rec) => {
                    const style = SEVERITY_STYLE[rec.severity];
                    const Icon = style.icon;
                    return (
                      <li key={rec.id}>
                        <Card className="border-border/60 bg-card/60">
                          <CardContent className="flex gap-3 p-3">
                            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.className)} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-medium">{rec.title}</div>
                                <Badge variant="outline" className={cn("capitalize", style.className)}>
                                  {rec.severity}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{rec.detail}</p>
                              {rec.link && (
                                <Link href={rec.link} className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                                  Open →
                                </Link>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
            </QueryState>
          </Section>

          <Section title="Authoring">
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LINKS.map((q) => (
                <Button key={q.href} asChild variant="outline" className="h-auto justify-start py-3">
                  <Link href={q.href}>
                    <q.icon className="h-4 w-4 text-primary" />
                    {q.label}
                  </Link>
                </Button>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}
