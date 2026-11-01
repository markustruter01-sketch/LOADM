import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Check, CheckCircle2, Hourglass, MessageSquare, X, XCircle } from "lucide-react";
import { passMarkFor } from "@shared/constants";
import { keys } from "@/lib/keys";
import { usePersona } from "@/lib/persona";
import { PageHeader, QueryState, formatDateTime } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/quizzes/ScoreRing";
import { formatSeconds } from "@/components/quizzes/Timer";
import { cn } from "@/lib/utils";
import type { ScenarioSubmissionDetail } from "./types";

function AnswerBlock({ label, text, tone }: { label: string; text: string; tone?: "model" }) {
  return (
    <div className={cn("rounded-md border px-3 py-2", tone === "model" ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/60 bg-muted/20")}>
      <div className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <p className="whitespace-pre-line text-sm">{text || <span className="text-muted-foreground">No answer given</span>}</p>
    </div>
  );
}

export default function ScenarioResult() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const sid = Number(submissionId);
  const { can, user: me } = usePersona();
  const q = useQuery<ScenarioSubmissionDetail>({ queryKey: keys.scenarios.submission(sid), enabled: Number.isFinite(sid) });

  return (
    <QueryState query={q} rows={4}>
      {(sub) => {
        const reviewed = sub.status === "reviewed";
        const passMark = passMarkFor(sub.scenario);
        const answersById = new Map(sub.answers.map((a) => [a.questionId, a]));
        const isOwn = me?.id === sub.userId;
        return (
          <div className="mx-auto max-w-3xl">
            <PageHeader
              backHref="/scenarios"
              eyebrow={`Scenario ${sub.submissionType}`}
              title={sub.scenario.title}
              description={
                <>
                  {!isOwn && (
                    <>
                      {sub.user.rank} {sub.user.firstName} {sub.user.lastName} ·{" "}
                    </>
                  )}
                  Submitted {formatDateTime(sub.submittedAt)}
                  {sub.timeSpentSeconds !== null && <> · {formatSeconds(sub.timeSpentSeconds)} taken</>}
                </>
              }
              actions={
                <>
                  {can("instruct") && !reviewed && (
                    <Button asChild>
                      <Link href={`/instructor/reviews/${sub.id}`}>Review now</Link>
                    </Button>
                  )}
                  <Button asChild variant="outline">
                    <Link href="/scenarios">Back to scenarios</Link>
                  </Button>
                </>
              }
            />

            {reviewed ? (
              <Card className={cn("mb-6", sub.passed ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5")}>
                <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row">
                  <ScoreRing score={sub.score ?? 0} passed={sub.passed} label={`pass ${passMark}%`} />
                  <div className="text-center sm:text-left">
                    <div className={cn("flex items-center justify-center gap-2 text-2xl font-semibold sm:justify-start", sub.passed ? "text-emerald-400" : "text-red-400")}>
                      {sub.passed ? <CheckCircle2 className="h-6 w-6" aria-hidden /> : <XCircle className="h-6 w-6" aria-hidden />}
                      {sub.passed ? "Passed" : "Not passed"}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Reviewed by {sub.reviewer ? `${sub.reviewer.rank} ${sub.reviewer.firstName} ${sub.reviewer.lastName}` : "an instructor"} on {formatDateTime(sub.reviewedAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6 border-amber-500/40 bg-amber-500/5">
                <CardContent className="flex items-start gap-3 p-5">
                  <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
                  <div>
                    <div className="font-semibold text-amber-400">Awaiting instructor review</div>
                    <p className="text-sm text-muted-foreground">
                      Your answers are below. You will see a notification on your dashboard once an instructor has marked them.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {reviewed && sub.instructorFeedback && (
              <Card className="mb-6 border-border/60 bg-card/60">
                <CardContent className="flex gap-3 p-5">
                  <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <div className="mb-1 text-sm font-semibold">Instructor feedback</div>
                    <p className="whitespace-pre-line text-sm text-foreground/90">{sub.instructorFeedback}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <h2 className="mb-3 text-lg font-semibold">{reviewed ? "Marked answers" : "Your answers"}</h2>
            <div className="space-y-3">
              {sub.scenario.questions.map((qq, i) => {
                const a = answersById.get(qq.id);
                const mark = reviewed ? sub.markedAnswers?.[qq.id] ?? false : undefined;
                const feedback = sub.questionFeedback?.[qq.id];
                return (
                  <Card key={qq.id} className={cn("border-border/60 bg-card/60", mark === true && "border-emerald-500/40", mark === false && "border-red-500/40")}>
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Question {i + 1}</div>
                        {mark !== undefined && (
                          <Badge variant="outline" className={cn("gap-1 font-normal", mark ? "border-emerald-500/50 text-emerald-400" : "border-red-500/50 text-red-400")}>
                            {mark ? <Check className="h-3 w-3" aria-hidden /> : <X className="h-3 w-3" aria-hidden />}
                            {mark ? "Correct" : "Incorrect"}
                          </Badge>
                        )}
                      </div>
                      <p className="whitespace-pre-line font-medium leading-snug">{qq.question}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <AnswerBlock label="Your answer" text={a?.answer ?? ""} />
                        {qq.correctAnswer ? <AnswerBlock label="Model answer" text={qq.correctAnswer} tone="model" /> : null}
                      </div>
                      {a?.notes && <p className="text-xs text-muted-foreground">Your note: {a.notes}</p>}
                      {feedback && (
                        <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                          <span className="font-medium text-primary">Feedback. </span>
                          {feedback}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      }}
    </QueryState>
  );
}
