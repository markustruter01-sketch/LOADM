import { useQuery } from "@tanstack/react-query";
import { keys } from "@/lib/keys";
import { usePersona } from "@/lib/persona";
import { PageHeader, QueryState, StatCard } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityTable } from "@/components/profile/ActivityTable";
import { ProfileDetailsForm, ProfilePhoto, ReadinessCard } from "@/components/profile/ProfileForm";
import { QualificationsTab } from "@/components/profile/QualificationsTab";
import { FlightLogTab } from "@/components/profile/FlightLogTab";
import type { Profile } from "@/components/profile/types";

export default function ProfilePage() {
  const { can } = usePersona();
  const profile = useQuery<Profile>({ queryKey: keys.users.me });

  return (
    <div>
      <PageHeader title="My profile" description="Your details, qualifications, flight log and training history." />
      <QueryState query={profile} rows={4}>
        {(p) => (
          <Tabs defaultValue="overview">
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="qualifications">
                Qualifications
                {p.stats.qualifications.expired + p.stats.qualifications.expiring > 0 && (
                  <span className="ml-1.5 rounded bg-amber-400/15 px-1.5 text-[10px] font-semibold text-amber-400">
                    {p.stats.qualifications.expired + p.stats.qualifications.expiring}
                  </span>
                )}
              </TabsTrigger>
              {can("operate") && <TabsTrigger value="flight">Flight log</TabsTrigger>}
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="border-border/60 bg-card/60 lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Personal details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ProfilePhoto user={p.user} />
                    <ProfileDetailsForm user={p.user} />
                  </CardContent>
                </Card>
                <div className="space-y-4">
                  <ReadinessCard user={p.user} />
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard label="Submissions" value={p.stats.totalSubmissions} />
                    <StatCard label="Pass rate" value={p.stats.graded ? `${p.stats.passRate}%` : "—"} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="qualifications">
              <QualificationsTab qualifications={p.qualifications} />
            </TabsContent>

            {can("operate") && (
              <TabsContent value="flight">
                <FlightLogTab />
              </TabsContent>
            )}

            <TabsContent value="activity">
              <ActivityTable items={p.activity} />
              {p.activity.length >= 50 && <p className="mt-2 text-xs text-muted-foreground">Showing your 50 most recent items.</p>}
            </TabsContent>
          </Tabs>
        )}
      </QueryState>
    </div>
  );
}
