import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { BookOpen, FileQuestion, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import type { ModuleContentType } from "@shared/constants";
import type { TrainingModuleContent } from "@shared/schema";
import { del } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, QueryState, Section, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ModuleForm } from "@/components/instructor/ModuleForm";
import { ModuleContentDialog } from "@/components/instructor/ModuleContentDialog";
import { ActiveBadge } from "@/components/instructor/shared";
import { cn } from "@/lib/utils";
import type { ModuleDetail } from "../types";

const TYPE_META: Record<ModuleContentType, { label: string; icon: typeof BookOpen }> = {
  reading: { label: "Reading", icon: BookOpen },
  quiz: { label: "Knowledge check", icon: FileQuestion },
  assessment: { label: "Assessment", icon: ListChecks },
};

function ContentSection({ module }: { module: ModuleDetail }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<TrainingModuleContent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<TrainingModuleContent | null>(null);

  const remove = useMutation({
    mutationFn: (contentId: number) => del<{ id: number }>(`/api/training/modules/${module.id}/content/${contentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.training.module(module.id) });
      qc.invalidateQueries({ queryKey: keys.training.all });
      toast({ title: "Content deleted" });
      setDeleting(null);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not delete content", description: e.message }),
  });

  const nextOrderIndex = module.content.reduce((m, c) => Math.max(m, c.orderIndex + 1), 0);

  return (
    <Section
      title="Content"
      description="Shown to students in this order."
      actions={
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add content
        </Button>
      }
    >
      {module.content.length === 0 ? (
        <EmptyState title="No content yet" description="Add a reading, a video or an assessment." />
      ) : (
        <Card className="border-border/60 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Minutes</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {module.content.map((c, i) => {
                const meta = TYPE_META[c.type];
                return (
                  <TableRow key={c.id} className={cn(!c.isActive && "opacity-60")}>
                    <TableCell className="tabular-nums text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{c.title}</div>
                      <div className="line-clamp-1 text-xs text-muted-foreground">
                        {c.questions && c.questions.length > 0 ? `${c.questions.length} questions` : c.description}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <meta.icon className="h-4 w-4 text-primary" />
                        {meta.label}
                      </span>
                    </TableCell>
                    <TableCell className="hidden tabular-nums md:table-cell">{c.durationMinutes}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <ActiveBadge active={c.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(c);
                            setDialogOpen(true);
                          }}
                          aria-label={`Edit ${c.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(c)} aria-label={`Delete ${c.title}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <ModuleContentDialog moduleId={module.id} content={editing} nextOrderIndex={nextOrderIndex} open={dialogOpen} onOpenChange={setDialogOpen} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.title ?? ""}"?`}
        description="This content item is permanently removed from the module."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </Section>
  );
}

export default function ModuleEditor() {
  const { id: idParam } = useParams<{ id?: string }>();
  const id = idParam ? Number(idParam) : null;
  const moduleQuery = useQuery<ModuleDetail>({ queryKey: keys.training.module(id ?? 0), enabled: id !== null });

  if (id === null) {
    return (
      <>
        <PageHeader backHref="/instructor/modules" title="New module" description="Create the module first, then add its content and videos." />
        <ModuleForm module={null} />
      </>
    );
  }

  return (
    <>
      <PageHeader backHref="/instructor/modules" eyebrow="Edit module" title={moduleQuery.data?.title ?? "Module"} description="Module details and content." />
      <QueryState query={moduleQuery}>
        {(m) => (
          <div className="space-y-8">
            <ModuleForm key={m.id} module={m} />
            <ContentSection module={m} />
          </div>
        )}
      </QueryState>
    </>
  );
}
