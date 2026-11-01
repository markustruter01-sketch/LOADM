import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { QUESTION_CATEGORY_LABELS, passMarkFor } from "@shared/constants";
import { post } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { ErrorState, LoadingState, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionCard } from "@/components/quizzes/QuestionCard";
import { Countdown, Stopwatch } from "@/components/quizzes/Timer";
import { cn } from "@/lib/utils";
import type { AttemptStart, QuizSubmitResponse } from "./types";

export default function QuizTake() {
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const started = useRef(false);
  const submitting = useRef(false);

  const start = useMutation({
    mutationFn: () => post<AttemptStart>(`/api/quizzes/${quizId}/attempts`),
    onSuccess: () => setStartedAt(Date.now()),
  });

  // Start exactly one attempt per mount (guards StrictMode double effects).
  useEffect(() => {
    if (started.current || !Number.isFinite(quizId)) return;
    started.current = true;
    start.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const data = start.data;

  const submit = useMutation({
    mutationFn: () => {
      if (!data) throw new Error("No attempt in progress");
      return post<QuizSubmitResponse>(`/api/quizzes/${quizId}/submit`, {
        attemptId: data.attempt.id,
        answers: data.questions.map((q) => ({ questionId: q.id, answeredIndex: answers[q.id] ?? -1 })),
        timeSpentSeconds: startedAt === null ? undefined : Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
      });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: keys.quizzes.all });
      qc.invalidateQueries({ queryKey: keys.quizzes.list() });
      qc.invalidateQueries({ queryKey: keys.quizzes.mine });
      qc.invalidateQueries({ queryKey: keys.users.me });
      navigate(`/quizzes/results/${res.submission.id}`);
    },
    onError: (e: Error) => {
      submitting.current = false;
      toast({ variant: "destructive", title: "Could not submit quiz", description: e.message });
    },
  });

  const doSubmit = useCallback(() => {
    if (submitting.current) return;
    submitting.current = true;
    submit.mutate();
  }, [submit]);

  const inProgress = !!data && !submit.isSuccess;

  // Warn before leaving the page mid-quiz.
  useEffect(() => {
    if (!inProgress) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [inProgress]);

  if (start.isError) {
    return (
      <div>
        <PageHeader title="Quiz" backHref="/quizzes" />
        <ErrorState error={start.error} />
        <div className="mt-4 text-center">
          <Button asChild variant="outline">
            <Link href="/quizzes">Back to quizzes</Link>
          </Button>
        </div>
      </div>
    );
  }
  if (!data) return <LoadingState rows={4} />;

  const { quiz, questions } = data;
  const total = questions.length;
  const answered = questions.filter((q) => answers[q.id] !== undefined).length;
  const q = questions[Math.min(current, total - 1)];

  const timer = quiz.timeLimitMinutes ? (
    <Countdown
      startedAt={startedAt}
      limitSeconds={quiz.timeLimitMinutes * 60}
      onExpire={() => {
        toast({ title: "Time is up", description: "Your answers have been submitted." });
        doSubmit();
      }}
    />
  ) : (
    <Stopwatch startedAt={startedAt} />
  );

  if (total === 0) {
    return (
      <div>
        <PageHeader title={quiz.title} backHref="/quizzes" />
        <ErrorState error={new Error("This quiz has no questions available.")} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={quiz.title} description={`${total} questions · pass mark ${passMarkFor(quiz)}%`} actions={timer} />

      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>
            {answered} of {total} answered
          </span>
          <span>{reviewing ? "Review" : `Question ${current + 1}`}</span>
        </div>
        <Progress value={(answered / total) * 100} className="h-1.5" aria-label="Quiz progress" />
      </div>

      <nav className="mb-4 flex flex-wrap gap-1.5" aria-label="Question navigator">
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            type="button"
            onClick={() => {
              setReviewing(false);
              setCurrent(i);
            }}
            aria-label={`Question ${i + 1}${answers[qq.id] !== undefined ? ", answered" : ""}`}
            aria-current={!reviewing && i === current ? "step" : undefined}
            className={cn(
              "h-8 w-8 rounded-md border text-xs font-medium tabular-nums transition-colors",
              !reviewing && i === current
                ? "border-primary bg-primary text-primary-foreground"
                : answers[qq.id] !== undefined
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted",
            )}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      {reviewing ? (
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-5">
            <h2 className="mb-1 text-lg font-semibold">Review your answers</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {answered === total ? "All questions answered." : `${total - answered} question${total - answered === 1 ? " is" : "s are"} unanswered and will be marked wrong.`}
            </p>
            <ol className="divide-y divide-border/60">
              {questions.map((qq, i) => {
                const a = answers[qq.id];
                return (
                  <li key={qq.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0 text-sm">
                      <div className="truncate font-medium">
                        {i + 1}. {qq.questionText}
                      </div>
                      <div className={cn("truncate text-xs", a === undefined ? "text-amber-400" : "text-muted-foreground")}>
                        {a === undefined ? "Not answered" : qq.options[a]}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => {
                        setReviewing(false);
                        setCurrent(i);
                      }}
                    >
                      Change
                    </Button>
                  </li>
                );
              })}
            </ol>
            <div className="mt-5 flex justify-between gap-2">
              <Button variant="outline" onClick={() => setReviewing(false)}>
                <ChevronLeft className="h-4 w-4" aria-hidden /> Back
              </Button>
              <Button onClick={doSubmit} disabled={submit.isPending || submit.isSuccess}>
                <Send className="h-4 w-4" aria-hidden /> {submit.isPending ? "Submitting…" : "Submit quiz"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <QuestionCard
            index={current}
            total={total}
            question={q.questionText}
            options={q.options}
            meta={QUESTION_CATEGORY_LABELS[q.category]}
            value={answers[q.id] ?? null}
            onChange={(idx) => setAnswers((a) => ({ ...a, [q.id]: idx }))}
            idPrefix={`quiz-${quizId}`}
          />
          <div className="mt-4 flex items-center justify-between gap-2">
            <Button variant="outline" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
              <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
            </Button>
            {current < total - 1 ? (
              <Button onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}>
                Next <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            ) : (
              <Button onClick={() => setReviewing(true)}>Review answers</Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
