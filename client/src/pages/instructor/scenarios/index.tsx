import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AIRCRAFT_LABELS, passMarkFor } from "@shared/constants";
import type { Scenario } from "@shared/schema";
import { del } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, QueryState, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ActiveBadge } from "@/components/instructor/shared";
import { cn } from "@/lib/utils";
import type { ScenarioListItem } from "../types";

export default function ManageScenarios() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<ScenarioListItem | null>(null);
  const scenarios = useQuery<ScenarioListItem[]>({ queryKey: keys.scenarios.list });

  const remove = useMutation({
    mutationFn: (id: number) => del<Scenario>(`/api/scenarios/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.scenarios.all });
      toast({ title: "Scenario deactivated", description: "Students can no longer start it; submissions are kept." });
      setDeleting(null);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not remove scenario", description: e.message }),
  });

  return (
    <>
      <PageHeader
        title="Manage scenarios"
        description="Operational scenarios with multiple-choice and free-text questions, marked in the review queue."
        actions={
          <Button asChild>
            <Link href="/instructor/scenarios/new">
              <Plus className="h-4 w-4" /> New scenario
            </Link>
          </Button>
        }
      />

      <QueryState
        query={scenarios}
        isEmpty={(d) => d.length === 0}
        empty={
          <EmptyState
            title="No scenarios yet"
            action={
              <Button asChild>
                <Link href="/instructor/scenarios/new">Create the first scenario</Link>
              </Button>
            }
          />
        }
      >
        {(rows) => (
          <Card className="border-border/60 bg-card/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  <TableHead className="hidden md:table-cell">Aircraft</TableHead>
                  <TableHead className="hidden sm:table-cell">Questions</TableHead>
                  <TableHead className="hidden md:table-cell">Pass mark</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow key={s.id} className={cn(!s.isActive && "opacity-70")}>
                    <TableCell>
                      <div className="font-medium">{s.title}</div>
                      <div className="line-clamp-1 max-w-md text-xs text-muted-foreground">{s.description}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{s.aircraft ? AIRCRAFT_LABELS[s.aircraft] : <span className="text-muted-foreground">Any</span>}</TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">{s.questions.length}</TableCell>
                    <TableCell className="hidden tabular-nums md:table-cell">{passMarkFor(s)}%</TableCell>
                    <TableCell className="tabular-nums">
                      {s.submissionCount > 0 ? (
                        <Link href={`/instructor/reviews`} className="hover:text-primary">
                          {s.submissionCount}
                        </Link>
                      ) : (
                        0
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <ActiveBadge active={s.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" aria-label={`Edit ${s.title}`}>
                          <Link href={`/instructor/scenarios/${s.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(s)} disabled={!s.isActive} aria-label={`Remove ${s.title}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </QueryState>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Deactivate "${deleting?.title ?? ""}"?`}
        description="The scenario is hidden from students. Existing submissions and reviews are kept, and you can re-activate it from the editor."
        confirmLabel="Deactivate"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}
