import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Check, X } from "lucide-react";
import { SQUADRON_LABELS, passMarkFor } from "@shared/constants";
import type { ScenarioQuestion } from "@shared/schema";
import { keys } from "@/lib/keys";
import { patch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, QueryState, StatCard, ScoreBadge, formatDateTime } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { personName, StatusBadge } from "@/components/instructor/shared";
import { cn } from "@/lib/utils";
import type { ReviewBody, ScenarioSubmissionDetail } from "../types";

type Mark = "correct" | "incorrect" | "";

function MarkingForm({ submission }: { submission: ScenarioSubmissionDetail }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const questions = submission.scenario.questions;
  const passMark = passMarkFor(submission.scenario);

  // Pre-filled from an earlier review so it can be re-marked. The parent keys
  // this component by submission id, so a refetch never resets edits.
  const [marks, setMarks] = useState<Record<string, Mark>>(() => {
    const m: Record<string, Mark> = {};
    for (const q of questions) {
      const v = submission.markedAnswers?.[q.id];
      m[q.id] = v === undefined ? "" : v ? "correct" : "incorrect";
    }
    return m;
  });
  const [feedback, setFeedback] = useState<Record<string, string>>(() => ({ ...(submission.questionFeedback ?? {}) }));
  const [overall, setOverall] = useState(() => submission.instructorFeedback ?? "");

  const answerFor = (q: ScenarioQuestion) => submission.answers.find((a) => a.questionId === q.id);

  const { correct, marked } = useMemo(() => {
    let c = 0;
    let m = 0;
    for (const q of questions) {
      const v = marks[q.id];
      if (v) m++;
      if (v === "correct") c++;
    }
    return { correct: c, marked: m };
  }, [marks, questions]);
  const total = questions.length;
  const liveScore = total ? Math.round((correct / total) * 100) : 0;

  const review = useMutation({
    mutationFn: (body: ReviewBody) => patch<ScenarioSubmissionDetail>(`/api/scenarios/submissions/${submission.id}/review`, body),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: keys.scenarios.all });
      qc.invalidateQueries({ queryKey: keys.analytics.all });
      qc.invalidateQueries({ queryKey: keys.personnel.all });
      toast({ title: "Review submitted", description: `${personName(submission.user)} scored ${updated.score ?? liveScore}% (${updated.passed ? "pass" : "fail"}).` });
      navigate("/instructor/reviews");
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not submit review", description: e.message }),
  });

  const submit = () => {
    const markedAnswers: Record<string, boolean> = {};
    for (const q of questions) markedAnswers[q.id] = marks[q.id] === "correct";
    const questionFeedback: Record<string, string> = {};
    for (const [id, text] of Object.entries(feedback)) if (text.trim()) questionFeedback[id] = text.trim();
    review.mutate({ markedAnswers, questionFeedback, instructorFeedback: overall.trim() || undefined });
  };

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Marked" value={`${marked} / ${total}`} hint="Unmarked questions count as incorrect" />
        <StatCard label="Running score" value={`${liveScore}%`} tone={liveScore >= passMark ? "good" : "bad"} hint={`Pass mark ${passMark}%`} />
        <StatCard label="Outcome" value={liveScore >= passMark ? "Pass" : "Fail"} tone={liveScore >= passMark ? "good" : "bad"} hint="Computed server-side on submit" />
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const a = answerFor(q);
          const mark = marks[q.id] ?? "";
          return (
            <Card key={q.id} className={cn("border-border/60 bg-card/60", mark === "correct" && "border-emerald-500/40", mark === "incorrect" && "border-red-500/40")}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base leading-snug">
                    <span className="mr-2 text-muted-foreground">Q{i + 1}.</span>
                    {q.question}
                  </CardTitle>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {q.questionType.replace("-", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-border/60 bg-background/40 p-3">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Student&apos;s answer</div>
                    <p className="whitespace-pre-wrap text-sm">{a?.answer?.trim() ? a.answer : <span className="italic text-muted-foreground">No answer</span>}</p>
                    {a?.notes && (
                      <p className="mt-2 border-t border-border/60 pt-2 text-xs text-muted-foreground">
                        <span className="font-medium">Notes:</span> {a.notes}
                      </p>
                    )}
                  </div>
                  <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">Model answer</div>
                    <p className="whitespace-pre-wrap text-sm">{q.correctAnswer || <span className="italic text-muted-foreground">Not provided</span>}</p>
                    {q.questionType === "multiple-choice" && q.options.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                        {q.options.map((o) => (
                          <li key={o} className={cn(o === q.correctAnswer && "font-medium text-foreground")}>
                            • {o}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div>
                    <Label className="mb-1 block text-xs">Mark</Label>
                    <ToggleGroup type="single" value={mark} onValueChange={(v) => setMarks((m) => ({ ...m, [q.id]: (v as Mark) || "" }))} aria-label={`Mark question ${i + 1}`}>
                      <ToggleGroupItem value="correct" aria-label="Correct" className="data-[state=on]:bg-emerald-500 data-[state=on]:border-emerald-500">
                        <Check className="h-4 w-4" /> Correct
                      </ToggleGroupItem>
                      <ToggleGroupItem value="incorrect" aria-label="Incorrect" className="data-[state=on]:bg-red-500 data-[state=on]:border-red-500">
                        <X className="h-4 w-4" /> Incorrect
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`fb-${q.id}`} className="mb-1 block text-xs">
                      Feedback (optional)
                    </Label>
                    <Textarea id={`fb-${q.id}`} rows={2} value={feedback[q.id] ?? ""} onChange={(e) => setFeedback((f) => ({ ...f, [q.id]: e.target.value }))} placeholder="Why this mark, or what to revise" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 border-border/60 bg-card/60">
        <CardContent className="space-y-3 p-4">
          <div>
            <Label htmlFor="overall-feedback">Overall feedback</Label>
            <Textarea id="overall-feedback" rows={4} className="mt-1" value={overall} onChange={(e) => setOverall(e.target.value)} placeholder="Summary for the student" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {marked < total ? `${total - marked} question${total - marked === 1 ? "" : "s"} unmarked — they will be recorded as incorrect.` : "All questions marked."}
            </p>
            <Button onClick={submit} disabled={review.isPending}>
              {review.isPending ? "Submitting…" : submission.status === "reviewed" ? "Re-submit review" : "Submit review"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default function ReviewSubmission() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const id = Number(submissionId);
  const q = useQuery<ScenarioSubmissionDetail>({ queryKey: keys.scenarios.submission(id), enabled: Number.isFinite(id) });

  return (
    <>
      <PageHeader
        backHref="/instructor/reviews"
        eyebrow="Scenario review"
        title={q.data ? q.data.scenario.title : "Review submission"}
        description={
          q.data ? (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                {personName(q.data.user)} · {SQUADRON_LABELS[q.data.squadron]}
              </span>
              <span>Submitted {formatDateTime(q.data.submittedAt)}</span>
              <StatusBadge status={q.data.status} />
              {q.data.status === "reviewed" && (
                <span className="flex items-center gap-1">
                  <ScoreBadge score={q.data.score} passed={q.data.passed} />
                  {q.data.reviewer && <span>by {personName(q.data.reviewer)}</span>}
                </span>
              )}
            </span>
          ) : undefined
        }
      />
      <QueryState query={q}>{(data) => <MarkingForm key={data.id} submission={data} />}</QueryState>
    </>
  );
}
