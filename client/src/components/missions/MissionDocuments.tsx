import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { FileText, Plus, Trash2 } from "lucide-react";
import { insertMissionDocumentSchema, type Document, type MissionDocument } from "@shared/schema";
import { EmptyState, formatDateTime } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { del, post } from "@/lib/api";
import { byPrefix, keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";

type DocValues = z.infer<typeof insertMissionDocumentSchema>;

function slugFilename(title: string): string {
  return `${title.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "document"}.pdf`;
}

function AddDocumentDialog({ missionId, open, onOpenChange }: { missionId: number; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const templates = useQuery<Document[]>({ queryKey: keys.documents.list, enabled: open });
  const form = useForm<DocValues>({ resolver: zodResolver(insertMissionDocumentSchema), defaultValues: { documentTitle: "", documentFilename: "" } });

  const add = useMutation({
    mutationFn: (body: DocValues) => post<MissionDocument>(`/api/missions/${missionId}/documents`, body),
    onSuccess: () => {
      qc.invalidateQueries(byPrefix(keys.missions.all));
      toast({ title: "Document attached" });
      form.reset();
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not attach document", description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attach document</DialogTitle>
          <DialogDescription>Pick one of the form templates or enter a document reference by hand.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => add.mutate(v))} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="template-pick" className="text-sm font-medium">
                From template
              </label>
              <Select
                onValueChange={(v) => {
                  const t = templates.data?.find((d) => String(d.id) === v);
                  if (!t) return;
                  form.setValue("documentTitle", t.title, { shouldValidate: true });
                  form.setValue("documentFilename", slugFilename(t.title), { shouldValidate: true });
                }}
              >
                <SelectTrigger id="template-pick">
                  <SelectValue placeholder={templates.isLoading ? "Loading templates…" : "Choose a template (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  {(templates.data ?? []).map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormField
              control={form.control}
              name="documentTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Passenger and Cargo Manifest" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentFilename"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Filename / reference</FormLabel>
                  <FormControl>
                    <Input placeholder="manifest-leg1.pdf" {...field} />
                  </FormControl>
                  <FormDescription>Free text; used as the document reference on the mission.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={add.isPending}>
                {add.isPending ? "Attaching…" : "Attach"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function MissionDocuments({ missionId, documents }: { missionId: number; documents: MissionDocument[] }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  const remove = useMutation({
    mutationFn: (docId: number) => del<{ id: number }>(`/api/missions/${missionId}/documents/${docId}`),
    onSuccess: () => {
      qc.invalidateQueries(byPrefix(keys.missions.all));
      toast({ title: "Document removed" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not remove document", description: e.message }),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
          <Plus className="mr-2 h-4 w-4" /> Attach document
        </Button>
      </div>
      {documents.length === 0 ? (
        <EmptyState icon={<FileText className="h-8 w-8" />} title="No documents attached" description="Attach manifests, DG declarations and load plans for this mission." />
      ) : (
        <Card className="border-border/60 bg-card/60">
          <CardContent className="divide-y divide-border/60 p-0">
            {documents.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{d.documentTitle}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {d.documentFilename} · added {formatDateTime(d.addedAt)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${d.documentTitle}`}
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(d.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <AddDocumentDialog missionId={missionId} open={adding} onOpenChange={setAdding} />
    </div>
  );
}
