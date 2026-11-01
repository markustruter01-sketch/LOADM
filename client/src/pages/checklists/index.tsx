import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ListChecks, Lock } from "lucide-react";
import { CHECKLIST_AIRCRAFT, CHECKLIST_CATEGORIES } from "@shared/constants";
import { keys } from "@/lib/keys";
import { CHECKLIST_CATEGORY_LABELS, aircraftName } from "@/components/checklists/labels";
import { EmptyState, PageHeader, QueryState, Section, relativeTime } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ChecklistListItem } from "./types";

const ALL = "all";

function ChecklistCard({ c }: { c: ChecklistListItem }) {
  const total = c.items.length;
  const done = c.myProgress ? c.myProgress.completedItemIds.filter((id) => c.items.some((i) => i.id === id)).length : 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const complete = c.myProgress?.isComplete ?? false;
  return (
    <Card className={cn("flex flex-col border-border/60 bg-card/60 transition-colors hover:border-primary/50", complete && "border-emerald-500/30")}>
      <CardHeader className="pb-2">
        <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{aircraftName(c.aircraftType)}</span>
          {c.enforceLinearProgression && (
            <span className="inline-flex items-center gap-1" title="Items must be completed in order">
              <Lock className="h-3 w-3" aria-hidden /> In order
            </span>
          )}
        </div>
        <CardTitle className="text-base leading-snug">{c.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        {c.description && <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>
            {done}/{total} items
          </span>
          {c.myProgress && <span>{relativeTime(c.myProgress.updatedAt)}</span>}
        </div>
        <Progress value={pct} className="h-1.5" aria-label={`${pct}% complete`} />
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-border/60 pt-3">
        {complete ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Complete
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{done > 0 ? "In progress" : "Not started"}</span>
        )}
        <Button asChild size="sm" variant={done > 0 && !complete ? "default" : "outline"}>
          <Link href={`/checklists/${c.id}`}>{done > 0 && !complete ? "Continue" : "Open"}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ChecklistList() {
  const q = useQuery<ChecklistListItem[]>({ queryKey: keys.checklists.list });
  const [aircraft, setAircraft] = useState<string>(ALL);

  const grouped = useMemo(() => {
    const rows = (q.data ?? []).filter((c) => aircraft === ALL || c.aircraftType === aircraft);
    return CHECKLIST_CATEGORIES.map((cat) => ({ cat, items: rows.filter((c) => c.category === cat) })).filter((g) => g.items.length > 0);
  }, [q.data, aircraft]);

  return (
    <div>
      <PageHeader
        title="Checklists"
        description="Interactive aircraft checklists. Your progress is saved as you go."
        actions={
          <div className="w-56 space-y-1">
            <Label htmlFor="checklist-aircraft" className="sr-only">
              Aircraft
            </Label>
            <Select value={aircraft} onValueChange={setAircraft}>
              <SelectTrigger id="checklist-aircraft">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All aircraft</SelectItem>
                {CHECKLIST_AIRCRAFT.map((a) => (
                  <SelectItem key={a} value={a}>
                    {aircraftName(a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <QueryState query={q} rows={3} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No checklists yet" icon={<ListChecks className="h-8 w-8" />} />}>
        {() =>
          grouped.length === 0 ? (
            <EmptyState title="No checklists for this aircraft" />
          ) : (
            <>
              {grouped.map((g) => (
                <Section key={g.cat} title={CHECKLIST_CATEGORY_LABELS[g.cat]}>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.items.map((c) => (
                      <ChecklistCard key={c.id} c={c} />
                    ))}
                  </div>
                </Section>
              ))}
            </>
          )
        }
      </QueryState>
    </div>
  );
}
