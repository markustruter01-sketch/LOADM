import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { insertUserQualificationSchema, type UserQualification } from "@shared/schema";
import { STANDARD_QUALIFICATION_TYPES, THRESHOLDS } from "@shared/constants";
import { del, post, put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EmptyState, formatDate } from "@/components/common";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";
import type { QualificationStatus, QualificationWithStatus } from "./types";

const OTHER = "Other";
type QualType = (typeof STANDARD_QUALIFICATION_TYPES)[number];

/** Form-side schema (string dates for <input type="date">); converted to the shared insert schema on submit. */
const qualFormSchema = z
  .object({
    type: z.enum(STANDARD_QUALIFICATION_TYPES),
    customName: z.string().max(200).optional(),
    startDate: z.string().min(1, "Start date is required"),
    noExpiry: z.boolean(),
    expiryDate: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type === OTHER && !v.customName?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["customName"], message: "Enter the qualification name" });
    if (!v.noExpiry && !v.expiryDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["expiryDate"], message: "Enter an expiry date or tick “No end date”" });
    if (!v.noExpiry && v.expiryDate && v.expiryDate < v.startDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["expiryDate"], message: "Expiry must be after the start date" });
  });
type QualFormValues = z.infer<typeof qualFormSchema>;

function toDateInput(d: string | Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

function defaultsFrom(q: UserQualification | null): QualFormValues {
  const isStandard = q ? (STANDARD_QUALIFICATION_TYPES as readonly string[]).includes(q.name) && q.name !== OTHER : false;
  return {
    type: q ? (isStandard ? (q.name as QualType) : OTHER) : STANDARD_QUALIFICATION_TYPES[0],
    customName: q && !isStandard ? q.name : "",
    startDate: q ? toDateInput(q.startDate) : toDateInput(new Date()),
    noExpiry: q ? q.expiryDate === null : false,
    expiryDate: q ? toDateInput(q.expiryDate) : "",
  };
}

export const STATUS_STYLES: Record<QualificationStatus, string> = {
  current: "border-emerald-500/50 text-emerald-400",
  expiring: "border-amber-500/50 text-amber-400",
  expired: "border-red-500/50 text-red-400",
};

export function QualificationStatusBadge({ status, daysRemaining }: { status: QualificationStatus; daysRemaining: number | null }) {
  const label =
    status === "expired"
      ? `Expired ${daysRemaining === null ? "" : `${Math.abs(daysRemaining)} d ago`}`.trim()
      : status === "expiring"
        ? `Expires in ${daysRemaining} d`
        : daysRemaining === null
          ? "Current · no end date"
          : `Current · ${daysRemaining} d left`;
  return (
    <Badge variant="outline" className={cn("font-normal", STATUS_STYLES[status])}>
      {label}
    </Badge>
  );
}

function QualificationDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (o: boolean) => void; editing: UserQualification | null }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const form = useForm<QualFormValues>({ resolver: zodResolver(qualFormSchema), defaultValues: defaultsFrom(editing) });
  useEffect(() => {
    if (open) form.reset(defaultsFrom(editing));
  }, [open, editing, form]);
  const type = form.watch("type");
  const noExpiry = form.watch("noExpiry");

  const save = useMutation({
    mutationFn: (v: QualFormValues) => {
      const body = insertUserQualificationSchema.parse({
        name: v.type === OTHER ? v.customName?.trim() : v.type,
        startDate: v.startDate,
        expiryDate: v.noExpiry ? null : v.expiryDate,
      });
      return editing ? put<UserQualification>(`/api/personnel/qualifications/${editing.id}`, body) : post<UserQualification>("/api/personnel/qualifications", body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.personnel.all });
      qc.invalidateQueries({ queryKey: keys.users.me });
      qc.invalidateQueries({ queryKey: keys.demo.me });
      toast({ title: editing ? "Qualification updated" : "Qualification added" });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not save qualification", description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit qualification" : "Add qualification"}</DialogTitle>
          <DialogDescription>Qualifications expiring within {THRESHOLDS.QUALIFICATION_EXPIRY_WARNING_DAYS} days are flagged on your dashboard.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qualification</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STANDARD_QUALIFICATION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {type === OTHER && (
              <FormField
                control={form.control}
                name="customName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="e.g. Hoist Operations" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} disabled={noExpiry} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="noExpiry"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} id="qual-no-expiry" />
                  </FormControl>
                  <FormLabel htmlFor="qual-no-expiry" className="font-normal">
                    No end date
                  </FormLabel>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : editing ? "Save" : "Add"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function QualificationsTab({ qualifications }: { qualifications: QualificationWithStatus[] }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserQualification | null>(null);

  const remove = useMutation({
    mutationFn: (id: number) => del<void>(`/api/personnel/qualifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.personnel.all });
      qc.invalidateQueries({ queryKey: keys.users.me });
      qc.invalidateQueries({ queryKey: keys.demo.me });
      toast({ title: "Qualification removed" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not remove qualification", description: e.message }),
  });

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (q: UserQualification) => {
    setEditing(q);
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {qualifications.length} qualification{qualifications.length === 1 ? "" : "s"} on record
        </p>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden /> Add qualification
        </Button>
      </div>
      {qualifications.length === 0 ? (
        <EmptyState title="No qualifications recorded" description="Add your type ratings and currencies so expiries are tracked." action={<Button onClick={openNew}>Add qualification</Button>} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Qualification</TableHead>
                <TableHead className="w-32">Start</TableHead>
                <TableHead className="w-32">Expiry</TableHead>
                <TableHead className="w-48">Status</TableHead>
                <TableHead className="w-24 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qualifications.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(q.startDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{q.expiryDate ? formatDate(q.expiryDate) : "No end date"}</TableCell>
                  <TableCell>
                    <QualificationStatusBadge status={q.status} daysRemaining={q.daysRemaining} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit ${q.name}`} onClick={() => openEdit(q)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDialog
                        title="Remove this qualification?"
                        description={`${q.name} will be removed from your record.`}
                        confirmLabel="Remove"
                        onConfirm={() => remove.mutate(q.id)}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label={`Remove ${q.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <QualificationDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}
