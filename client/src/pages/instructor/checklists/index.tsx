import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Checklist } from "@shared/schema";
import { del } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, QueryState, EmptyState, formatDate } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/instructor/ConfirmDialog";
import { ActiveBadge, aircraftLabel } from "@/components/instructor/shared";
import { cn } from "@/lib/utils";
import type { ChecklistListItem } from "../types";

export default function ManageChecklists() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<ChecklistListItem | null>(null);
  const checklists = useQuery<ChecklistListItem[]>({ queryKey: keys.checklists.manage });

  const remove = useMutation({
    mutationFn: (id: number) => del<Checklist>(`/api/checklists/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.checklists.all });
      qc.invalidateQueries({ queryKey: keys.checklists.manage });
      toast({ title: "Checklist deactivated" });
      setDeleting(null);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not remove checklist", description: e.message }),
  });

  return (
    <>
      <PageHeader
        title="Manage checklists"
        description="Aircraft and procedure checklists. Linear checklists must be completed in order."
        actions={
          <Button asChild>
            <Link href="/instructor/checklists/new">
              <Plus className="h-4 w-4" /> New checklist
            </Link>
          </Button>
        }
      />

      <QueryState
        query={checklists}
        isEmpty={(d) => d.length === 0}
        empty={
          <EmptyState
            title="No checklists yet"
            action={
              <Button asChild>
                <Link href="/instructor/checklists/new">Create the first checklist</Link>
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
                  <TableHead>Checklist</TableHead>
                  <TableHead className="hidden md:table-cell">Aircraft</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="hidden lg:table-cell">Updated</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id} className={cn(!c.isActive && "opacity-70")}>
                    <TableCell>
                      <div className="font-medium">{c.title}</div>
                      {c.enforceLinearProgression && <div className="text-xs text-muted-foreground">Linear progression</div>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{aircraftLabel(c.aircraftType)}</TableCell>
                    <TableCell className="hidden capitalize sm:table-cell">{c.category}</TableCell>
                    <TableCell className="tabular-nums">{c.items.length}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(c.updatedAt)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <ActiveBadge active={c.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" aria-label={`Edit ${c.title}`}>
                          <Link href={`/instructor/checklists/${c.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(c)} disabled={!c.isActive} aria-label={`Remove ${c.title}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </QueryState>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Deactivate "${deleting?.title ?? ""}"?`}
        description="The checklist is hidden from crews. Completion history is kept, and it can be re-activated from the editor."
        confirmLabel="Deactivate"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}
