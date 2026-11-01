import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { insertFlightRecordSchema, type FlightRecord } from "@shared/schema";
import { AIRCRAFT_LABELS, AIRCRAFT_TYPES, type AircraftType } from "@shared/constants";
import { del, post, put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EmptyState, QueryState, StatCard, formatDate } from "@/components/common";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { FlightSummary } from "./types";

/** Form-side schema: string date for <input type="date">, numbers coerced from inputs. */
const flightFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  aircraft: z.enum(AIRCRAFT_TYPES),
  callsign: z.string().max(50).optional(),
  departure: z.string().min(1, "Required").max(100),
  arrival: z.string().min(1, "Required").max(100),
  captain: z.string().min(1, "Required").max(100),
  passengersCarried: z.coerce.number().int().nonnegative(),
  cargoWeightKg: z.coerce.number().int().nonnegative(),
  dayHours: z.coerce.number().nonnegative().max(24),
  nightHours: z.coerce.number().nonnegative().max(24),
});
type FlightFormValues = z.infer<typeof flightFormSchema>;

function defaultsFrom(r: FlightRecord | null): FlightFormValues {
  return {
    date: r ? new Date(r.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    aircraft: r?.aircraft ?? "C130J",
    callsign: r?.callsign ?? "",
    departure: r?.departure ?? "",
    arrival: r?.arrival ?? "",
    captain: r?.captain ?? "",
    passengersCarried: r?.passengersCarried ?? 0,
    cargoWeightKg: r?.cargoWeightKg ?? 0,
    dayHours: r?.dayHours ?? 0,
    nightHours: r?.nightHours ?? 0,
  };
}

const TEXT_FIELDS = [
  { name: "callsign", label: "Callsign" },
  { name: "captain", label: "Captain" },
  { name: "departure", label: "Departure" },
  { name: "arrival", label: "Arrival" },
] as const;

const NUMBER_FIELDS = [
  { name: "dayHours", label: "Day hours", step: "0.1" },
  { name: "nightHours", label: "Night hours", step: "0.1" },
  { name: "passengersCarried", label: "Passengers", step: "1" },
  { name: "cargoWeightKg", label: "Cargo (kg)", step: "1" },
] as const;

function FlightRecordDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (o: boolean) => void; editing: FlightRecord | null }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const form = useForm<FlightFormValues>({ resolver: zodResolver(flightFormSchema), defaultValues: defaultsFrom(editing) });
  useEffect(() => {
    if (open) form.reset(defaultsFrom(editing));
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: (v: FlightFormValues) => {
      const body = insertFlightRecordSchema.parse({ ...v, callsign: v.callsign?.trim() ? v.callsign.trim() : null });
      return editing ? put<FlightRecord>(`/api/personnel/flight-records/${editing.id}`, body) : post<FlightRecord>("/api/personnel/flight-records", body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.personnel.all });
      qc.invalidateQueries({ queryKey: keys.users.me });
      toast({ title: editing ? "Flight updated" : "Flight logged" });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not save flight", description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit flight" : "Log a flight"}</DialogTitle>
          <DialogDescription>Hours are recorded per sortie, to one decimal place.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aircraft"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aircraft</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
            {TEXT_FIELDS.map((f) => (
              <FormField
                key={f.name}
                control={form.control}
                name={f.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{f.label}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            {NUMBER_FIELDS.map((f) => (
              <FormField
                key={f.name}
                control={form.control}
                name={f.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{f.label}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={f.step} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : editing ? "Save" : "Log flight"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString("en-AU", { month: "short" });
}

function aircraftLabel(a: string): string {
  return (AIRCRAFT_TYPES as readonly string[]).includes(a) ? AIRCRAFT_LABELS[a as AircraftType] : a;
}

function SummarySection() {
  const q = useQuery<FlightSummary>({ queryKey: keys.personnel.flightSummary() });
  return (
    <QueryState query={q} rows={2}>
      {(s) => (
        <div className="mb-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total hours" value={s.totalHours.toFixed(1)} hint={`${s.dayHours.toFixed(1)} day · ${s.nightHours.toFixed(1)} night`} />
            <StatCard label="Sorties" value={s.sorties} />
            <StatCard label="Cargo carried" value={`${Math.round(s.cargoKg / 1000).toLocaleString("en-AU")} t`} hint={`${s.cargoKg.toLocaleString("en-AU")} kg`} />
            <StatCard label="Passengers" value={s.passengers.toLocaleString("en-AU")} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-border/60 bg-card/60 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Hours, last 12 months</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={s.last12Months.map((m) => ({ ...m, label: monthLabel(m.month) }))} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                      contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value) => [`${Number(value).toFixed(1)} h`, "Hours"]}
                    />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">By aircraft</CardTitle>
              </CardHeader>
              <CardContent>
                {s.byAircraft.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No flights logged.</p>
                ) : (
                  <ul className="space-y-2">
                    {s.byAircraft.map((a) => (
                      <li key={a.aircraft} className="flex items-center justify-between text-sm">
                        <span>{aircraftLabel(a.aircraft)}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {a.hours.toFixed(1)} h · {a.sorties} sorties
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </QueryState>
  );
}

export function FlightLogTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const records = useQuery<FlightRecord[]>({ queryKey: keys.personnel.flightRecords() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FlightRecord | null>(null);

  const remove = useMutation({
    mutationFn: (id: number) => del<void>(`/api/personnel/flight-records/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.personnel.all });
      qc.invalidateQueries({ queryKey: keys.users.me });
      toast({ title: "Flight removed" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not remove flight", description: e.message }),
  });

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  return (
    <div>
      <SummarySection />
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Flight records</h3>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden /> Log flight
        </Button>
      </div>
      <QueryState
        query={records}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState title="No flights logged" description="Log your sorties to build your flight history." action={<Button onClick={openNew}>Log flight</Button>} />}
      >
        {(rows) => (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Aircraft</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Captain</TableHead>
                  <TableHead className="text-right">Day</TableHead>
                  <TableHead className="text-right">Night</TableHead>
                  <TableHead className="text-right">Cargo kg</TableHead>
                  <TableHead className="text-right">Pax</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(r.date)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.aircraft}
                      {r.callsign && <span className="ml-1 text-xs text-muted-foreground">{r.callsign}</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.departure} → {r.arrival}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.captain}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.dayHours.toFixed(1)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.nightHours.toFixed(1)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.cargoWeightKg.toLocaleString("en-AU")}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.passengersCarried}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Edit flight"
                          onClick={() => {
                            setEditing(r);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDialog
                          title="Delete this flight?"
                          description={`${formatDate(r.date)} ${r.departure} → ${r.arrival} will be removed from your log.`}
                          onConfirm={() => remove.mutate(r.id)}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Delete flight">
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
      </QueryState>
      <FlightRecordDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}
