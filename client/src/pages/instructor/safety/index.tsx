import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AIRCRAFT_LABELS, FLYING_SQUADRONS, SAFETY_RECORD_TYPES, SAFETY_STATUSES, SQUADRON_LABELS } from "@shared/constants";
import type { SafetyRecord } from "@shared/schema";
import { del } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, QueryState, EmptyState, formatDate } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/instructor/ConfirmDialog";
import { RECORD_TYPE_LABELS, SafetyRecordDialog } from "@/components/instructor/SafetyRecordDialog";
import { personName, StatusBadge } from "@/components/instructor/shared";
import { cn } from "@/lib/utils";
import type { SafetyRecordRow } from "../types";

const ALL = "all";
const TYPE_TONE: Record<SafetyRecord["recordType"], string> = {
  incident: "border-red-500/40 text-red-400",
  observation: "border-border text-foreground",
  commendation: "border-emerald-500/40 text-emerald-400",
  training_failure: "border-amber-500/40 text-amber-400",
};
const SEVERITY_TONE: Record<string, string> = { minor: "text-amber-300", moderate: "text-amber-400", major: "text-red-400" };

function FilterSelect({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

export default function SafetyRecords() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const search = useSearch();
  const [squadron, setSquadron] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [recordType, setRecordType] = useState(ALL);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SafetyRecordRow | null>(null);
  const [defaultUserId, setDefaultUserId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<SafetyRecordRow | null>(null);

  // `?userId=` (from a student's page) opens the create dialog for that person, once.
  const handledSearch = useRef<string | null>(null);
  useEffect(() => {
    if (handledSearch.current === search) return;
    handledSearch.current = search;
    const uid = Number(new URLSearchParams(search).get("userId"));
    if (Number.isInteger(uid) && uid > 0) {
      setEditing(null);
      setDefaultUserId(uid);
      setDialogOpen(true);
    }
  }, [search]);

  const records = useQuery<SafetyRecordRow[]>({
    queryKey: keys.personnel.safety({
      squadron: squadron === ALL ? undefined : squadron,
      status: status === ALL ? undefined : status,
      recordType: recordType === ALL ? undefined : recordType,
    }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => del<{ id: number }>(`/api/personnel/safety-records/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.personnel.all });
      qc.invalidateQueries({ queryKey: keys.analytics.all });
      toast({ title: "Safety record deleted" });
      setDeleting(null);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not delete record", description: e.message }),
  });

  const openCreate = () => {
    setEditing(null);
    setDefaultUserId(null);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Safety records"
        description="Incidents, observations, commendations and training failures for aircrew."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New record
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <FilterSelect id="safety-squadron" label="Squadron" value={squadron} onChange={setSquadron}>
          <SelectItem value={ALL}>All squadrons</SelectItem>
          {FLYING_SQUADRONS.map((s) => (
            <SelectItem key={s} value={s}>
              {SQUADRON_LABELS[s]}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect id="safety-status" label="Status" value={status} onChange={setStatus}>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {SAFETY_STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">
              {s}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect id="safety-type" label="Type" value={recordType} onChange={setRecordType}>
          <SelectItem value={ALL}>All types</SelectItem>
          {SAFETY_RECORD_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {RECORD_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </FilterSelect>
      </div>

      <QueryState query={records} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No safety records" description="Nothing matches these filters." action={<Button onClick={openCreate}>New record</Button>} />}>
        {(rows) => (
          <Card className="border-border/60 bg-card/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Severity</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link href={`/instructor/students/${r.user.id}`} className="font-medium hover:text-primary">
                        {personName(r.user)}
                      </Link>
                      <div className="line-clamp-1 max-w-xs text-xs text-muted-foreground">{r.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("whitespace-nowrap", TYPE_TONE[r.recordType])}>
                        {RECORD_TYPE_LABELS[r.recordType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden capitalize md:table-cell">
                      {r.severity ? <span className={SEVERITY_TONE[r.severity]}>{r.severity}</span> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">{formatDate(r.date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div>{r.location ?? <span className="text-muted-foreground">—</span>}</div>
                      {r.aircraft && <div className="text-xs text-muted-foreground">{AIRCRAFT_LABELS[r.aircraft]}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(r);
                            setDialogOpen(true);
                          }}
                          aria-label="Edit record"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(r)} aria-label="Delete record">
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

      <SafetyRecordDialog open={dialogOpen} onOpenChange={setDialogOpen} record={editing} defaultUserId={defaultUserId} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this safety record?"
        description={deleting ? `The ${RECORD_TYPE_LABELS[deleting.recordType].toLowerCase()} for ${personName(deleting.user)} is permanently removed.` : undefined}
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}
