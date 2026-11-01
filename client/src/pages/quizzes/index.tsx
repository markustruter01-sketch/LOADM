import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Clock, FileQuestion, ListOrdered, RotateCcw, Target, Trophy } from "lucide-react";
import { QUESTION_CATEGORY_LABELS, passMarkFor, type QuestionCategory } from "@shared/constants";
import { keys } from "@/lib/keys";
import { EmptyState, PageHeader, QueryState, ScoreBadge, Section, formatDateTime } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatSeconds } from "@/components/quizzes/Timer";
import type { MyQuizSubmission, QuizListItem } from "./types";

function categoryLabel(c: string): string {
  return QUESTION_CATEGORY_LABELS[c as QuestionCategory] ?? c;
}

function QuizCard({ quiz }: { quiz: QuizListItem }) {
  const passMark = passMarkFor(quiz);
  const best = quiz.myBest;
  return (
    <Card className="flex flex-col border-border/60 bg-card/60 transition-colors hover:border-primary/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base leading-snug">{quiz.title}</CardTitle>
        {quiz.description && <p className="line-clamp-2 text-sm text-muted-foreground">{quiz.description}</p>}
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pb-3">
        <div className="flex flex-wrap gap-1.5">
          {quiz.categories.map((c) => (
            <Badge key={c} variant="secondary" className="font-normal">
              {categoryLabel(c)}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ListOrdered className="h-3.5 w-3.5" aria-hidden /> {quiz.questionCount} questions
          </span>
          <span className="inline-flex items-center gap-1">
            <Target className="h-3.5 w-3.5" aria-hidden /> Pass {passMark}%
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden /> {quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : "Untimed"}
          </span>
          <span className="inline-flex items-center gap-1">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> {quiz.attemptCount} attempt{quiz.attemptCount === 1 ? "" : "s"}
          </span>
        </div>
        {quiz.expiresAt && <p className="text-xs text-amber-400">Closes {formatDateTime(quiz.expiresAt)}</p>}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Trophy className="h-3.5 w-3.5" aria-hidden />
          {best === null ? "No attempts yet" : <>Best <ScoreBadge score={best} passed={best >= passMark} /></>}
        </span>
        <Button asChild size="sm">
          <Link href={`/quizzes/${quiz.id}`}>{best === null ? "Start" : "Retake"}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function MyResults() {
  const q = useQuery<MyQuizSubmission[]>({ queryKey: keys.quizzes.mine });
  return (
    <Section title="My results" description="Every quiz you have submitted, newest first.">
      <QueryState query={q} rows={2} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No results yet" description="Sit a quiz above and your results will appear here." />}>
        {(rows) => (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quiz</TableHead>
                  <TableHead className="w-40">Submitted</TableHead>
                  <TableHead className="w-24 text-right">Correct</TableHead>
                  <TableHead className="w-24 text-right">Time</TableHead>
                  <TableHead className="w-24 text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...rows]
                  .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                  .map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <Link href={`/quizzes/results/${s.id}`} className="hover:text-primary">
                          {s.quizTitle}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(s.submittedAt)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.correctCount}/{s.totalQuestions}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{s.timeSpentSeconds === null ? "—" : formatSeconds(s.timeSpentSeconds)}</TableCell>
                      <TableCell className="text-right">
                        <ScoreBadge score={s.score} passed={s.passed} />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </QueryState>
    </Section>
  );
}

export default function QuizList() {
  const q = useQuery<QuizListItem[]>({ queryKey: keys.quizzes.list() });
  return (
    <div>
      <PageHeader title="Quizzes" description="Questions are drawn at random from the question bank each time you start, so every attempt is different." />
      <Section>
        <QueryState
          query={q}
          rows={3}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState title="No quizzes available" description="Check back when an instructor publishes one." icon={<FileQuestion className="h-8 w-8" />} />}
        >
          {(quizzes) => (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          )}
        </QueryState>
      </Section>
      <MyResults />
    </div>
  );
}
