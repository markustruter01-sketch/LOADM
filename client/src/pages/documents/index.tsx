import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Download, Eye, FileText } from "lucide-react";
import { EmptyState, PageHeader, QueryState, Section, formatDateTime } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { labelledEntries } from "@/components/documents/format";
import { downloadSubmissionPdf } from "@/components/documents/submission-pdf";
import { usePersona } from "@/lib/persona";
import { keys } from "@/lib/keys";
import type { DocumentListItem, DocumentSubmissionRow } from "./types";

function personName(row: DocumentSubmissionRow): string | undefined {
  return row.user ? `${row.user.rank} ${row.user.firstName} ${row.user.lastName}` : undefined;
}

function SubmissionDialog({ row, templates, onClose }: { row: DocumentSubmissionRow | null; templates: DocumentListItem[]; onClose: () => void }) {
  const fields = row ? templates.find((t) => t.id === row.documentId)?.fields : undefined;
  const entries = row ? labelledEntries(row.formData, fields) : [];
  return (
    <Dialog open={row !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {row && (
          <>
            <DialogHeader>
              <DialogTitle>{row.document.title}</DialogTitle>
              <DialogDescription>
                Submitted {formatDateTime(row.submittedAt)}
                {personName(row) ? ` by ${personName(row)}` : ""}
              </DialogDescription>
            </DialogHeader>
            <dl className="divide-y divide-border/60 rounded-md border border-border/60">
              {entries.map(([label, value]) => (
                <div key={label} className="grid gap-1 px-3 py-2 text-sm sm:grid-cols-[180px_1fr]">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="whitespace-pre-wrap break-words font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  downloadSubmissionPdf({ title: row.document.title, submittedAt: new Date(row.submittedAt), submittedBy: personName(row), rows: entries })
                }
              >
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Documents() {
  const { can } = usePersona();
  const instruct = can("instruct");
  const templates = useQuery<DocumentListItem[]>({ queryKey: keys.documents.list });
  const submissions = useQuery<DocumentSubmissionRow[]>({ queryKey: keys.documents.submissions() });
  const [viewing, setViewing] = useState<DocumentSubmissionRow | null>(null);

  return (
    <>
      <PageHeader
        eyebrow="Operate"
        title="Documents"
        description="Fill in manifests, declarations and checklists from the standard templates, then download a PDF for the aircraft."
      />

      <Section title="Form templates">
        <QueryState query={templates} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No templates" description="Instructors haven't published any form templates yet." />}>
          {(docs) => (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {docs.map((d) => (
                <Card key={d.id} className="flex flex-col border-border/60 bg-card/60">
                  <CardContent className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold leading-tight">{d.title}</div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="capitalize">{d.type}</Badge>
                          <Badge variant="secondary">{d.fields.length} fields</Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{d.description}</p>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{d.submissionCount} submission{d.submissionCount === 1 ? "" : "s"}</span>
                      <Button asChild size="sm">
                        <Link href={`/documents/${d.id}`}>
                          Fill in <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </QueryState>
      </Section>

      <Section title={instruct ? "All submissions" : "My submissions"} description={instruct ? "Every crew member's submitted forms." : "Forms you have submitted."}>
        <QueryState query={submissions} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No submissions yet" description="Submitted forms appear here." />}>
          {(rows) => (
            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form</TableHead>
                      {instruct && <TableHead className="hidden md:table-cell">Submitted by</TableHead>}
                      <TableHead>Submitted</TableHead>
                      <TableHead className="w-20 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.document.title}</TableCell>
                        {instruct && <TableCell className="hidden text-muted-foreground md:table-cell">{personName(r) ?? "—"}</TableCell>}
                        <TableCell className="text-muted-foreground">{formatDateTime(r.submittedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setViewing(r)} aria-label={`View ${r.document.title} submission`}>
                            <Eye className="mr-1.5 h-4 w-4" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </QueryState>
      </Section>

      <SubmissionDialog row={viewing} templates={templates.data ?? []} onClose={() => setViewing(null)} />
    </>
  );
}
