import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CheckCircle2 } from "lucide-react";
import { FLYING_SQUADRONS, SQUADRON_LABELS, SUBMISSION_STATUSES } from "@shared/constants";
import { keys } from "@/lib/keys";
import { PageHeader, QueryState, EmptyState, ScoreBadge, relativeTime } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { personName, StatusBadge } from "@/components/instructor/shared";
import type { ScenarioListItem, ScenarioSubmissionRow } from "../types";

const ALL = "all";

export default function ReviewQueue() {
  const [status, setStatus] = useState<string>("submitted");
  const [squadron, setSquadron] = useState<string>(ALL);
  const [scenarioId, setScenarioId] = useState<string>(ALL);

  const scenarios = useQuery<ScenarioListItem[]>({ queryKey: keys.scenarios.list });
  const submissions = useQuery<ScenarioSubmissionRow[]>({
    queryKey: keys.scenarios.submissions({
      status: status === ALL ? undefined : status,
      squadron: squadron === ALL ? undefined : squadron,
      scenarioId: scenarioId === ALL ? undefined : Number(scenarioId),
    }),
  });

  return (
    <>
      <PageHeader title="Review queue" description="Scenario submissions. Free-text answers are marked by hand against the model answer." />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="filter-status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {SUBMISSION_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s === "submitted" ? "Awaiting review" : "Reviewed"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-squadron">Squadron</Label>
          <Select value={squadron} onValueChange={setSquadron}>
            <SelectTrigger id="filter-squadron">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All squadrons</SelectItem>
              {FLYING_SQUADRONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {SQUADRON_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-scenario">Scenario</Label>
          <Select value={scenarioId} onValueChange={setScenarioId}>
            <SelectTrigger id="filter-scenario">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All scenarios</SelectItem>
              {(scenarios.data ?? []).map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <QueryState
        query={submissions}
        isEmpty={(d) => d.length === 0}
        empty={
          <EmptyState
            title={status === "submitted" ? "Queue is clear" : "No submissions match"}
            description={status === "submitted" ? "There is nothing waiting for review." : "Try widening the filters."}
            icon={<CheckCircle2 className="h-8 w-8 text-emerald-400" />}
          />
        }
      >
        {(rows) => (
          <Card className="border-border/60 bg-card/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden md:table-cell">Squadron</TableHead>
                  <TableHead>Scenario</TableHead>
                  <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                  <TableHead className="hidden lg:table-cell">Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Action</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{personName(s.user)}</TableCell>
                    <TableCell className="hidden md:table-cell">{SQUADRON_LABELS[s.squadron]}</TableCell>
                    <TableCell className="max-w-[18rem] truncate">{s.scenarioTitle ?? "—"}</TableCell>
                    <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">{relativeTime(s.submittedAt)}</TableCell>
                    <TableCell className="hidden capitalize lg:table-cell">{s.submissionType}</TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell>
                      <ScoreBadge score={s.score} passed={s.passed} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant={s.status === "submitted" ? "default" : "outline"}>
                        <Link href={`/instructor/reviews/${s.id}`}>{s.status === "submitted" ? "Review" : "View"}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </QueryState>
    </>
  );
}
