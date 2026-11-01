import { useState, type ReactNode } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Flame, Pencil, Trash2 } from "lucide-react";
import type { InsertMission, Mission } from "@shared/schema";
import { AIRCRAFT_LABELS } from "@shared/constants";
import { EmptyState, PageHeader, QueryState, Section, formatDate, formatDateTime } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MissionForm } from "@/components/missions/MissionForm";
import { MissionStatusBadge } from "@/components/missions/MissionStatusBadge";
import { MissionDocuments } from "@/components/missions/MissionDocuments";
import { del, patch } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import type { MissionDetail as MissionDetailT } from "./types";

type MissionPatch = Partial<InsertMission> & { isCompleted?: boolean };

function toFormValues(m: Mission): InsertMission {
  return {
    missionName: m.missionName,
    aircraft: m.aircraft,
    aircraftCallSign: m.aircraftCallSign,
    captainName: m.captainName,
    departureLocation: m.departureLocation,
    arrivalDestination: m.arrivalDestination,
    loadmaster1Name: m.loadmaster1Name,
    loadmaster2Name: m.loadmaster2Name,
    hasDangerousGoods: m.hasDangerousGoods,
  };
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-3">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

export default function MissionDetail() {
  const { id } = useParams<{ id: string }>();
  const missionId = Number(id);
  const valid = Number.isInteger(missionId) && missionId > 0;
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);

  const q = useQuery<MissionDetailT>({ queryKey: keys.missions.one(missionId), enabled: valid });

  const update = useMutation({
    mutationFn: (body: MissionPatch) => patch<Mission>(`/api/missions/${missionId}`, body),
    onSuccess: (_m, body) => {
      qc.invalidateQueries({ queryKey: keys.missions.all });
      toast({ title: body.isCompleted === undefined ? "Mission updated" : body.isCompleted ? "Mission marked complete" : "Mission reopened" });
      setEditing(false);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not update mission", description: e.message }),
  });

  const remove = useMutation({
    mutationFn: () => del<{ id: number }>(`/api/missions/${missionId}`),
    onSuccess: () => {
      qc.removeQueries({ queryKey: keys.missions.one(missionId) });
      qc.invalidateQueries({ queryKey: keys.missions.all });
      toast({ title: "Mission deleted" });
      navigate("/missions");
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not delete mission", description: e.message }),
  });

  if (!valid) return <EmptyState title="Mission not found" description="The link looks wrong." />;

  return (
    <QueryState query={q}>
      {(m) => (
        <>
          <PageHeader
            backHref="/missions"
            eyebrow={`${m.aircraftCallSign} · ${AIRCRAFT_LABELS[m.aircraft]}`}
            title={m.missionName}
            description={
              <span className="inline-flex items-center gap-2">
                {m.departureLocation} <ArrowRight className="h-3.5 w-3.5" /> {m.arrivalDestination}
              </span>
            }
            actions={
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this mission?</AlertDialogTitle>
                      <AlertDialogDescription>
                        “{m.missionName}” and its {m.documents.length} attached document{m.documents.length === 1 ? "" : "s"} will be removed permanently.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => remove.mutate()}>
                        Delete mission
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            }
          />

          <Card className="mb-8 border-border/60 bg-card/60">
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MissionStatusBadge completed={m.isCompleted} />
                  {m.hasDangerousGoods && (
                    <Badge variant="destructive" className="gap-1">
                      <Flame className="h-3 w-3" /> Dangerous goods
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="mission-complete"
                    checked={m.isCompleted}
                    disabled={update.isPending}
                    onCheckedChange={(checked) => update.mutate({ isCompleted: checked })}
                  />
                  <Label htmlFor="mission-complete">Mark complete</Label>
                </div>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Fact label="Captain" value={m.captainName} />
                <Fact label="Loadmaster 1" value={m.loadmaster1Name} />
                <Fact label="Loadmaster 2" value={m.loadmaster2Name ?? "—"} />
                <Fact label="Aircraft" value={AIRCRAFT_LABELS[m.aircraft]} />
                <Fact label="Created" value={formatDate(m.createdAt)} />
                <Fact label="Last updated" value={formatDateTime(m.updatedAt)} />
                <Fact label="Completed" value={m.isCompleted ? formatDateTime(m.completedAt) : "—"} />
                <Fact label="Documents" value={m.documents.length} />
              </dl>
            </CardContent>
          </Card>

          <Section title="Documents" description="References to the paperwork carried on this mission.">
            <MissionDocuments missionId={m.id} documents={m.documents} />
          </Section>

          <Dialog open={editing} onOpenChange={setEditing}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit mission</DialogTitle>
                <DialogDescription>Update crew, route or aircraft.</DialogDescription>
              </DialogHeader>
              <MissionForm
                key={String(m.updatedAt)}
                defaultValues={toFormValues(m)}
                submitLabel="Save changes"
                pending={update.isPending}
                onSubmit={(v) => update.mutate(v)}
                onCancel={() => setEditing(false)}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </QueryState>
  );
}
