import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Lock, PartyPopper, RotateCcw } from "lucide-react";
import type { ChecklistItem } from "@shared/schema";
import { put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, QueryState, Spinner } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ChecklistItemsList } from "@/components/checklists/ChecklistItems";
import { CHECKLIST_CATEGORY_LABELS, aircraftName } from "@/components/checklists/labels";
import type { ChecklistListItem, ChecklistProgress } from "./types";

const SAVE_DEBOUNCE_MS = 400;

export default function ChecklistRun() {
  const { id } = useParams<{ id: string }>();
  const checklistId = Number(id);
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery<ChecklistListItem>({ queryKey: keys.checklists.one(checklistId), enabled: Number.isFinite(checklistId) });

  const items = useMemo(() => [...(q.data?.items ?? [])].sort((a, b) => a.itemOrder - b.itemOrder), [q.data]);
  const [completedIds, setCompletedIds] = useState<number[] | null>(null);
  const [saving, setSaving] = useState(false);
  const timer = useRef<number | null>(null);
  const pending = useRef<number[] | null>(null);

  // Seed local state from the server once per checklist.
  useEffect(() => {
    setCompletedIds(null);
  }, [checklistId]);
  useEffect(() => {
    if (q.data && completedIds === null) setCompletedIds(q.data.myProgress?.completedItemIds ?? []);
  }, [q.data, completedIds]);

  const save = useCallback(
    async (ids: number[]) => {
      setSaving(true);
      try {
        const progress = await put<ChecklistProgress>(`/api/checklists/${checklistId}/progress`, { completedItemIds: ids });
        qc.setQueryData<ChecklistListItem>(keys.checklists.one(checklistId), (old) => (old ? { ...old, myProgress: progress } : old));
        qc.invalidateQueries({ queryKey: keys.checklists.list });
        qc.invalidateQueries({ queryKey: keys.checklists.mine });
      } catch (e) {
        toast({ variant: "destructive", title: "Progress not saved", description: e instanceof Error ? e.message : "Try again." });
        const fresh = await q.refetch();
        setCompletedIds(fresh.data?.myProgress?.completedItemIds ?? []);
      } finally {
        setSaving(false);
      }
    },
    [checklistId, qc, toast, q],
  );

  const flush = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (pending.current) {
      const ids = pending.current;
      pending.current = null;
      void save(ids);
    }
  }, [save]);

  const schedule = (ids: number[]) => {
    pending.current = ids;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, SAVE_DEBOUNCE_MS);
  };

  // Send any unsaved change when leaving the page.
  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(() => () => flushRef.current(), []);

  const completed = useMemo(() => new Set(completedIds ?? []), [completedIds]);
  const linear = q.data?.enforceLinearProgression ?? false;
  const prefixLength = useMemo(() => {
    let i = 0;
    while (i < items.length && completed.has(items[i].id)) i++;
    return i;
  }, [items, completed]);

  const isEnabled = (item: ChecklistItem) => {
    if (!linear) return true;
    const idx = items.findIndex((i) => i.id === item.id);
    // The next item can be ticked; the last ticked one can be unticked.
    return idx === prefixLength || idx === prefixLength - 1;
  };

  const onToggle = (item: ChecklistItem, checked: boolean) => {
    const next = new Set(completed);
    if (checked) next.add(item.id);
    else if (linear) {
      // Unticking in linear mode drops this item and everything after it.
      const idx = items.findIndex((i) => i.id === item.id);
      items.slice(idx).forEach((i) => next.delete(i.id));
    } else next.delete(item.id);
    const ids = items.filter((i) => next.has(i.id)).map((i) => i.id);
    setCompletedIds(ids);
    schedule(ids);
  };

  const reset = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    pending.current = null;
    setCompletedIds([]);
    void save([]);
  };

  return (
    <QueryState query={q} rows={5}>
      {(c) => {
        const total = items.length;
        const done = items.filter((i) => completed.has(i.id)).length;
        const pct = total ? Math.round((done / total) * 100) : 0;
        const requiredDone = items.filter((i) => i.isRequired).every((i) => completed.has(i.id));
        const isComplete = total > 0 && requiredDone;
        return (
          <div className="mx-auto max-w-3xl">
            <PageHeader
              backHref="/checklists"
              eyebrow={`${aircraftName(c.aircraftType)} · ${CHECKLIST_CATEGORY_LABELS[c.category]}`}
              title={c.title}
              description={c.description ?? undefined}
              actions={
                <ConfirmDialog
                  title="Reset this checklist?"
                  description="All ticked items will be cleared."
                  confirmLabel="Reset"
                  onConfirm={reset}
                  trigger={
                    <Button variant="outline" size="sm" disabled={done === 0}>
                      <RotateCcw className="h-4 w-4" aria-hidden /> Reset
                    </Button>
                  }
                />
              }
            />

            <div className="sticky top-16 z-10 -mx-4 mb-5 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {done} of {total} complete · {pct}%
                </span>
                <span className="inline-flex items-center gap-1.5">
                  {linear && (
                    <span className="inline-flex items-center gap-1">
                      <Lock className="h-3 w-3" aria-hidden /> In order
                    </span>
                  )}
                  {saving ? (
                    <span className="inline-flex items-center gap-1">
                      <Spinner className="h-3 w-3" /> Saving
                    </span>
                  ) : (
                    completedIds !== null && <span>Saved</span>
                  )}
                </span>
              </div>
              <Progress value={pct} className="h-2" aria-label="Checklist progress" />
            </div>

            {isComplete && (
              <Card className="mb-5 border-emerald-500/40 bg-emerald-500/5">
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
                  <PartyPopper className="h-10 w-10 shrink-0 text-emerald-400" aria-hidden />
                  <div className="flex-1">
                    <div className="flex items-center justify-center gap-1.5 text-lg font-semibold text-emerald-400 sm:justify-start">
                      <CheckCircle2 className="h-5 w-5" aria-hidden /> Checklist complete
                    </div>
                    <p className="text-sm text-muted-foreground">
                      All required items are done{done < total ? `; ${total - done} optional item${total - done === 1 ? "" : "s"} left` : ""}.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/checklists">Back to checklists</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {completedIds === null ? null : <ChecklistItemsList items={items} completed={completed} isEnabled={isEnabled} onToggle={onToggle} />}
          </div>
        );
      }}
    </QueryState>
  );
}
