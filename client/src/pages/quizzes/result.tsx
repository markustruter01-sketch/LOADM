import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { passMarkFor } from "@shared/constants";
import { keys } from "@/lib/keys";
import { PageHeader, QueryState, formatDateTime } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { QuestionCard } from "@/components/quizzes/QuestionCard";
import { ScoreRing } from "@/components/quizzes/ScoreRing";
import { formatSeconds } from "@/components/quizzes/Timer";
import { cn } from "@/lib/utils";
import type { QuizSubmissionDetail } from "./types";

export default function QuizResult() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const sid = Number(submissionId);
  const q = useQuery<QuizSubmissionDetail>({ queryKey: keys.quizzes.submission(sid), enabled: Number.isFinite(sid) });
  const [onlyWrong, setOnlyWrong] = useState(false);

  return (
    <QueryState query={q} rows={4}>
      {({ submission, results, quiz }) => {
        const passMark = passMarkFor(quiz);
        const shown = onlyWrong ? results.filter((r) => !r.correct) : results;
        return (
          <div className="mx-auto max-w-3xl">
            <PageHeader
              backHref="/quizzes"
              eyebrow="Quiz result"
              title={quiz.title}
              description={`Submitted ${formatDateTime(submission.submittedAt)}`}
              actions={
                <>
                  <Button asChild variant="outline">
                    <Link href="/quizzes">Back to quizzes</Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/quizzes/${quiz.id}`}>
                      <RotateCcw className="h-4 w-4" aria-hidden /> Retake
                    </Link>
                  </Button>
                </>
              }
            />

            <Card className={cn("mb-6", submission.passed ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5")}>
              <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row">
                <ScoreRing score={submission.score} passed={submission.passed} label={`pass ${passMark}%`} />
                <div className="text-center sm:text-left">
                  <div className={cn("flex items-center justify-center gap-2 text-2xl font-semibold sm:justify-start", submission.passed ? "text-emerald-400" : "text-red-400")}>
                    {submission.passed ? <CheckCircle2 className="h-6 w-6" aria-hidden /> : <XCircle className="h-6 w-6" aria-hidden />}
                    {submission.passed ? "Passed" : "Not passed"}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {submission.correctCount} of {submission.totalQuestions} correct
                    {submission.timeSpentSeconds !== null && <> · {formatSeconds(submission.timeSpentSeconds)} taken</>}
                  </p>
                  {!submission.passed && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      You needed {passMark}%. Review the explanations below, then try again with a fresh set of questions.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Question review</h2>
              <div className="flex items-center gap-2">
                <Switch id="only-wrong" checked={onlyWrong} onCheckedChange={setOnlyWrong} />
                <Label htmlFor="only-wrong" className="text-sm font-normal">
                  Incorrect only
                </Label>
              </div>
            </div>
            {shown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Every answer was correct.</p>
            ) : (
              <div className="space-y-3">
                {shown.map((r) => (
                  <QuestionCard
                    key={r.questionId}
                    index={results.indexOf(r)}
                    total={results.length}
                    question={r.questionText}
                    options={r.options}
                    value={r.answeredIndex}
                    review={{ correctIndex: r.correctIndex, correct: r.correct, explanation: r.explanation }}
                    idPrefix={`result-${submission.id}`}
                  />
                ))}
              </div>
            )}
          </div>
        );
      }}
    </QueryState>
  );
}
