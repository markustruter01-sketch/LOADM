import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface QuestionReview {
  correctIndex: number;
  correct: boolean;
  explanation?: string | null;
}

/**
 * One multiple-choice question. In "answer" mode the options are radios; when
 * `review` is given the card is read-only and highlights the correct/chosen
 * options.
 */
export function QuestionCard({
  index,
  total,
  question,
  options,
  value,
  onChange,
  review,
  meta,
  idPrefix = "q",
}: {
  index: number;
  total?: number;
  question: string;
  options: string[];
  value: number | null;
  onChange?: (index: number) => void;
  review?: QuestionReview;
  meta?: string;
  idPrefix?: string;
}) {
  const groupName = `${idPrefix}-${index}`;
  return (
    <Card
      className={cn(
        "border-border/60 bg-card/60",
        review && (review.correct ? "border-emerald-500/40" : "border-red-500/40"),
      )}
    >
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Question {index + 1}
            {total ? ` of ${total}` : ""}
            {meta ? ` · ${meta}` : ""}
          </div>
          {review && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold",
                review.correct ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400",
              )}
            >
              {review.correct ? <Check className="h-3 w-3" aria-hidden /> : <X className="h-3 w-3" aria-hidden />}
              {review.correct ? "Correct" : "Incorrect"}
            </span>
          )}
        </div>
        <p className="text-base font-medium leading-snug">{question}</p>

        {review ? (
          <ul className="mt-4 space-y-2">
            {options.map((opt, i) => {
              const isCorrect = i === review.correctIndex;
              const isChosen = i === value;
              return (
                <li
                  key={i}
                  className={cn(
                    "flex items-start gap-3 rounded-md border px-3 py-2 text-sm",
                    isCorrect
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : isChosen
                        ? "border-red-500/50 bg-red-500/10"
                        : "border-border/60",
                  )}
                >
                  <span className="mt-0.5 shrink-0 text-muted-foreground">
                    {isCorrect ? <Check className="h-4 w-4 text-emerald-400" aria-label="Correct answer" /> : isChosen ? <X className="h-4 w-4 text-red-400" aria-label="Your answer" /> : <span className="inline-block h-4 w-4" />}
                  </span>
                  <span>
                    {opt}
                    {isChosen && <span className="ml-2 text-xs text-muted-foreground">(your answer)</span>}
                  </span>
                </li>
              );
            })}
            {value === null || value < 0 ? <li className="text-xs text-muted-foreground">You did not answer this question.</li> : null}
          </ul>
        ) : (
          <RadioGroup
            className="mt-4 gap-2"
            value={value === null ? "" : String(value)}
            onValueChange={(v) => onChange?.(Number(v))}
            aria-label={`Answer for question ${index + 1}`}
          >
            {options.map((opt, i) => {
              const id = `${groupName}-${i}`;
              return (
                <div
                  key={id}
                  className={cn(
                    "flex items-start gap-3 rounded-md border px-3 py-2.5 transition-colors",
                    value === i ? "border-primary/60 bg-primary/10" : "border-border/60 hover:bg-muted/40",
                  )}
                >
                  <RadioGroupItem value={String(i)} id={id} className="mt-0.5" />
                  <Label htmlFor={id} className="cursor-pointer text-sm font-normal leading-snug">
                    {opt}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        )}

        {review?.explanation && (
          <div className="mt-4 rounded-md border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Explanation. </span>
            {review.explanation}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
