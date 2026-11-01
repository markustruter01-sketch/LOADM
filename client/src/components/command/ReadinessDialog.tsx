import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NOT_READY_REASONS } from "@shared/constants";
import type { PublicUser } from "@shared/schema";
import { put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { personName } from "@/components/command/charts";

/** Mirrors the server's readiness body (PUT /api/users/:id/readiness). */
const readinessFormSchema = z
  .object({ isFlightReady: z.boolean(), notReadyReason: z.enum(NOT_READY_REASONS).nullable() })
  .refine((b) => b.isFlightReady || !!b.notReadyReason, { message: "A reason is required when not ready", path: ["notReadyReason"] });
type ReadinessForm = z.infer<typeof readinessFormSchema>;

function isReason(v: string | null): v is (typeof NOT_READY_REASONS)[number] {
  return v !== null && (NOT_READY_REASONS as readonly string[]).includes(v);
}

/** Override a person's flight-ready flag. Expired qualifications still make them not ready regardless. */
export function ReadinessDialog({ user, onClose }: { user: PublicUser | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const form = useForm<ReadinessForm>({
    resolver: zodResolver(readinessFormSchema),
    defaultValues: { isFlightReady: true, notReadyReason: null },
  });

  useEffect(() => {
    if (user) form.reset({ isFlightReady: user.isFlightReady, notReadyReason: isReason(user.notReadyReason) ? user.notReadyReason : null });
  }, [user, form]);

  const save = useMutation({
    mutationFn: (body: ReadinessForm) =>
      put<PublicUser>(`/api/users/${user?.id ?? 0}/readiness`, { isFlightReady: body.isFlightReady, notReadyReason: body.isFlightReady ? null : body.notReadyReason }),
    onSuccess: (u) => {
      qc.invalidateQueries({ queryKey: keys.users.all });
      qc.invalidateQueries({ queryKey: keys.personnel.all });
      qc.invalidateQueries({ queryKey: keys.analytics.all });
      qc.invalidateQueries({ queryKey: keys.demo.me });
      toast({ title: "Readiness updated", description: `${personName(u)} is now ${u.isFlightReady ? "flight-ready" : "not ready"}.` });
      onClose();
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not update readiness", description: e.message }),
  });

  const ready = form.watch("isFlightReady");

  return (
    <Dialog open={user !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Readiness override</DialogTitle>
          <DialogDescription>{user ? `Set flight readiness for ${personName(user)}.` : ""}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <FormField
              control={form.control}
              name="isFlightReady"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-3">
                  <div>
                    <FormLabel>Flight ready</FormLabel>
                    <FormDescription>Expired qualifications still count against readiness.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            {!ready && (
              <FormField
                control={form.control}
                name="notReadyReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <Select value={field.value ?? undefined} onValueChange={(v) => field.onChange(isReason(v) ? v : null)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NOT_READY_REASONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
