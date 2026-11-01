import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Award, ClipboardCheck, Flame, Target, TrendingUp, ArrowRight } from "lucide-react";
import { ROLE_LABELS, SQUADRON_LABELS, THRESHOLDS } from "@shared/constants";
import { keys } from "@/lib/keys";
import { usePersona } from "@/lib/persona";
import { PageHeader, QueryState, StatCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTable } from "@/components/profile/ActivityTable";
import { CommandPanel, ContinueTraining, InstructorPanel, ReviewedNotifications } from "@/components/dashboard/Panels";
import type { Profile } from "@/components/profile/types";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { can, role } = usePersona();
  const profile = useQuery<Profile>({ queryKey: keys.users.me });
  const user = profile.data?.user;

  return (
    <div>
      <PageHeader
        eyebrow={role ? ROLE_LABELS[role] : undefined}
        title={user ? `${greeting()}, ${user.rank} ${user.lastName}` : greeting()}
        description={
          user ? (
            <>
              {user.firstName} {user.lastName} · {SQUADRON_LABELS[user.squadron]} · Category {user.category}
            </>
          ) : (
            "Your training hub."
          )
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/profile">My profile</Link>
          </Button>
        }
      />

      <ReviewedNotifications />

      <QueryState query={profile} rows={3}>
        {(p) => {
          const s = p.stats;
          const qualTone = s.qualifications.expired > 0 ? "bad" : s.qualifications.expiring > 0 ? "warn" : "good";
          return (
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard
                label="Pass rate"
                value={s.graded ? `${s.passRate}%` : "—"}
                hint={s.graded ? `${s.passed} of ${s.graded} graded` : "No graded attempts yet"}
                icon={<Target className="h-4 w-4" aria-hidden />}
                tone={s.graded === 0 ? "default" : s.passRate >= THRESHOLDS.CERTIFICATION_READY_SCORE ? "good" : s.passRate < THRESHOLDS.AT_RISK_AVERAGE_SCORE ? "bad" : "default"}
              />
              <StatCard
                label="Average score"
                value={s.averageScore === null ? "—" : `${s.averageScore}%`}
                hint="Last 180 days"
                icon={<TrendingUp className="h-4 w-4" aria-hidden />}
                tone={s.averageScore === null ? "default" : s.averageScore >= THRESHOLDS.CERTIFICATION_READY_SCORE ? "good" : s.averageScore < THRESHOLDS.AT_RISK_AVERAGE_SCORE ? "warn" : "default"}
              />
              <StatCard
                label="Current streak"
                value={`${s.currentStreakWeeks} wk`}
                hint={`Longest ${s.longestStreakWeeks} wk`}
                icon={<Flame className="h-4 w-4" aria-hidden />}
                tone={s.currentStreakWeeks > 0 ? "good" : "default"}
              />
              <StatCard
                label="Pending grading"
                value={s.pendingGrading}
                hint="Scenarios awaiting instructor review"
                icon={<ClipboardCheck className="h-4 w-4" aria-hidden />}
                tone={s.pendingGrading > 0 ? "warn" : "default"}
              />
              <StatCard
                label="Qualifications"
                value={
                  <span>
                    {s.qualifications.expiring} <span className="text-sm font-normal text-muted-foreground">expiring</span> · {s.qualifications.expired}{" "}
                    <span className="text-sm font-normal text-muted-foreground">expired</span>
                  </span>
                }
                hint={`${s.qualifications.current} current`}
                icon={<Award className="h-4 w-4" aria-hidden />}
                tone={qualTone}
              />
            </div>
          );
        }}
      </QueryState>

      {(can("instruct") || can("command")) && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {can("instruct") && <InstructorPanel />}
          {can("command") && <CommandPanel />}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ContinueTraining />
        </div>
        <Card className="border-border/60 bg-card/60 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href="/profile">
                Full history <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <QueryState query={profile} rows={3}>
              {(p) => <ActivityTable items={p.activity} limit={8} />}
            </QueryState>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
