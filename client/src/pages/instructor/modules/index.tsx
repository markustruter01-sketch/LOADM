import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Plus } from "lucide-react";
import { AIRCRAFT_LABELS } from "@shared/constants";
import { keys } from "@/lib/keys";
import { PageHeader, QueryState, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActiveBadge } from "@/components/instructor/shared";
import { cn } from "@/lib/utils";
import type { ModuleListItem } from "../types";

function duration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export default function ManageModules() {
  const [, navigate] = useLocation();
  const modules = useQuery<ModuleListItem[]>({ queryKey: keys.training.modules({ includeInactive: true }) });

  return (
    <>
      <PageHeader
        title="Manage modules"
        description="Training modules: readings, videos and an assessment. Completion rate is the share of aircrew who have passed."
        actions={
          <Button asChild>
            <Link href="/instructor/modules/new">
              <Plus className="h-4 w-4" /> New module
            </Link>
          </Button>
        }
      />

      <QueryState
        query={modules}
        isEmpty={(d) => d.length === 0}
        empty={
          <EmptyState
            title="No modules yet"
            action={
              <Button asChild>
                <Link href="/instructor/modules/new">Create the first module</Link>
              </Button>
            }
          />
        }
      >
        {(rows) => (
          <Card className="border-border/60 bg-card/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead className="hidden md:table-cell">Aircraft</TableHead>
                  <TableHead className="hidden lg:table-cell">Difficulty</TableHead>
                  <TableHead className="hidden sm:table-cell">Duration</TableHead>
                  <TableHead className="hidden sm:table-cell">Content</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id} className={cn("cursor-pointer", !m.isActive && "opacity-70")} onClick={() => navigate(`/instructor/modules/${m.id}`)}>
                    <TableCell>
                      <div className="font-medium">{m.title}</div>
                      <div className="line-clamp-1 max-w-md text-xs text-muted-foreground">{m.description}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{m.aircraft ? AIRCRAFT_LABELS[m.aircraft] : <span className="text-muted-foreground">General</span>}</TableCell>
                    <TableCell className="hidden capitalize lg:table-cell">{m.difficulty}</TableCell>
                    <TableCell className="hidden whitespace-nowrap sm:table-cell">{duration(m.durationMinutes)}</TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">{m.contentCount}</TableCell>
                    <TableCell>
                      <div className="flex min-w-[6rem] items-center gap-2">
                        <Progress value={m.completionRate} className="h-1.5 w-16" aria-label={`Completion ${m.completionRate}%`} />
                        <span className="text-xs tabular-nums">{m.completionRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <ActiveBadge active={m.isActive} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </QueryState>
    </>
  );
}
