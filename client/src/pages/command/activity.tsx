import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { ROLE_LABELS } from "@shared/constants";
import { keys } from "@/lib/keys";
import { PageHeader, QueryState, EmptyState, formatDateTime, relativeTime } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { personName } from "@/components/command/charts";
import { cn } from "@/lib/utils";
import type { ActivityRow } from "./types";

const ALL = "all";

/** Badge colour per audit action; unknown actions fall back to muted. */
const ACTION_CLASS: Record<string, string> = {
  CREATE: "bg-emerald-400/10 text-emerald-400",
  UPDATE: "bg-primary/10 text-primary",
  DELETE: "bg-red-400/10 text-red-400",
  REVIEW: "bg-amber-400/10 text-amber-400",
  RESET: "bg-muted text-muted-foreground",
};

export default function CommandActivity() {
  const [action, setAction] = useState<string>(ALL);
  const q = useQuery<ActivityRow[]>({ queryKey: keys.activity.all });

  const actions = useMemo(() => [...new Set((q.data ?? []).map((r) => r.action))].sort(), [q.data]);
  const rows = useMemo(() => (q.data ?? []).filter((r) => action === ALL || r.action === action), [q.data, action]);

  return (
    <div>
      <PageHeader
        eyebrow="Command"
        title="Activity log"
        description="Audit trail of content and record changes across the platform, newest first."
        actions={
          <div className="flex items-center gap-2">
            <Label htmlFor="activity-action" className="text-sm text-muted-foreground">
              Action
            </Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger id="activity-action" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All actions</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <QueryState
        query={q}
        rows={6}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={<History className="h-8 w-8" />} title="No activity yet" description="Creating, editing, reviewing or deleting content will appear here." />}
      >
        {() =>
          rows.length === 0 ? (
            <EmptyState title={`No ${action} actions`} description="Try a different action filter." />
          ) : (
            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead className="hidden md:table-cell">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-sm" title={formatDateTime(r.performedAt)}>
                          {relativeTime(r.performedAt)}
                        </TableCell>
                        <TableCell>
                          {r.actor ? (
                            <>
                              <div className="text-sm font-medium">{personName(r.actor)}</div>
                              <div className="text-xs text-muted-foreground">
                                {ROLE_LABELS[r.actor.role]} · {r.actor.squadron}
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold", ACTION_CLASS[r.action] ?? "bg-muted text-muted-foreground")}>
                            {r.action}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{r.resourceName}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.resourceType}
                            {r.resourceId !== null && ` #${r.resourceId}`}
                          </div>
                        </TableCell>
                        <TableCell className="hidden max-w-sm text-sm text-muted-foreground md:table-cell">
                          <span className="line-clamp-2">{r.details ?? "—"}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        }
      </QueryState>
    </div>
  );
}
