import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { QUESTION_CATEGORY_LABELS, passMarkFor, type QuestionCategory } from "@shared/constants";
import type { Quiz } from "@shared/schema";
import { del, put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, QueryState, EmptyState, formatDate } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";
import type { QuizListItem } from "../types";

function categoryLabel(c: string): string {
  return QUESTION_CATEGORY_LABELS[c as QuestionCategory] ?? c;
}

export default function ManageQuizzes() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [deleting, setDeleting] = useState<QuizListItem | null>(null);
  const quizzes = useQuery<QuizListItem[]>({ queryKey: keys.quizzes.list({ includeInactive: true }) });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => put<Quiz>(`/api/quizzes/${id}`, { isActive }),
    onSuccess: (q) => {
      qc.invalidateQueries({ queryKey: keys.quizzes.all });
      toast({ title: q.isActive ? "Quiz activated" : "Quiz deactivated" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not update quiz", description: e.message }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => del<Quiz>(`/api/quizzes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.quizzes.all });
      toast({ title: "Quiz removed", description: "It is hidden from students; results are kept." });
      setDeleting(null);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not remove quiz", description: e.message }),
  });

  return (
    <>
      <PageHeader
        title="Manage quizzes"
        description="Each quiz draws a fresh random set of questions from the bank for every attempt."
        actions={
          <Button asChild>
            <Link href="/instructor/quizzes/new">
              <Plus className="h-4 w-4" /> New quiz
            </Link>
          </Button>
        }
      />

      <QueryState
        query={quizzes}
        isEmpty={(d) => d.length === 0}
        empty={
          <EmptyState
            title="No quizzes yet"
            action={
              <Button asChild>
                <Link href="/instructor/quizzes/new">Create the first quiz</Link>
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
                  <TableHead>Quiz</TableHead>
                  <TableHead className="hidden sm:table-cell">Questions</TableHead>
                  <TableHead className="hidden md:table-cell">Pass mark</TableHead>
                  <TableHead className="hidden md:table-cell">Time limit</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((q) => (
                  <TableRow key={q.id} className={cn("cursor-pointer", !q.isActive && "opacity-70")} onClick={() => navigate(`/instructor/quizzes/${q.id}`)}>
                    <TableCell>
                      <div className="font-medium">{q.title}</div>
                      <div className="max-w-md truncate text-xs text-muted-foreground">
                        {q.categories.map(categoryLabel).join(" · ")}
                        {q.expiresAt && ` · expires ${formatDate(q.expiresAt)}`}
                      </div>
                    </TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">{q.questionCount}</TableCell>
                    <TableCell className="hidden tabular-nums md:table-cell">{passMarkFor(q)}%</TableCell>
                    <TableCell className="hidden md:table-cell">{q.timeLimitMinutes ? `${q.timeLimitMinutes} min` : <span className="text-muted-foreground">None</span>}</TableCell>
                    <TableCell className="tabular-nums">{q.attemptCount}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={q.isActive}
                        onCheckedChange={(v) => toggle.mutate({ id: q.id, isActive: v })}
                        disabled={toggle.isPending}
                        aria-label={q.isActive ? `Deactivate ${q.title}` : `Activate ${q.title}`}
                      />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" aria-label={`Edit ${q.title}`}>
                          <Link href={`/instructor/quizzes/${q.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(q)} disabled={!q.isActive} aria-label={`Remove ${q.title}`}>
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
        title={`Remove "${deleting?.title ?? ""}"?`}
        description="The quiz is deactivated and hidden from students. Existing attempts and results are kept."
        confirmLabel="Remove"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}
