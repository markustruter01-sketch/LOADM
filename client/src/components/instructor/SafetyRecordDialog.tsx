import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AIRCRAFT_LABELS, AIRCRAFT_TYPES, FLIGHT_PHASES, SAFETY_LEVELS, SAFETY_RECORD_TYPES, SAFETY_SEVERITIES, SAFETY_STATUSES, type AircraftType } from "@shared/constants";
import { insertSafetyRecordSchema, type InsertSafetyRecord, type PublicUser, type SafetyRecord } from "@shared/schema";
import { post, put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { personName, toDateInput } from "./shared";

const NONE = "none";
export const RECORD_TYPE_LABELS: Record<InsertSafetyRecord["recordType"], string> = {
  incident: "Incident",
  observation: "Observation",
  commendation: "Commendation",
  training_failure: "Training failure",
};

function toForm(r: SafetyRecord | null, userId: number | null): InsertSafetyRecord {
  if (!r) {
    return {
      userId: userId ?? 0,
      recordType: "observation",
      description: "",
      severity: null,
      date: new Date(),
      status: "open",
      resolutionNotes: null,
      location: null,
      aircraft: null,
      flightPhase: null,
      safetyLevel: null,
      immediateActions: null,
      contributingFactors: null,
      correctiveActions: null,
    };
  }
  return {
    userId: r.userId,
    recordType: r.recordType,
    description: r.description,
    severity: r.severity,
    date: new Date(r.date),
    status: r.status,
    resolutionNotes: r.resolutionNotes,
    location: r.location,
    aircraft: r.aircraft,
    flightPhase: r.flightPhase,
    safetyLevel: r.safetyLevel,
    immediateActions: r.immediateActions,
    contributingFactors: r.contributingFactors,
    correctiveActions: r.correctiveActions,
  };
}

type TextKey = "location" | "resolutionNotes" | "immediateActions" | "contributingFactors" | "correctiveActions";
type SelectKey = "flightPhase" | "safetyLevel";

/** Create or edit a safety record. `record` null = create (optionally for `defaultUserId`). */
export function SafetyRecordDialog({
  open,
  onOpenChange,
  record,
  defaultUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: SafetyRecord | null;
  defaultUserId: number | null;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const people = useQuery<PublicUser[]>({ queryKey: keys.users.list(), enabled: open });
  const form = useForm<InsertSafetyRecord>({ resolver: zodResolver(insertSafetyRecordSchema), defaultValues: toForm(record, defaultUserId) });
  const recordType = form.watch("recordType");

  useEffect(() => {
    if (open) form.reset(toForm(record, defaultUserId));
  }, [open, record, defaultUserId, form]);

  const save = useMutation({
    mutationFn: (body: InsertSafetyRecord) => (record ? put<SafetyRecord>(`/api/personnel/safety-records/${record.id}`, body) : post<SafetyRecord>("/api/personnel/safety-records", body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.personnel.all });
      qc.invalidateQueries({ queryKey: keys.analytics.all });
      toast({ title: record ? "Safety record updated" : "Safety record added" });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not save record", description: e.message }),
  });

  const onSubmit = (v: InsertSafetyRecord) => {
    const blank = (s: string | null | undefined) => (s && s.trim() ? s.trim() : null);
    save.mutate({
      ...v,
      description: v.description.trim(),
      severity: v.recordType === "incident" ? (v.severity ?? null) : null,
      location: blank(v.location),
      resolutionNotes: blank(v.resolutionNotes),
      immediateActions: blank(v.immediateActions),
      contributingFactors: blank(v.contributingFactors),
      correctiveActions: blank(v.correctiveActions),
    });
  };

  const text = (name: TextKey, label: string, rows = 2): ReactNode => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {rows > 1 ? (
              <Textarea rows={rows} value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
            ) : (
              <Input value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const optionalSelect = (name: SelectKey, label: string, options: readonly string[]): ReactNode => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={NONE}>Not specified</SelectItem>
              {options.map((o) => (
                <SelectItem key={o} value={o} className="capitalize">
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{record ? "Edit safety record" : "New safety record"}</DialogTitle>
          <DialogDescription>The record is filed against the person&apos;s current squadron. You are recorded as the reporter.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person</FormLabel>
                    <Select value={field.value ? String(field.value) : ""} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={people.isLoading ? "Loading…" : "Choose a person"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(people.data ?? []).map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {personName(u)} · {u.squadron}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" value={toDateInput(field.value)} onChange={(e) => e.target.value && field.onChange(new Date(`${e.target.value}T12:00:00`))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recordType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Record type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SAFETY_RECORD_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {RECORD_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {recordType === "incident" ? (
                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity</FormLabel>
                      <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE}>Not assessed</SelectItem>
                          {SAFETY_SEVERITIES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="hidden sm:block" />
              )}
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {text("location", "Location", 1)}
              <FormField
                control={form.control}
                name="aircraft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aircraft</FormLabel>
                    <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : (v as AircraftType))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Not specified</SelectItem>
                        {AIRCRAFT_TYPES.map((a) => (
                          <SelectItem key={a} value={a}>
                            {AIRCRAFT_LABELS[a]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {optionalSelect("flightPhase", "Flight phase", FLIGHT_PHASES)}
              {optionalSelect("safetyLevel", "Safety level", SAFETY_LEVELS)}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {text("immediateActions", "Immediate actions")}
              {text("contributingFactors", "Contributing factors")}
              {text("correctiveActions", "Corrective actions")}
            </div>

            <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value ?? "open"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SAFETY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {text("resolutionNotes", "Resolution notes")}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : record ? "Save changes" : "Add record"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
