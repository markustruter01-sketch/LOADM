import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { QUESTION_CATEGORIES, QUESTION_CATEGORY_LABELS, QUESTION_DIFFICULTIES, type QuestionCategory } from "@shared/constants";
import type { InsertQuizQuestion, QuizQuestion } from "@shared/schema";
import { del, put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, QueryState, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { QuestionDialog } from "@/components/instructor/QuestionDialog";
import { ActiveBadge } from "@/components/instructor/shared";
import { cn } from "@/lib/utils";
import type { QuestionBankResponse } from "./types";

const ALL = "all";
const DIFFICULTY_TONE: Record<string, string> = {
  easy: "border-emerald-500/40 text-emerald-400",
  medium: "border-amber-500/40 text-amber-400",
  hard: "border-red-500/40 text-red-400",
};

function toBody(q: QuizQuestion, isActive: boolean): InsertQuizQuestion {
  return { category: q.category, questionText: q.questionText, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, difficulty: q.difficulty, isActive };
}

export default function QuestionBank() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [category, setCategory] = useState<QuestionCategory | typeof ALL>(ALL);
  const [difficulty, setDifficulty] = useState<string>(ALL);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<QuizQuestion | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<QuizQuestion | null>(null);

  const list = useQuery<QuestionBankResponse>({
    queryKey: keys.questionBank.list({
      category: category === ALL ? undefined : category,
      difficulty: difficulty === ALL ? undefined : difficulty,
      includeInactive: includeInactive || undefined,
    }),
  });

  const counts = list.data?.counts ?? {};
  const total = QUESTION_CATEGORIES.reduce((s, c) => s + (counts[c] ?? 0), 0);

  const questions = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = list.data?.questions ?? [];
    if (!term) return rows;
    return rows.filter((q) => q.questionText.toLowerCase().includes(term) || q.options.some((o) => o.toLowerCase().includes(term)));
  }, [list.data, search]);

  const invalidate = () => qc.invalidateQueries({ queryKey: keys.questionBank.all });

  const remove = useMutation({
    mutationFn: (id: number) => del<QuizQuestion>(`/api/question-bank/${id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Question retired", description: "It will no longer be drawn into quizzes. Past attempts are unaffected." });
      setDeleting(null);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not retire question", description: e.message }),
  });

  const restore = useMutation({
    mutationFn: (q: QuizQuestion) => put<QuizQuestion>(`/api/question-bank/${q.id}`, toBody(q, true)),
    onSuccess: () => {
      invalidate();
      toast({ title: "Question restored" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not restore question", description: e.message }),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (q: QuizQuestion) => {
    setEditing(q);
    setDialogOpen(true);
  };

  const CategoryButton = ({ value, label, count }: { value: QuestionCategory | typeof ALL; label: string; count: number }) => (
    <button
      type="button"
      onClick={() => setCategory(value)}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
        category === value ? "bg-primary/15 text-primary" : "text-foreground/80 hover:bg-muted",
      )}
      aria-pressed={category === value}
    >
      <span className="truncate">{label}</span>
      <span className="ml-2 text-xs tabular-nums text-muted-foreground">{count}</span>
    </button>
  );

  return (
    <>
      <PageHeader
        title="Question bank"
        description="The pool every quiz draws from. Retiring a question keeps past attempts intact."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New question
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        <aside>
          <Card className="border-border/60 bg-card/60 p-2">
            <nav aria-label="Categories" className="space-y-0.5">
              <CategoryButton value={ALL} label="All categories" count={total} />
              {QUESTION_CATEGORIES.map((c) => (
                <CategoryButton key={c} value={c} label={QUESTION_CATEGORY_LABELS[c]} count={counts[c] ?? 0} />
              ))}
            </nav>
          </Card>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="qb-search" className="sr-only">
                Search questions
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="qb-search" className="pl-8" placeholder="Search question text or options" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="w-full sm:w-40">
              <Label htmlFor="qb-difficulty" className="sr-only">
                Difficulty
              </Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger id="qb-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All difficulties</SelectItem>
                  {QUESTION_DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d} className="capitalize">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex h-10 items-center gap-2">
              <Switch id="qb-inactive" checked={includeInactive} onCheckedChange={setIncludeInactive} />
              <Label htmlFor="qb-inactive" className="whitespace-nowrap text-sm">
                Show retired
              </Label>
            </div>
          </div>

          <QueryState
            query={list}
            isEmpty={(d) => d.questions.length === 0}
            empty={<EmptyState title="No questions here" description="Add one, or pick another category." action={<Button onClick={openCreate}>New question</Button>} />}
          >
            {() =>
              questions.length === 0 ? (
                <EmptyState title="No matches" description="Nothing matches that search." />
              ) : (
                <Card className="border-border/60 bg-card/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Question</TableHead>
                        <TableHead className="hidden md:table-cell">Difficulty</TableHead>
                        <TableHead className="hidden sm:table-cell">Options</TableHead>
                        <TableHead className="hidden md:table-cell">Status</TableHead>
                        <TableHead className="text-right">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((q) => (
                        <TableRow key={q.id} className={cn(!q.isActive && "opacity-60")}>
                          <TableCell>
                            <div className="line-clamp-2 max-w-xl font-medium">{q.questionText}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {QUESTION_CATEGORY_LABELS[q.category]} · Answer: {q.options[q.correctIndex] ?? "—"}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className={cn("capitalize", DIFFICULTY_TONE[q.difficulty])}>
                              {q.difficulty}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden tabular-nums sm:table-cell">{q.options.length}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <ActiveBadge active={q.isActive} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(q)} aria-label="Edit question">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {q.isActive ? (
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(q)} aria-label="Retire question">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="icon" onClick={() => restore.mutate(q)} disabled={restore.isPending} aria-label="Restore question">
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )
            }
          </QueryState>
        </div>
      </div>

      <QuestionDialog open={dialogOpen} onOpenChange={setDialogOpen} question={editing} defaultCategory={category === ALL ? QUESTION_CATEGORIES[0] : category} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Retire this question?"
        description="It will stop being drawn into quizzes. Past attempts and their grading are unaffected, and you can restore it later."
        confirmLabel="Retire"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}
