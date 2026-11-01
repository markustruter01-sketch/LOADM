import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { updateUserProfileSchema, type PublicUser } from "@shared/schema";
import { CATEGORIES, NOT_READY_REASONS, SQUADRONS, SQUADRON_LABELS, ROLE_LABELS } from "@shared/constants";
import { patch, put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatDateTime } from "@/components/common";

const profileFormSchema = updateUserProfileSchema.required();
type ProfileFormValues = z.infer<typeof profileFormSchema>;

function useInvalidateMe() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: keys.users.me });
    qc.invalidateQueries({ queryKey: keys.demo.me });
  };
}

export function ProfilePhoto({ user }: { user: PublicUser }) {
  return (
    <div className="flex items-center gap-4">
      <UserAvatar className="h-20 w-20" />
      <div>
        <div className="font-medium">
          {user.rank} {user.firstName} {user.lastName}
        </div>
        <div className="text-sm text-muted-foreground">
          {ROLE_LABELS[user.role]} · {SQUADRON_LABELS[user.squadron]}
        </div>
      </div>
    </div>
  );
}

export function ProfileDetailsForm({ user }: { user: PublicUser }) {
  const { toast } = useToast();
  const invalidate = useInvalidateMe();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName, rank: user.rank, squadron: user.squadron, category: user.category },
  });
  useEffect(() => {
    form.reset({ firstName: user.firstName, lastName: user.lastName, rank: user.rank, squadron: user.squadron, category: user.category });
  }, [user, form]);

  const save = useMutation({
    mutationFn: (body: ProfileFormValues) => patch<PublicUser>("/api/users/me", body),
    onSuccess: () => {
      invalidate();
      toast({ title: "Profile saved" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not save profile", description: e.message }),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First name</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="given-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last name</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="family-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rank</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      Category {c}
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
          name="squadron"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Squadron</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select squadron" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SQUADRONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SQUADRON_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={save.isPending || !form.formState.isDirty}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

type NotReadyReason = (typeof NOT_READY_REASONS)[number];

export function ReadinessCard({ user }: { user: PublicUser }) {
  const { toast } = useToast();
  const invalidate = useInvalidateMe();
  const [ready, setReady] = useState(user.isFlightReady);
  const [reason, setReason] = useState<NotReadyReason | "">((user.notReadyReason as NotReadyReason | null) ?? "");
  useEffect(() => {
    setReady(user.isFlightReady);
    setReason((user.notReadyReason as NotReadyReason | null) ?? "");
  }, [user]);

  const save = useMutation({
    mutationFn: (body: { isFlightReady: boolean; notReadyReason: NotReadyReason | null }) => put<PublicUser>("/api/users/me/readiness", body),
    onSuccess: () => {
      invalidate();
      toast({ title: "Readiness updated" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not update readiness", description: e.message }),
  });

  const dirty = ready !== user.isFlightReady || (!ready && reason !== (user.notReadyReason ?? ""));
  const valid = ready || reason !== "";

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Flight readiness</CardTitle>
        <CardDescription>
          {user.readinessUpdatedAt ? `Last updated ${formatDateTime(user.readinessUpdatedAt)}` : "Tell the squadron whether you are available to fly."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="flight-ready" className="flex flex-col gap-0.5">
            <span className="font-medium">{ready ? "Ready to fly" : "Not ready"}</span>
            <span className="text-xs font-normal text-muted-foreground">Counts toward squadron readiness.</span>
          </Label>
          <Switch id="flight-ready" checked={ready} onCheckedChange={setReady} aria-label="Flight ready" />
        </div>
        {!ready && (
          <div className="space-y-1.5">
            <Label htmlFor="not-ready-reason">Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as NotReadyReason)}>
              <SelectTrigger id="not-ready-reason">
                <SelectValue placeholder="Select a reason" />
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
        <Button
          size="sm"
          disabled={!dirty || !valid || save.isPending}
          onClick={() => save.mutate({ isFlightReady: ready, notReadyReason: ready ? null : (reason as NotReadyReason) })}
        >
          {save.isPending ? "Saving…" : "Update readiness"}
        </Button>
      </CardContent>
    </Card>
  );
}
