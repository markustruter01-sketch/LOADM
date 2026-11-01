import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ScoreBadge, formatDateTime } from "@/components/common";
import type { ActivityItem } from "./types";

const TYPE_LABELS: Record<ActivityItem["type"], string> = {
  quiz: "Quiz",
  scenario: "Scenario",
  module: "Module",
  document: "Document",
};

/** Where a row links to, when there is a results page for it. */
function hrefFor(a: ActivityItem): string | null {
  if (a.type === "quiz") return `/quizzes/results/${a.id}`;
  if (a.type === "scenario") return `/scenarios/results/${a.id}`;
  if (a.type === "module" && a.moduleId) return `/training/${a.moduleId}`;
  return null;
}

export function ActivityTable({ items, limit }: { items: ActivityItem[]; limit?: number }) {
  const rows = limit ? items.slice(0, limit) : items;
  if (rows.length === 0) {
    return <EmptyState title="No activity yet" description="Quizzes, scenarios and module assessments you complete will show here." />;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="w-36">Date</TableHead>
            <TableHead className="w-24 text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((a) => {
            const href = hrefFor(a);
            return (
              <TableRow key={`${a.type}-${a.id}`}>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {TYPE_LABELS[a.type]}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {href ? (
                    <Link href={href} className="hover:text-primary">
                      {a.title}
                    </Link>
                  ) : (
                    a.title
                  )}
                  {a.type === "scenario" && a.status === "submitted" && <span className="ml-2 text-xs text-muted-foreground">Awaiting review</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(a.date)}</TableCell>
                <TableCell className="text-right">
                  {a.type === "document" ? <span className="text-xs text-muted-foreground">Submitted</span> : <ScoreBadge score={a.score} passed={a.passed} />}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
