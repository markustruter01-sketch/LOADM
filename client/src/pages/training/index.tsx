import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, GraduationCap, Layers, Users } from "lucide-react";
import { AIRCRAFT_LABELS, AIRCRAFT_TYPES, DIFFICULTIES, type AircraftType, type Difficulty } from "@shared/constants";
import { keys } from "@/lib/keys";
import { EmptyState, PageHeader, QueryState } from "@/components/common";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TrainingModuleListItem } from "./types";

const ALL = "all";
const GENERAL = "general";

function CompletionBadge({ m }: { m: TrainingModuleListItem }) {
  if (!m.myCompletion) return <Badge variant="outline" className="font-normal text-muted-foreground">Not started</Badge>;
  return m.myCompletion.passed ? (
    <Badge variant="outline" className="gap-1 border-emerald-500/50 font-normal text-emerald-400">
      <CheckCircle2 className="h-3 w-3" aria-hidden /> Passed · {m.myCompletion.score}%
    </Badge>
  ) : (
    <Badge variant="outline" className="border-amber-500/50 font-normal text-amber-400">
      Not passed · {m.myCompletion.score}%
    </Badge>
  );
}

export default function TrainingList() {
  const q = useQuery<TrainingModuleListItem[]>({ queryKey: keys.training.modules() });
  const [aircraft, setAircraft] = useState<string>(ALL);
  const [difficulty, setDifficulty] = useState<string>(ALL);

  const filtered = useMemo(
    () =>
      (q.data ?? []).filter(
        (m) =>
          (aircraft === ALL || (aircraft === GENERAL ? m.aircraft === null : m.aircraft === aircraft)) &&
          (difficulty === ALL || m.difficulty === difficulty),
      ),
    [q.data, aircraft, difficulty],
  );

  const passed = (q.data ?? []).filter((m) => m.myCompletion?.passed).length;

  return (
    <div>
      <PageHeader
        title="Training modules"
        description={q.data ? `${passed} of ${q.data.length} modules passed. Work through the content, then sit the assessment.` : "Structured learning with an assessment at the end of each module."}
      />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="w-full space-y-1 sm:w-56">
          <Label htmlFor="filter-aircraft" className="text-xs text-muted-foreground">Aircraft</Label>
          <Select value={aircraft} onValueChange={setAircraft}>
            <SelectTrigger id="filter-aircraft">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All aircraft</SelectItem>
              <SelectItem value={GENERAL}>General (any aircraft)</SelectItem>
              {AIRCRAFT_TYPES.map((a) => (
                <SelectItem key={a} value={a}>
                  {AIRCRAFT_LABELS[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full space-y-1 sm:w-48">
          <Label htmlFor="filter-difficulty" className="text-xs text-muted-foreground">Difficulty</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger id="filter-difficulty">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All levels</SelectItem>
              {DIFFICULTIES.map((d) => (
                <SelectItem key={d} value={d} className="capitalize">
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(aircraft !== ALL || difficulty !== ALL) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAircraft(ALL);
              setDifficulty(ALL);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <QueryState query={q} rows={4} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No modules published yet" icon={<GraduationCap className="h-8 w-8" />} />}>
        {() =>
          filtered.length === 0 ? (
            <EmptyState title="No modules match these filters" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m) => (
                <ModuleCard key={m.id} m={m} />
              ))}
            </div>
          )
        }
      </QueryState>
    </div>
  );
}

const DIFFICULTY_TONE: Record<Difficulty, string> = {
  beginner: "text-emerald-400",
  intermediate: "text-primary",
  advanced: "text-amber-400",
  expert: "text-red-400",
};

function ModuleCard({ m }: { m: TrainingModuleListItem }) {
  return (
    <Card className={cn("flex flex-col border-border/60 bg-card/60 transition-colors hover:border-primary/50", m.myCompletion?.passed && "border-emerald-500/30")}>
      <CardHeader className="pb-2">
        <div className="mb-1 flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{m.aircraft ? AIRCRAFT_LABELS[m.aircraft as AircraftType] : "All aircraft"}</span>
          <span className={cn("font-medium capitalize", DIFFICULTY_TONE[m.difficulty])}>{m.difficulty}</span>
        </div>
        <CardTitle className="text-base leading-snug">
          <Link href={`/training/${m.id}`} className="hover:text-primary">
            {m.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="line-clamp-3 text-sm text-muted-foreground">{m.description}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden /> {m.durationMinutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" aria-hidden /> {m.contentCount} item{m.contentCount === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1" title="Share of aircrew who have passed">
            <Users className="h-3.5 w-3.5" aria-hidden /> {Math.round(m.completionRate)}% completed
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <CompletionBadge m={m} />
        <Button asChild size="sm" variant={m.myCompletion?.passed ? "outline" : "default"}>
          <Link href={`/training/${m.id}`}>{m.myCompletion ? (m.myCompletion.passed ? "Review" : "Continue") : "Start"}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
