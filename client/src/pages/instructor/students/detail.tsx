import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, Clock, ShieldAlert, Target, TrendingUp } from "lucide-react";
import { ROLE_LABELS, SQUADRON_LABELS, THRESHOLDS } from "@shared/constants";
import { keys } from "@/lib/keys";
import { PageHeader, Section, StatCard, QueryState, EmptyState, ScoreBadge, formatDate, formatDateTime, relativeTime } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReadinessDialog } from "@/components/instructor/ReadinessDialog";
import { personName } from "@/components/instructor/shared";
import { cn } from "@/lib/utils";
import type { ProfileActivity, StudentAnalytics, StudentProfile } from "../types";

const TOOLTIP_STYLE = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };
const AXIS = "hsl(var(--muted-foreground))";

function ScoreTrend({ profile, analytics }: { profile: StudentProfile; analytics: StudentAnalytics | undefined }) {
  // Prefer the analytics monthly trend; fall back to graded activity points.
  const data = useMemo(() => {
    const trend = analytics?.trend;
    if (trend && trend.length > 0) return trend.filter((t) => t.submissions > 0).map((t) => ({ label: t.month, score: t.averageScore }));
    return profile.activity
      .filter((a): a is ProfileActivity & { score: number } => a.score !== null)
      .slice()
      .reverse()
      .map((a) => ({ label: formatDate(a.date, { day: "numeric", month: "short" }), score: a.score }));
  }, [analytics, profile.activity]);

  if (data.length === 0) return <EmptyState title="No graded work yet" description="Scores will chart here once something is marked." icon={<TrendingUp className="h-8 w-8" />} />;

  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="p-4">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" stroke={AXIS} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke={AXIS} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, "Score"]} />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--chart-1))" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

const QUAL_TONE = { current: "border-emerald-500/40 text-emerald-400", expiring: "border-amber-500/40 text-amber-400", expired: "border-red-500/40 text-red-400" } as const;

function StudentBody({ profile, analytics }: { profile: StudentProfile; analytics: StudentAnalytics | undefined }) {
  const [readinessOpen, setReadinessOpen] = useState(false);
  const { user, stats } = profile;
  const comparison = analytics?.comparison ?? null;
  const avg = stats.averageScore;

  return (
    <>
      <Card className="mb-6 border-border/60 bg-card/60">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user.profilePhotoUrl ?? undefined} alt="" />
              <AvatarFallback className="bg-primary/20 text-primary">{initials(user.firstName, user.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold">{personName(user)}</div>
              <div className="text-sm text-muted-foreground">
                {ROLE_LABELS[user.role]} · {SQUADRON_LABELS[user.squadron]} · Category {user.category}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn(user.isFlightReady ? "border-emerald-500/40 text-emerald-400" : "border-red-500/40 text-red-400")}>
                  {user.isFlightReady ? "Flight ready" : `Not ready${user.notReadyReason ? ` · ${user.notReadyReason}` : ""}`}
                </Badge>
                <span className="text-xs text-muted-foreground">Last active {relativeTime(user.lastActiveAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setReadinessOpen(true)}>
              Readiness override
            </Button>
            <Button asChild variant="outline">
              <Link href={`/instructor/safety?userId=${user.id}`}>
                <ShieldAlert className="h-4 w-4" /> Add safety record
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <ReadinessDialog key={`${user.id}-${String(user.isFlightReady)}-${user.notReadyReason ?? ""}`} user={user} open={readinessOpen} onOpenChange={setReadinessOpen} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Average score"
          value={avg === null ? "—" : `${avg}%`}
          tone={avg === null ? "default" : avg >= THRESHOLDS.CERTIFICATION_READY_SCORE ? "good" : avg < THRESHOLDS.AT_RISK_AVERAGE_SCORE ? "bad" : "default"}
          icon={<Target className="h-4 w-4" />}
          hint={comparison?.averageScore ? `Squadron avg ${comparison.averageScore.squadron}%` : "Last 180 days"}
        />
        <StatCard label="Pass rate" value={`${stats.passRate}%`} icon={<Award className="h-4 w-4" />} hint={comparison ? `Squadron ${comparison.passRate.squadron}%` : `${stats.passed} of ${stats.graded} graded`} />
        <StatCard label="Submissions" value={stats.totalSubmissions} hint={stats.pendingGrading ? `${stats.pendingGrading} awaiting review` : "All graded"} tone={stats.pendingGrading ? "warn" : "default"} />
        <StatCard
          label="Activity"
          value={stats.weeksSinceLastActivity === null ? "None" : stats.weeksSinceLastActivity === 0 ? "This week" : `${stats.weeksSinceLastActivity} wk ago`}
          tone={stats.weeksSinceLastActivity !== null && stats.weeksSinceLastActivity >= THRESHOLDS.INACTIVE_AFTER_WEEKS ? "bad" : "default"}
          icon={<Clock className="h-4 w-4" />}
          hint={`${stats.currentStreakWeeks} week streak · best ${stats.longestStreakWeeks}`}
        />
      </div>

      <Section title="Score trend" description={comparison?.rank.position ? `Ranked ${comparison.rank.position} of ${comparison.rank.of} in ${comparison.squadron}` : undefined}>
        <ScoreTrend profile={profile} analytics={analytics} />
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Recent activity">
          {profile.activity.length === 0 ? (
            <EmptyState title="No activity" />
          ) : (
            <Card className="border-border/60 bg-card/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.activity.slice(0, 15).map((a) => (
                    <TableRow key={`${a.type}-${a.id}`}>
                      <TableCell>
                        <div className="max-w-[14rem] truncate font-medium">{a.title}</div>
                        <div className="text-xs capitalize text-muted-foreground">{a.type}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(a.date)}</TableCell>
                      <TableCell>
                        {a.type === "document" ? <span className="text-xs text-muted-foreground">Submitted</span> : <ScoreBadge score={a.score} passed={a.passed} />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </Section>

        <Section title="Qualifications" description={`${stats.qualifications.current} current · ${stats.qualifications.expiring} expiring · ${stats.qualifications.expired} expired`}>
          {profile.qualifications.length === 0 ? (
            <EmptyState title="No qualifications recorded" />
          ) : (
            <Card className="border-border/60 bg-card/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.qualifications.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">{q.name}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {q.expiryDate ? formatDate(q.expiryDate) : "No expiry"}
                        {q.daysRemaining !== null && q.status !== "expired" && <span className="ml-1 text-xs">({q.daysRemaining} d)</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("capitalize", QUAL_TONE[q.status])}>
                          {q.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </Section>
      </div>
    </>
  );
}

export default function StudentDetail() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = Number(idParam);
  const profile = useQuery<StudentProfile>({ queryKey: keys.users.profile(id), enabled: Number.isFinite(id) });
  // Extra comparison data; the page renders without it if it fails.
  const analytics = useQuery<StudentAnalytics>({ queryKey: keys.analytics.student(id), enabled: Number.isFinite(id), retry: false });

  return (
    <>
      <PageHeader backHref="/instructor/students" eyebrow="Student" title={profile.data ? personName(profile.data.user) : "Student"} description="Progress, readiness and qualifications for one person." />
      <QueryState query={profile}>{(data) => <StudentBody profile={data} analytics={analytics.data} />}</QueryState>
    </>
  );
}
