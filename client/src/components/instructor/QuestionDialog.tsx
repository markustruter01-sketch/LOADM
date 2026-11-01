import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUESTION_CATEGORIES, QUESTION_CATEGORY_LABELS, QUESTION_DIFFICULTIES, type QuestionCategory } from "@shared/constants";
import { insertQuizQuestionSchema, type InsertQuizQuestion, type QuizQuestion } from "@shared/schema";
import { post, put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { OptionsEditor } from "./OptionsEditor";

function toForm(q: QuizQuestion | null, category: QuestionCategory): InsertQuizQuestion {
  if (!q) return { category, questionText: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", difficulty: "medium", isActive: true };
  return {
    category: q.category,
    questionText: q.questionText,
    options: q.options.slice(),
    correctIndex: q.correctIndex,
    explanation: q.explanation ?? "",
    difficulty: q.difficulty,
    isActive: q.isActive,
  };
}

/** Create or edit one question-bank question. `question` null = create. */
export function QuestionDialog({
  open,
  onOpenChange,
  question,
  defaultCategory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: QuizQuestion | null;
  defaultCategory: QuestionCategory;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const form = useForm<InsertQuizQuestion>({ resolver: zodResolver(insertQuizQuestionSchema), defaultValues: toForm(question, defaultCategory) });

  useEffect(() => {
    if (open) form.reset(toForm(question, defaultCategory));
  }, [open, question, defaultCategory, form]);

  const save = useMutation({
    mutationFn: (body: InsertQuizQuestion) => (question ? put<QuizQuestion>(`/api/question-bank/${question.id}`, body) : post<QuizQuestion>("/api/question-bank", body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.questionBank.all });
      toast({ title: question ? "Question updated" : "Question added" });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not save question", description: e.message }),
  });

  const onSubmit = (v: InsertQuizQuestion) => {
    const explanation = v.explanation?.trim();
    save.mutate({ ...v, options: v.options.map((o) => o.trim()), explanation: explanation ? explanation : null });
  };

  const correctIndex = form.watch("correctIndex");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{question ? "Edit question" : "New question"}</DialogTitle>
          <DialogDescription>Quizzes draw questions at random from their categories. Students never see the answer key before submitting.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {QUESTION_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {QUESTION_CATEGORY_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select value={field.value ?? "medium"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {QUESTION_DIFFICULTIES.map((d) => (
                          <SelectItem key={d} value={d} className="capitalize">
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="questionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="options"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Options (2–6)</FormLabel>
                  <OptionsEditor
                    idPrefix="qb"
                    options={field.value}
                    correctIndex={correctIndex}
                    onChange={(opts, ci) => {
                      field.onChange(opts);
                      form.setValue("correctIndex", ci, { shouldValidate: form.formState.isSubmitted });
                    }}
                  />
                  <FormMessage />
                  {form.formState.errors.correctIndex && <p className="text-sm font-medium text-destructive">{form.formState.errors.correctIndex.message}</p>}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Explanation (shown after submitting)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border border-border/60 p-3">
                  <FormLabel className="mt-0">Active (eligible to be drawn into quizzes)</FormLabel>
                  <FormControl>
                    <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : question ? "Save changes" : "Add question"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
