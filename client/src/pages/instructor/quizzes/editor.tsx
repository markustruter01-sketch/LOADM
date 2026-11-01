import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { AlertTriangle } from "lucide-react";
import { QUESTION_CATEGORIES, QUESTION_CATEGORY_LABELS, THRESHOLDS } from "@shared/constants";
import { insertQuizSchema, type InsertQuiz, type Quiz } from "@shared/schema";
import { post, put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, QueryState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { NullableNumberInput, toDateInput } from "@/components/instructor/shared";
import { cn } from "@/lib/utils";
import type { CategoryCount } from "../types";

function toForm(q: Quiz | null): InsertQuiz {
  if (!q) {
    return { title: "", description: "", categories: [], questionCount: 10, passingThreshold: THRESHOLDS.DEFAULT_PASS_MARK, timeLimitMinutes: null, isActive: true, expiresAt: null };
  }
  return {
    title: q.title,
    description: q.description,
    categories: q.categories.filter((c): c is InsertQuiz["categories"][number] => (QUESTION_CATEGORIES as readonly string[]).includes(c)),
    questionCount: q.questionCount,
    passingThreshold: q.passingThreshold ?? THRESHOLDS.DEFAULT_PASS_MARK,
    timeLimitMinutes: q.timeLimitMinutes,
    isActive: q.isActive,
    expiresAt: q.expiresAt ? new Date(q.expiresAt) : null,
  };
}

function QuizForm({ quiz }: { quiz: Quiz | null }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const categories = useQuery<CategoryCount[]>({ queryKey: keys.questionBank.categories });
  const form = useForm<InsertQuiz>({ resolver: zodResolver(insertQuizSchema), defaultValues: toForm(quiz) });

  const selected = form.watch("categories");
  const questionCount = form.watch("questionCount");
  const available = (categories.data ?? []).filter((c) => selected.includes(c.category)).reduce((s, c) => s + c.activeCount, 0);
  const short = selected.length > 0 && categories.data !== undefined && questionCount > available;

  const save = useMutation({
    mutationFn: (body: InsertQuiz) => (quiz ? put<Quiz>(`/api/quizzes/${quiz.id}`, body) : post<Quiz>("/api/quizzes", body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.quizzes.all });
      toast({ title: quiz ? "Quiz updated" : "Quiz created" });
      navigate("/instructor/quizzes");
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not save quiz", description: e.message }),
  });

  const onSubmit = (v: InsertQuiz) => save.mutate({ ...v, title: v.title.trim(), description: v.description?.trim() ?? "" });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-border/60 bg-card/60">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question categories</FormLabel>
                  <FormDescription>Questions are drawn at random from the active questions in these categories.</FormDescription>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {QUESTION_CATEGORIES.map((c) => {
                      const id = `cat-${c}`;
                      const checked = field.value.includes(c);
                      const count = categories.data?.find((x) => x.category === c)?.activeCount;
                      return (
                        <label
                          key={c}
                          htmlFor={id}
                          className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors", checked ? "border-primary/60 bg-primary/5" : "border-border/60 hover:bg-muted/40")}
                        >
                          <Checkbox id={id} checked={checked} onCheckedChange={(v) => field.onChange(v === true ? [...field.value, c] : field.value.filter((x) => x !== c))} />
                          <span className="flex-1 text-sm">{QUESTION_CATEGORY_LABELS[c]}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">{count ?? "—"}</span>
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="questionCount"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Questions per attempt</FormLabel>
                    <span className="text-sm font-semibold tabular-nums">{field.value}</span>
                  </div>
                  <FormControl>
                    <Slider min={1} max={100} step={1} value={[field.value]} onValueChange={(v) => field.onChange(v[0] ?? 1)} aria-label="Questions per attempt" />
                  </FormControl>
                  <FormDescription>{selected.length ? `${available} active questions available in the selected categories.` : "Select at least one category."}</FormDescription>
                  {short && (
                    <p className="flex items-center gap-1.5 text-sm text-amber-400">
                      <AlertTriangle className="h-4 w-4" /> Only {available} questions are available; attempts will use all of them.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardContent className="grid gap-4 p-4 sm:grid-cols-3 sm:p-6">
            <FormField
              control={form.control}
              name="passingThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pass mark (%)</FormLabel>
                  <FormControl>
                    <NullableNumberInput min={0} max={100} value={field.value} onChange={field.onChange} placeholder={String(THRESHOLDS.DEFAULT_PASS_MARK)} />
                  </FormControl>
                  <FormDescription>Blank uses the default ({THRESHOLDS.DEFAULT_PASS_MARK}%).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeLimitMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time limit (minutes)</FormLabel>
                  <FormControl>
                    <NullableNumberInput min={1} max={240} value={field.value} onChange={field.onChange} placeholder="No limit" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expires (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" value={toDateInput(field.value)} onChange={(e) => field.onChange(e.target.value ? new Date(`${e.target.value}T23:59:59`) : null)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border border-border/60 p-3 sm:col-span-3">
                  <div>
                    <FormLabel>Active</FormLabel>
                    <FormDescription>Inactive quizzes are hidden from students.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/instructor/quizzes")}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : quiz ? "Save changes" : "Create quiz"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function QuizEditor() {
  const { id: idParam } = useParams<{ id?: string }>();
  const id = idParam ? Number(idParam) : null;
  const quiz = useQuery<Quiz>({ queryKey: keys.quizzes.one(id ?? 0), enabled: id !== null });

  return (
    <>
      <PageHeader backHref="/instructor/quizzes" title={id ? "Edit quiz" : "New quiz"} description="Set the categories to draw from, how many questions, and the pass mark." />
      {id === null ? <QuizForm quiz={null} /> : <QueryState query={quiz}>{(q) => <QuizForm key={q.id} quiz={q} />}</QueryState>}
    </>
  );
}
