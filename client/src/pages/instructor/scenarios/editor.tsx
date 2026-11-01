import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Plus } from "lucide-react";
import { AIRCRAFT_LABELS, AIRCRAFT_TYPES, THRESHOLDS, type AircraftType } from "@shared/constants";
import { insertScenarioSchema, type InsertScenario, type Scenario } from "@shared/schema";
import { post, put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, QueryState, Section } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScenarioQuestionEditor } from "@/components/instructor/ScenarioQuestionEditor";
import { NullableNumberInput, newId } from "@/components/instructor/shared";

const ANY = "any";
type Question = InsertScenario["questions"][number];

const blankQuestion = (): Question => ({ id: newId(), question: "", questionType: "free-text", options: [], correctAnswer: "" });

function toForm(s: Scenario | null): InsertScenario {
  if (!s) return { title: "", description: "", aircraft: null, questions: [blankQuestion()], passingThreshold: THRESHOLDS.DEFAULT_PASS_MARK, isActive: true };
  return {
    title: s.title,
    description: s.description,
    aircraft: s.aircraft,
    questions: s.questions.map((q) => ({ ...q, options: q.options.slice() })),
    passingThreshold: s.passingThreshold ?? THRESHOLDS.DEFAULT_PASS_MARK,
    isActive: s.isActive,
  };
}

function ScenarioForm({ scenario }: { scenario: Scenario | null }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const form = useForm<InsertScenario>({ resolver: zodResolver(insertScenarioSchema), defaultValues: toForm(scenario) });
  // keyName avoids clobbering each question's own `id` field.
  const questions = useFieldArray({ control: form.control, name: "questions", keyName: "_key" });

  const save = useMutation({
    mutationFn: (body: InsertScenario) => (scenario ? put<Scenario>(`/api/scenarios/${scenario.id}`, body) : post<Scenario>("/api/scenarios", body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.scenarios.all });
      toast({ title: scenario ? "Scenario updated" : "Scenario created" });
      navigate("/instructor/scenarios");
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not save scenario", description: e.message }),
  });

  const onSubmit = (v: InsertScenario) => {
    // Multiple-choice needs at least two non-empty options and a marked answer.
    let ok = true;
    const cleaned = v.questions.map((q, i): Question => {
      if (q.questionType === "free-text") return { ...q, options: [] };
      const opts = q.options.map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) {
        form.setError(`questions.${i}.options`, { message: "Add at least two options" });
        ok = false;
      }
      if (!q.correctAnswer.trim() || !opts.includes(q.correctAnswer.trim())) {
        form.setError(`questions.${i}.correctAnswer`, { message: "Mark the correct option" });
        ok = false;
      }
      return { ...q, options: opts, correctAnswer: q.correctAnswer.trim() };
    });
    if (!ok) return;
    save.mutate({ ...v, questions: cleaned });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormLabel>Scenario brief</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="The situation the student is placed in." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="aircraft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aircraft</FormLabel>
                    <Select value={field.value ?? ANY} onValueChange={(v) => field.onChange(v === ANY ? null : (v as AircraftType))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ANY}>Any aircraft</SelectItem>
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
                name="passingThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pass mark (%)</FormLabel>
                    <FormControl>
                      <NullableNumberInput min={0} max={100} value={field.value} onChange={field.onChange} placeholder={String(THRESHOLDS.DEFAULT_PASS_MARK)} />
                    </FormControl>
                    <FormDescription>Blank uses {THRESHOLDS.DEFAULT_PASS_MARK}%.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border border-border/60 p-3 sm:mt-8 sm:self-start">
                    <FormLabel className="mt-0">Active</FormLabel>
                    <FormControl>
                      <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Section
          title="Questions"
          description="Free-text answers are marked by an instructor against the model answer."
          actions={
            <Button type="button" variant="outline" size="sm" onClick={() => questions.append(blankQuestion())}>
              <Plus className="h-4 w-4" /> Add question
            </Button>
          }
        >
          <div className="space-y-3">
            {questions.fields.map((f, i) => (
              <ScenarioQuestionEditor key={f._key} form={form} index={i} count={questions.fields.length} onMove={(from, to) => questions.move(from, to)} onRemove={(idx) => questions.remove(idx)} />
            ))}
          </div>
          {form.formState.errors.questions?.message && <p className="mt-2 text-sm font-medium text-destructive">{form.formState.errors.questions.message}</p>}
        </Section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/instructor/scenarios")}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : scenario ? "Save changes" : "Create scenario"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function ScenarioEditor() {
  const { id: idParam } = useParams<{ id?: string }>();
  const id = idParam ? Number(idParam) : null;
  const scenario = useQuery<Scenario>({ queryKey: keys.scenarios.one(id ?? 0), enabled: id !== null });

  return (
    <>
      <PageHeader backHref="/instructor/scenarios" title={id ? "Edit scenario" : "New scenario"} description="Write the brief, then the questions students answer." />
      {id === null ? <ScenarioForm scenario={null} /> : <QueryState query={scenario}>{(s) => <ScenarioForm key={s.id} scenario={s} />}</QueryState>}
    </>
  );
}
