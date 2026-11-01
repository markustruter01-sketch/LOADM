import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Target } from "lucide-react";
import { AIRCRAFT_LABELS, passMarkFor } from "@shared/constants";
import { keys } from "@/lib/keys";
import { EmptyState, PageHeader, QueryState } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ContentList, ContentViewer } from "@/components/training/ContentViewer";
import type { TrainingModuleDetail } from "./types";

export default function TrainingModulePage() {
  const { id } = useParams<{ id: string }>();
  const moduleId = Number(id);
  const q = useQuery<TrainingModuleDetail>({ queryKey: keys.training.module(moduleId), enabled: Number.isFinite(moduleId) });

  const content = useMemo(
    () => [...(q.data?.content ?? [])].filter((c) => c.isActive).sort((a, b) => a.orderIndex - b.orderIndex),
    [q.data],
  );
  const [activeId, setActiveId] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(() => new Set());

  // Reset local progress when switching modules; default to the first item.
  useEffect(() => {
    setCompleted(new Set());
    setActiveId(null);
  }, [moduleId]);
  useEffect(() => {
    if (activeId === null && content.length > 0) setActiveId(content[0].id);
  }, [content, activeId]);

  const markComplete = (cid: number) =>
    setCompleted((prev) => {
      if (prev.has(cid)) return prev;
      const next = new Set(prev);
      next.add(cid);
      return next;
    });

  const activeIndex = content.findIndex((c) => c.id === activeId);
  const active = activeIndex >= 0 ? content[activeIndex] : null;
  const progress = content.length ? Math.round((completed.size / content.length) * 100) : 0;

  return (
    <QueryState query={q} rows={4}>
      {(m) => (
        <div>
          <PageHeader
            backHref="/training"
            eyebrow={m.aircraft ? AIRCRAFT_LABELS[m.aircraft] : "All aircraft"}
            title={m.title}
            description={m.description}
            actions={
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="font-normal capitalize">
                  {m.difficulty}
                </Badge>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden /> {m.durationMinutes} min
                </span>
                <span className="inline-flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" aria-hidden /> Pass mark {passMarkFor(m)}%
                </span>
              </div>
            }
          />

          {(m.objectives.length > 0 || m.topics.length > 0) && (
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              {m.objectives.length > 0 && (
                <Card className="border-border/60 bg-card/60">
                  <CardContent className="p-4">
                    <h2 className="mb-2 text-sm font-semibold">Learning objectives</h2>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {m.objectives.map((o, i) => (
                        <li key={i} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {m.topics.length > 0 && (
                <Card className="border-border/60 bg-card/60">
                  <CardContent className="p-4">
                    <h2 className="mb-2 text-sm font-semibold">Topics</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {m.topics.map((t) => (
                        <Badge key={t} variant="secondary" className="font-normal">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {content.length === 0 ? (
            <EmptyState title="No content yet" description="An instructor has not added content to this module." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
              <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span className="tabular-nums">
                      {completed.size}/{content.length}
                    </span>
                  </div>
                  <Progress value={progress} className="h-1.5" aria-label="Module progress" />
                </div>
                <ContentList items={content} activeId={activeId} completed={completed} onSelect={setActiveId} />
              </aside>
              <div className="min-w-0">
                {active && (
                  <ContentViewer
                    module={m}
                    item={active}
                    isCompleted={completed.has(active.id)}
                    onComplete={() => markComplete(active.id)}
                    hasNext={activeIndex < content.length - 1}
                    onNext={() => {
                      const next = content[activeIndex + 1];
                      if (next) setActiveId(next.id);
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </QueryState>
  );
}
