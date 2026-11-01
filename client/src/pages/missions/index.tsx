import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Flame, Plus } from "lucide-react";
import type { InsertMission, Mission } from "@shared/schema";
import { AIRCRAFT_LABELS } from "@shared/constants";
import { EmptyState, PageHeader, QueryState, formatDate } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MissionForm } from "@/components/missions/MissionForm";
import { MissionStatusBadge } from "@/components/missions/MissionStatusBadge";
import { usePersona } from "@/lib/persona";
import { byPrefix, keys } from "@/lib/keys";
import { post } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { MissionListItem } from "./types";

export default function Missions() {
  const { can } = usePersona();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showAll, setShowAll] = useState(false);
  const [creating, setCreating] = useState(false);
  const instruct = can("instruct");

  const q = useQuery<MissionListItem[]>({ queryKey: keys.missions.list({ all: instruct && showAll ? true : undefined }) });

  const create = useMutation({
    mutationFn: (body: InsertMission) => post<Mission>("/api/missions", body),
    onSuccess: (m) => {
      qc.invalidateQueries(byPrefix(keys.missions.all));
      toast({ title: "Mission created", description: m.missionName });
      setCreating(false);
      navigate(`/missions/${m.id}`);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not create mission", description: e.message }),
  });

  return (
    <>
      <PageHeader
        eyebrow="Operate"
        title="Missions"
        description="Plan sorties, track crew and dangerous goods, and attach the documents each leg needs."
        actions={
          <>
            {instruct && (
              <div className="flex items-center gap-2">
                <Switch id="all-missions" checked={showAll} onCheckedChange={setShowAll} />
                <Label htmlFor="all-missions" className="text-sm">
                  All crews
                </Label>
              </div>
            )}
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" /> New mission
            </Button>
          </>
        }
      />

      <QueryState
        query={q}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState title="No missions yet" description="Create your first mission to start tracking crew, route and documents." action={<Button onClick={() => setCreating(true)}>New mission</Button>} />}
      >
        {(missions) => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {missions.map((m) => (
              <Link key={m.id} href={`/missions/${m.id}`} className="group block focus:outline-none">
                <Card className="h-full border-border/60 bg-card/60 transition-colors group-hover:border-primary/50 group-focus-visible:ring-2 group-focus-visible:ring-primary">
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{m.missionName}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.aircraftCallSign} · {AIRCRAFT_LABELS[m.aircraft]}
                        </div>
                      </div>
                      <MissionStatusBadge completed={m.isCompleted} />
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium tabular-nums">
                      <span>{m.departureLocation}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{m.arrivalDestination}</span>
                      {m.hasDangerousGoods && (
                        <Badge variant="destructive" className="ml-auto gap-1">
                          <Flame className="h-3 w-3" /> DG
                        </Badge>
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                      <span>Capt {m.captainName}</span>
                      <span>{m.isCompleted ? `Done ${formatDate(m.completedAt)}` : `Created ${formatDate(m.createdAt)}`}</span>
                    </div>
                    {instruct && showAll && m.user && (
                      <div className="text-xs text-muted-foreground">
                        Owner: {m.user.rank} {m.user.firstName} {m.user.lastName}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </QueryState>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New mission</DialogTitle>
            <DialogDescription>Crew, route and aircraft. Documents can be attached afterwards.</DialogDescription>
          </DialogHeader>
          <MissionForm submitLabel="Create mission" pending={create.isPending} onSubmit={(v) => create.mutate(v)} onCancel={() => setCreating(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
