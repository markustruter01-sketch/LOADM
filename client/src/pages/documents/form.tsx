import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Download, RotateCcw } from "lucide-react";
import type { Document } from "@shared/schema";
import { EmptyState, PageHeader, QueryState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { DynamicFormField, buildSchema, defaultValuesFor, toFormData, type DynamicValues } from "@/components/documents/dynamic-form";
import { labelledEntries } from "@/components/documents/format";
import { downloadSubmissionPdf } from "@/components/documents/submission-pdf";
import { usePersona } from "@/lib/persona";
import { post } from "@/lib/api";
import { byPrefix, keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import type { CreatedDocumentSubmission } from "./types";

export default function DocumentForm() {
  const { id } = useParams<{ id: string }>();
  const docId = Number(id);
  const valid = Number.isInteger(docId) && docId > 0;
  const q = useQuery<Document>({ queryKey: keys.documents.one(docId), enabled: valid });
  if (!valid) return <EmptyState title="Form not found" description="The link looks wrong." />;
  return <QueryState query={q}>{(doc) => <FillForm key={doc.id} doc={doc} />}</QueryState>;
}

function FillForm({ doc }: { doc: Document }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = usePersona();
  const schema = useMemo(() => buildSchema(doc.fields), [doc.fields]);
  const defaults = useMemo(() => defaultValuesFor(doc.fields), [doc.fields]);
  const form = useForm<DynamicValues>({ resolver: zodResolver(schema), defaultValues: defaults });
  const [done, setDone] = useState<{ submission: CreatedDocumentSubmission; formData: Record<string, unknown> } | null>(null);

  const submit = useMutation({
    mutationFn: (formData: Record<string, unknown>) =>
      post<CreatedDocumentSubmission>(`/api/documents/${doc.id}/submissions`, { documentId: doc.id, formData }),
    onSuccess: (submission, formData) => {
      qc.invalidateQueries(byPrefix(keys.documents.all));
      toast({ title: "Form submitted", description: doc.title });
      setDone({ submission, formData });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not submit form", description: e.message }),
  });

  const downloadPdf = () => {
    if (!done) return;
    downloadSubmissionPdf({
      title: doc.title,
      submittedAt: new Date(done.submission.submittedAt),
      submittedBy: user ? `${user.rank} ${user.firstName} ${user.lastName}` : undefined,
      rows: labelledEntries(done.formData, doc.fields),
    });
  };

  const again = () => {
    form.reset(defaults);
    setDone(null);
  };

  return (
    <>
      <PageHeader backHref="/documents" eyebrow={doc.type} title={doc.title} description={doc.description} />

      {done ? (
        <Card className="mx-auto max-w-xl border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <div>
              <h2 className="text-lg font-semibold">Submitted</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your {doc.title.toLowerCase()} has been saved. Download a copy for the aircraft or start another.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={downloadPdf}>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
              <Button variant="outline" onClick={again}>
                <RotateCcw className="mr-2 h-4 w-4" /> Submit another
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/documents">Back to documents</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : doc.fields.length === 0 ? (
        <EmptyState title="This template has no fields" description="Ask an instructor to add fields to it." />
      ) : (
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-4 sm:p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => submit.mutate(toFormData(doc.fields, v)))} className="space-y-6" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  {doc.fields.map((f) => (
                    <DynamicFormField key={f.id} def={f} control={form.control} />
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                  <span className="text-xs text-muted-foreground">
                    <span className="text-primary">*</span> required
                  </span>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => form.reset(defaults)}>
                      Reset
                    </Button>
                    <Button type="submit" disabled={submit.isPending}>
                      {submit.isPending ? "Submitting…" : "Submit"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
