import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, ListOrdered, Plane, Target } from "lucide-react";
import { AIRCRAFT_LABELS, passMarkFor } from "@shared/constants";
import { keys } from "@/lib/keys";
import { usePersona } from "@/lib/persona";
import { EmptyState, PageHeader, QueryState, Section, formatDateTime } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SubmissionStatusBadge } from "@/components/scenarios/StatusBadge";
import type { ScenarioListItem, ScenarioSubmissionRow } from "./types";

function ScenarioCard({ s }: { s: ScenarioListItem }) {
  return (
    <Card className="flex flex-col border-border/60 bg-card/60 transition-colors hover:border-primary/50">
      <CardHeader className="pb-2">
        <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Plane className="h-3.5 w-3.5" aria-hidden /> {s.aircraft ? AIRCRAFT_LABELS[s.aircraft] : "All aircraft"}
          {!s.isActive && (
            <Badge variant="outline" className="ml-auto font-normal">
              Inactive
            </Badge>
          )}
        </div>
        <CardTitle className="text-base leading-snug">{s.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="line-clamp-3 text-sm text-muted-foreground">{s.description}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ListOrdered className="h-3.5 w-3.5" aria-hidden /> {s.questions.length} question{s.questions.length === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Target className="h-3.5 w-3.5" aria-hidden /> Pass {passMarkFor(s)}%
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        {s.mySubmission ? (
          <Link href={`/scenarios/results/${s.mySubmission.id}`} className="hover:opacity-80" aria-label="View my latest submission">
            <SubmissionStatusBadge status={s.mySubmission.status} score={s.mySubmission.score} passed={s.mySubmission.passed} />
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">Not attempted</span>
        )}
        <Button asChild size="sm" variant={s.mySubmission ? "outline" : "default"}>
          <Link href={`/scenarios/${s.id}`}>{s.mySubmission ? "Attempt again" : "Start"}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function MySubmissions() {
  const { can } = usePersona();
  const q = useQuery<ScenarioSubmissionRow[]>({ queryKey: keys.scenarios.submissions() });
  const showUser = can("instruct");
  return (
    <Section title={showUser ? "Recent submissions" : "My submissions"} description={showUser ? "All submissions you can see as an instructor." : undefined}>
      <QueryState query={q} rows={2} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No submissions yet" />}>
        {(rows) => (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  {showUser && <TableHead>Member</TableHead>}
                  <TableHead className="w-28">Type</TableHead>
                  <TableHead className="w-40">Submitted</TableHead>
                  <TableHead className="w-36 text-right">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, showUser ? 25 : rows.length).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link href={`/scenarios/results/${s.id}`} className="hover:text-primary">
                        {s.scenarioTitle}
                      </Link>
                    </TableCell>
                    {showUser && (
                      <TableCell className="text-muted-foreground">
                        {s.user.rank} {s.user.firstName} {s.user.lastName}
                      </TableCell>
                    )}
                    <TableCell className="capitalize text-muted-foreground">{s.submissionType}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(s.submittedAt)}</TableCell>
                    <TableCell className="text-right">
                      <SubmissionStatusBadge status={s.status} score={s.score} passed={s.passed} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </QueryState>
    </Section>
  );
}

export default function ScenarioList() {
  const q = useQuery<ScenarioListItem[]>({ queryKey: keys.scenarios.list });
  return (
    <div>
      <PageHeader title="Scenarios" description="Realistic loading problems marked by an instructor. You will be notified on your dashboard when yours has been reviewed." />
      <Section>
        <QueryState
          query={q}
          rows={3}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState title="No scenarios available" icon={<ClipboardCheck className="h-8 w-8" />} />}
        >
          {(list) => (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => (
                <ScenarioCard key={s.id} s={s} />
              ))}
            </div>
          )}
        </QueryState>
      </Section>
      <MySubmissions />
    </div>
  );
}
