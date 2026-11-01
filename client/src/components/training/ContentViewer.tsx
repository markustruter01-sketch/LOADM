import { BookOpen, CheckCircle2, ClipboardCheck, FileQuestion } from "lucide-react";
import type { ModuleContentType } from "@shared/constants";
import type { TrainingModule } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Markdown } from "./Markdown";
import { AssessmentRunner } from "./AssessmentRunner";
import type { ModuleContentItem } from "@/pages/training/types";

export const CONTENT_ICONS: Record<ModuleContentType, typeof BookOpen> = {
  reading: BookOpen,
  quiz: FileQuestion,
  assessment: ClipboardCheck,
};

/** Ordered list of a module's content with completion ticks. */
export function ContentList({
  items,
  activeId,
  completed,
  onSelect,
}: {
  items: ModuleContentItem[];
  activeId: number | null;
  completed: Set<number>;
  onSelect: (id: number) => void;
}) {
  return (
    <ol className="space-y-1" aria-label="Module content">
      {items.map((c, i) => {
        const Icon = CONTENT_ICONS[c.type];
        const done = completed.has(c.id);
        const active = c.id === activeId;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                active ? "bg-primary/15 text-primary" : "hover:bg-muted",
              )}
            >
              <span className="mt-0.5 shrink-0">
                {done ? <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Completed" /> : <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {i + 1}. {c.title}
                </span>
                <span className="text-xs capitalize text-muted-foreground">
                  {c.type} · {c.durationMinutes} min
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Renders one content item according to its type. */
export function ContentViewer({
  module,
  item,
  isCompleted,
  onComplete,
  onNext,
  hasNext,
}: {
  module: Pick<TrainingModule, "id" | "passingThreshold">;
  item: ModuleContentItem;
  isCompleted: boolean;
  onComplete: () => void;
  onNext: () => void;
  hasNext: boolean;
}) {
  const assessable = item.type === "assessment" || item.type === "quiz";

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="pb-3">
        <div className="text-xs font-medium uppercase tracking-wide text-primary">{item.type}</div>
        <CardTitle className="text-xl">{item.title}</CardTitle>
        {item.description && <CardDescription>{item.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {item.type === "reading" &&
          (item.body ? <Markdown source={item.body} className="max-w-prose" /> : <p className="text-sm text-muted-foreground">No reading content yet.</p>)}

        {assessable && <AssessmentRunner key={item.id} module={module} questions={item.questions ?? []} onPassed={onComplete} />}

        {!assessable && (
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-4">
            {!isCompleted && (
              <Button variant="outline" onClick={onComplete}>
                <CheckCircle2 className="h-4 w-4" aria-hidden /> Mark as complete
              </Button>
            )}
            {hasNext && (
              <Button
                onClick={() => {
                  onComplete();
                  onNext();
                }}
              >
                Next
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
