import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { AIRCRAFT_LABELS, SUBMISSION_TYPES, passMarkFor, type SubmissionType } from "@shared/constants";
import { post } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, QueryState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Stopwatch } from "@/components/quizzes/Timer";
import { cn } from "@/lib/utils";
import type { ScenarioForStudent, ScenarioSubmitResponse, StudentScenarioQuestion } from "./types";

type AnswerState = Record<string, { answer: string; notes: string; showNotes: boolean }>;

const TYPE_LABELS: Record<SubmissionType, string> = { training: "Training (practice)", assessment: "Assessment" };

function ScenarioQuestionField({
  q,
  index,
  value,
  onChange,
}: {
  q: StudentScenarioQuestion;
  index: number;
  value: AnswerState[string] | undefined;
  onChange: (patch: Partial<AnswerState[string]>) => void;
}) {
  const answer = value?.answer ?? "";
  const answerId = `sq-${q.id}`;
  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="space-y-3 p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Question {index + 1} · {q.questionType === "multiple-choice" ? "Multiple choice" : "Written answer"}
        </div>
        <p className="whitespace-pre-line font-medium leading-snug">{q.question}</p>
        {q.questionType === "multiple-choice" ? (
          <RadioGroup value={answer} onValueChange={(v) => onChange({ answer: v })} className="gap-2" aria-label={`Answer for question ${index + 1}`}>
            {q.options.map((opt, i) => {
              const id = `${answerId}-${i}`;
              return (
                <div key={id} className={cn("flex items-start gap-3 rounded-md border px-3 py-2.5", answer === opt ? "border-primary/60 bg-primary/10" : "border-border/60 hover:bg-muted/40")}>
                  <RadioGroupItem value={opt} id={id} className="mt-0.5" />
                  <Label htmlFor={id} className="cursor-pointer text-sm font-normal leading-snug">
                    {opt}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor={answerId}>Your answer</Label>
            <Textarea id={answerId} rows={5} value={answer} onChange={(e) => onChange({ answer: e.target.value })} placeholder="Explain your reasoning and show any calculations." />
          </div>
        )}
        {value?.showNotes ? (
          <div className="space-y-1.5">
            <Label htmlFor={`${answerId}-notes`}>Notes for the instructor (optional)</Label>
            <Textarea id={`${answerId}-notes`} rows={2} value={value.notes} onChange={(e) => onChange({ notes: e.target.value })} />
          </div>
        ) : (
          <Button type="button" variant="link" size="sm" className="h-auto px-0 text-xs" onClick={() => onChange({ showNotes: true })}>
            Add a note
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function ScenarioTake() {
  const { id } = useParams<{ id: string }>();
  const scenarioId = Number(id);
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery<ScenarioForStudent>({ queryKey: keys.scenarios.one(scenarioId), enabled: Number.isFinite(scenarioId) });

  const [answers, setAnswers] = useState<AnswerState>({});
  const [submissionType, setSubmissionType] = useState<SubmissionType>("assessment");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    if (q.data && startedAt === null) setStartedAt(Date.now());
  }, [q.data, startedAt]);

  const submit = useMutation({
    mutationFn: (scenario: ScenarioForStudent) =>
      post<ScenarioSubmitResponse>(`/api/scenarios/${scenarioId}/submissions`, {
        scenarioId,
        submissionType,
        timeSpentSeconds: startedAt === null ? undefined : Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
        answers: scenario.questions.map((qq) => {
          const a = answers[qq.id];
          const notes = a?.notes.trim();
          return notes ? { questionId: qq.id, answer: a?.answer ?? "", notes } : { questionId: qq.id, answer: a?.answer ?? "" };
        }),
      }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: keys.scenarios.all });
      qc.invalidateQueries({ queryKey: keys.scenarios.submissions() });
      qc.invalidateQueries({ queryKey: keys.users.me });
      toast({ title: "Scenario submitted", description: "An instructor will review your answers." });
      navigate(`/scenarios/results/${row.id}`);
    },
    onError: (e: Error) => {
      submitting.current = false;
      toast({ variant: "destructive", title: "Could not submit scenario", description: e.message });
    },
  });

  const dirty = Object.values(answers).some((a) => a.answer.trim() !== "");
  useEffect(() => {
    if (!dirty || submit.isSuccess) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, submit.isSuccess]);

  return (
    <QueryState query={q} rows={4}>
      {(s) => {
        const answered = s.questions.filter((qq) => (answers[qq.id]?.answer ?? "").trim() !== "").length;
        const total = s.questions.length;
        return (
          <div className="mx-auto max-w-3xl">
            <PageHeader
              backHref="/scenarios"
              eyebrow={s.aircraft ? AIRCRAFT_LABELS[s.aircraft] : "Scenario"}
              title={s.title}
              description={`${total} question${total === 1 ? "" : "s"} · pass mark ${passMarkFor(s)}%`}
              actions={<Stopwatch startedAt={startedAt} />}
            />

            <Card className="mb-5 border-border/60 bg-card/60">
              <CardContent className="p-5">
                <h2 className="mb-2 text-sm font-semibold">Situation</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{s.description}</p>
              </CardContent>
            </Card>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Submission type</div>
                <ToggleGroup
                  type="single"
                  value={submissionType}
                  onValueChange={(v) => {
                    if (v) setSubmissionType(v as SubmissionType);
                  }}
                  aria-label="Submission type"
                >
                  {SUBMISSION_TYPES.map((t) => (
                    <ToggleGroupItem key={t} value={t} className="h-8 px-3 text-xs">
                      {TYPE_LABELS[t]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <div className="w-full sm:w-48">
                <div className="mb-1 text-right text-xs text-muted-foreground">
                  {answered} of {total} answered
                </div>
                <Progress value={total ? (answered / total) * 100 : 0} className="h-1.5" aria-label="Answered" />
              </div>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (submitting.current) return;
                submitting.current = true;
                submit.mutate(s);
              }}
            >
              {s.questions.map((qq, i) => (
                <ScenarioQuestionField
                  key={qq.id}
                  q={qq}
                  index={i}
                  value={answers[qq.id]}
                  onChange={(patch) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [qq.id]: { answer: "", notes: "", showNotes: false, ...prev[qq.id], ...patch },
                    }))
                  }
                />
              ))}
              <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-4">
                {answered < total && <span className="text-xs text-muted-foreground">{total - answered} unanswered</span>}
                <Button type="submit" disabled={submit.isPending || submit.isSuccess || answered === 0}>
                  <Send className="h-4 w-4" aria-hidden /> {submit.isPending ? "Submitting…" : "Submit for review"}
                </Button>
              </div>
            </form>
          </div>
        );
      }}
    </QueryState>
  );
}
