import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NOT_READY_REASONS } from "@shared/constants";
import type { PublicUser } from "@shared/schema";
import { put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ReadinessBody = { isFlightReady: boolean; notReadyReason?: string | null };

/** Instructor override of a person's flight-readiness flag (PUT /api/users/:id/readiness). */
export function ReadinessDialog({ user, open, onOpenChange }: { user: PublicUser; open: boolean; onOpenChange: (open: boolean) => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [ready, setReady] = useState(user.isFlightReady);
  const [reason, setReason] = useState<string>(user.notReadyReason ?? "");

  const save = useMutation({
    mutationFn: (body: ReadinessBody) => put<PublicUser>(`/api/users/${user.id}/readiness`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.users.all });
      qc.invalidateQueries({ queryKey: keys.users.profile(user.id) });
      qc.invalidateQueries({ queryKey: keys.personnel.all });
      qc.invalidateQueries({ queryKey: keys.analytics.all });
      toast({ title: "Readiness updated", description: `${user.firstName} ${user.lastName} is now ${ready ? "flight ready" : "not ready"}.` });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not update readiness", description: e.message }),
  });

  const valid = ready || reason !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Readiness override</DialogTitle>
          <DialogDescription>Set whether this person is available to fly. A reason is required when marking not ready.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
            <Label htmlFor="readiness-switch" className="font-medium">
              Flight ready
            </Label>
            <Switch id="readiness-switch" checked={ready} onCheckedChange={setReady} />
          </div>
          {!ready && (
            <div className="space-y-1">
              <Label htmlFor="readiness-reason">Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="readiness-reason">
                  <SelectValue placeholder="Choose a reason" />
                </SelectTrigger>
                <SelectContent>
                  {NOT_READY_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate({ isFlightReady: ready, notReadyReason: ready ? null : reason })} disabled={!valid || save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
