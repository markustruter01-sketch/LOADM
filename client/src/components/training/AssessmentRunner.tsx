import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { passMarkFor } from "@shared/constants";
import type { TrainingModule } from "@shared/schema";
import { post } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { QuestionCard } from "@/components/quizzes/QuestionCard";
import { ScoreRing } from "@/components/quizzes/ScoreRing";
import { cn } from "@/lib/utils";
import type { AssessmentResponse, StudentModuleQuestion } from "@/pages/training/types";

/**
 * Runs a module assessment: one question at a time or all at once, then
 * submits to the server for grading and shows the result with a review.
 */
export function AssessmentRunner({
  module,
  questions,
  onPassed,
}: {
  module: Pick<TrainingModule, "id" | "passingThreshold">;
  questions: StudentModuleQuestion[];
  onPassed?: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [allAtOnce, setAllAtOnce] = useState(false);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<AssessmentResponse | null>(null);
  const passMark = passMarkFor(module);

  const submit = useMutation({
    mutationFn: () => post<AssessmentResponse>(`/api/training/modules/${module.id}/assessment`, { answers }),
    onSuccess: (res) => {
      setResult(res);
      qc.invalidateQueries({ queryKey: keys.training.all });
      qc.invalidateQueries({ queryKey: keys.training.modules() });
      qc.invalidateQueries({ queryKey: keys.training.mine });
      qc.invalidateQueries({ queryKey: keys.users.me });
      if (res.completion.passed) onPassed?.();
      toast({ title: res.completion.passed ? "Assessment passed" : "Assessment not passed", description: `You scored ${res.completion.score}%.` });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not submit assessment", description: e.message }),
  });

  if (questions.length === 0) {
    return <p className="text-sm text-muted-foreground">This assessment has no questions yet.</p>;
  }

  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
  const complete = answeredCount === questions.length;

  if (result) {
    const { completion, results } = result;
    return (
      <div className="space-y-5">
        <div
          className={cn(
            "flex flex-col items-center gap-4 rounded-lg border p-6 sm:flex-row",
            completion.passed ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5",
          )}
        >
          <ScoreRing score={completion.score} passed={completion.passed} size={120} stroke={10} />
          <div className="text-center sm:text-left">
            <div className={cn("text-xl font-semibold", completion.passed ? "text-emerald-400" : "text-red-400")}>{completion.passed ? "Passed" : "Not passed"}</div>
            <p className="text-sm text-muted-foreground">
              {completion.correctCount} of {completion.totalQuestions} correct · pass mark {passMark}%
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setResult(null);
                setAnswers({});
                setCurrent(0);
              }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> Try again
            </Button>
          </div>
        </div>
        <h3 className="font-semibold">Review your answers</h3>
        <div className="space-y-3">
          {results.map((r, i) => (
            <QuestionCard
              key={r.id}
              index={i}
              total={results.length}
              question={r.question}
              options={r.options}
              value={r.answeredIndex}
              review={{ correctIndex: r.correctIndex, correct: r.correct }}
              idPrefix={`review-${module.id}`}
            />
          ))}
        </div>
      </div>
    );
  }

  const setAnswer = (qid: string, idx: number) => setAnswers((a) => ({ ...a, [qid]: idx }));
  const q = questions[Math.min(current, questions.length - 1)];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {answeredCount} of {questions.length} answered · pass mark {passMark}%
        </div>
        <div className="flex items-center gap-2">
          <Switch id={`all-at-once-${module.id}`} checked={allAtOnce} onCheckedChange={setAllAtOnce} />
          <Label htmlFor={`all-at-once-${module.id}`} className="text-sm font-normal">
            Show all questions
          </Label>
        </div>
      </div>
      <Progress value={(answeredCount / questions.length) * 100} className="h-1.5" aria-label="Answered" />

      {allAtOnce ? (
        <div className="space-y-3">
          {questions.map((qq, i) => (
            <QuestionCard
              key={qq.id}
              index={i}
              total={questions.length}
              question={qq.question}
              options={qq.options}
              value={answers[qq.id] ?? null}
              onChange={(idx) => setAnswer(qq.id, idx)}
              idPrefix={`mod-${module.id}`}
            />
          ))}
        </div>
      ) : (
        <>
          <QuestionCard
            index={current}
            total={questions.length}
            question={q.question}
            options={q.options}
            value={answers[q.id] ?? null}
            onChange={(idx) => setAnswer(q.id, idx)}
            idPrefix={`mod-${module.id}`}
          />
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
              <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
            </Button>
            <div className="flex flex-wrap justify-center gap-1">
              {questions.map((qq, i) => (
                <button
                  key={qq.id}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to question ${i + 1}`}
                  aria-current={i === current ? "step" : undefined}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-colors",
                    i === current ? "bg-primary" : answers[qq.id] !== undefined ? "bg-primary/40" : "bg-muted-foreground/30",
                  )}
                />
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))} disabled={current >= questions.length - 1}>
              Next <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-4">
        {!complete && <span className="text-xs text-muted-foreground">Unanswered questions are marked wrong.</span>}
        <Button onClick={() => submit.mutate()} disabled={submit.isPending || answeredCount === 0}>
          {submit.isPending ? "Submitting…" : "Submit assessment"}
        </Button>
      </div>
    </div>
  );
}
