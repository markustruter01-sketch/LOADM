import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AIRCRAFT_LABELS, AIRCRAFT_TYPES, DIFFICULTIES, THRESHOLDS, type AircraftType } from "@shared/constants";
import { insertTrainingModuleSchema, type InsertTrainingModule, type TrainingModule } from "@shared/schema";
import { post, put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TagInput } from "./TagInput";
import { NullableNumberInput } from "./shared";

const GENERAL = "general";

function toForm(m: TrainingModule | null): InsertTrainingModule {
  if (!m) return { title: "", description: "", aircraft: null, difficulty: "beginner", durationMinutes: 30, topics: [], objectives: [], passingThreshold: THRESHOLDS.DEFAULT_PASS_MARK, isActive: true };
  return {
    title: m.title,
    description: m.description,
    aircraft: m.aircraft,
    difficulty: m.difficulty,
    durationMinutes: m.durationMinutes,
    topics: m.topics.slice(),
    objectives: m.objectives.slice(),
    passingThreshold: m.passingThreshold ?? THRESHOLDS.DEFAULT_PASS_MARK,
    isActive: m.isActive,
  };
}

/** Module metadata form. On create, navigates to the new module so content can be added. */
export function ModuleForm({ module }: { module: TrainingModule | null }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const form = useForm<InsertTrainingModule>({ resolver: zodResolver(insertTrainingModuleSchema), defaultValues: toForm(module) });

  const save = useMutation({
    mutationFn: (body: InsertTrainingModule) => (module ? put<TrainingModule>(`/api/training/modules/${module.id}`, body) : post<TrainingModule>("/api/training/modules", body)),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: keys.training.all });
      qc.invalidateQueries({ queryKey: keys.training.module(row.id) });
      toast({ title: module ? "Module saved" : "Module created", description: module ? undefined : "Now add readings and an assessment." });
      if (!module) navigate(`/instructor/modules/${row.id}`);
      else form.reset(toForm(row));
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not save module", description: e.message }),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => save.mutate({ ...v, title: v.title.trim() }))}>
        <Card className="border-border/60 bg-card/60">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="aircraft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aircraft</FormLabel>
                    <Select value={field.value ?? GENERAL} onValueChange={(v) => field.onChange(v === GENERAL ? null : (v as AircraftType))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={GENERAL}>General</SelectItem>
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
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select value={field.value ?? "beginner"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DIFFICULTIES.map((d) => (
                          <SelectItem key={d} value={d} className="capitalize">
                            {d}
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
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <NullableNumberInput min={1} value={field.value} onChange={(v) => field.onChange(v ?? 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passingThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pass mark (%)</FormLabel>
                    <FormControl>
                      <NullableNumberInput min={0} max={100} value={field.value} onChange={field.onChange} placeholder={String(THRESHOLDS.DEFAULT_PASS_MARK)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="topics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topics</FormLabel>
                    <FormControl>
                      <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Add a topic and press Enter" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="objectives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learning objectives</FormLabel>
                    <FormControl>
                      <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Add an objective and press Enter" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div>
                      <FormLabel>Active</FormLabel>
                      <FormDescription>Inactive modules are hidden from students.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => navigate("/instructor/modules")}>
                  {module ? "Back" : "Cancel"}
                </Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? "Saving…" : module ? "Save module" : "Create module"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
