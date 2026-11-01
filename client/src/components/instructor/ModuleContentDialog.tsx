import { useEffect } from "react";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus } from "lucide-react";
import { MODULE_CONTENT_TYPES } from "@shared/constants";
import { insertTrainingModuleContentSchema, type InsertTrainingModuleContent, type TrainingModuleContent } from "@shared/schema";
import { post, put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { OptionsEditor } from "./OptionsEditor";
import { NullableNumberInput, RowControls, newId } from "./shared";

/**
 * The shared insert schema, tightened for editing: nullable fields become
 * plain strings / arrays so inputs stay controlled, and are mapped back on submit.
 */
const questionSchema = insertTrainingModuleContentSchema.shape.questions.unwrap().unwrap().element;
const contentFormSchema = insertTrainingModuleContentSchema.extend({
  durationMinutes: z.number().int().min(1),
  description: z.string(),
  body: z.string(),
  questions: z.array(questionSchema),
  isActive: z.boolean(),
});
type ContentForm = z.infer<typeof contentFormSchema>;
type ContentQuestion = ContentForm["questions"][number];

const TYPE_LABELS: Record<ContentForm["type"], string> = { reading: "Reading", quiz: "Knowledge check", assessment: "Assessment" };
const blankQuestion = (): ContentQuestion => ({ id: newId("mq"), question: "", options: ["", "", ""], correctIndex: 0 });

function toForm(c: TrainingModuleContent | null): ContentForm {
  if (!c) return { title: "", type: "reading", durationMinutes: 10, description: "", body: "", questions: [], isActive: true };
  return {
    title: c.title,
    type: c.type,
    durationMinutes: c.durationMinutes,
    description: c.description,
    body: c.body ?? "",
    questions: (c.questions ?? []).map((q) => ({ ...q, options: q.options.slice() })),
    isActive: c.isActive,
  };
}

function QuestionsBuilder({ form }: { form: UseFormReturn<ContentForm> }) {
  const qs = useFieldArray({ control: form.control, name: "questions", keyName: "_key" });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Questions</div>
        <Button type="button" variant="outline" size="sm" onClick={() => qs.append(blankQuestion())}>
          <Plus className="h-4 w-4" /> Add question
        </Button>
      </div>
      {qs.fields.length === 0 && <p className="text-sm text-muted-foreground">No questions yet.</p>}
      {qs.fields.map((f, i) => (
        <Card key={f._key} className="border-border/60 bg-background/40">
          <CardContent className="space-y-3 p-3">
            <div className="flex items-start gap-2">
              <FormField
                control={form.control}
                name={`questions.${i}.question`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Question {i + 1}</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-6">
                <RowControls index={i} count={qs.fields.length} onMove={(a, b) => qs.move(a, b)} onRemove={(idx) => qs.remove(idx)} />
              </div>
            </div>
            <FormField
              control={form.control}
              name={`questions.${i}.options`}
              render={({ field }) => (
                <FormItem>
                  <OptionsEditor
                    idPrefix={`mq-${i}`}
                    options={field.value}
                    correctIndex={form.watch(`questions.${i}.correctIndex`)}
                    onChange={(opts, ci) => {
                      field.onChange(opts);
                      form.setValue(`questions.${i}.correctIndex`, ci);
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Add or edit one content item of a training module. `content` null = create. */
export function ModuleContentDialog({
  moduleId,
  content,
  nextOrderIndex,
  open,
  onOpenChange,
}: {
  moduleId: number;
  content: TrainingModuleContent | null;
  nextOrderIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const form = useForm<ContentForm>({ resolver: zodResolver(contentFormSchema), defaultValues: toForm(content) });
  const type = form.watch("type");

  useEffect(() => {
    if (open) form.reset(toForm(content));
  }, [open, content, form]);

  const save = useMutation({
    mutationFn: (body: InsertTrainingModuleContent) =>
      content
        ? put<TrainingModuleContent>(`/api/training/modules/${moduleId}/content/${content.id}`, body)
        : post<TrainingModuleContent>(`/api/training/modules/${moduleId}/content`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.training.module(moduleId) });
      qc.invalidateQueries({ queryKey: keys.training.all });
      toast({ title: content ? "Content updated" : "Content added" });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not save content", description: e.message }),
  });

  const onSubmit = (v: ContentForm) => {
    const graded = v.type === "quiz" || v.type === "assessment";
    if (graded && v.questions.length === 0) {
      form.setError("questions", { message: "Add at least one question" });
      return;
    }
    const questions = graded ? v.questions.map((q) => ({ ...q, question: q.question.trim(), options: q.options.map((o) => o.trim()) })) : null;
    if (questions?.some((q) => q.options.some((o) => !o))) {
      form.setError("questions", { message: "Every option needs text" });
      return;
    }
    save.mutate({
      title: v.title.trim(),
      type: v.type,
      durationMinutes: v.durationMinutes,
      description: v.description.trim(),
      body: v.type === "reading" ? v.body : null,
      questions,
      isActive: v.isActive,
      ...(content ? {} : { orderIndex: nextOrderIndex }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{content ? "Edit content" : "Add content"}</DialogTitle>
          <DialogDescription>Readings use Markdown. The first assessment or knowledge check is what students are graded on.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_11rem_8rem]">
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODULE_CONTENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TYPE_LABELS[t]}
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
                    <FormLabel>Minutes</FormLabel>
                    <FormControl>
                      <NullableNumberInput min={1} value={field.value} onChange={(v) => field.onChange(v ?? 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {type === "reading" && (
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body (Markdown)</FormLabel>
                    <FormControl>
                      <Textarea rows={12} className="font-mono text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {(type === "quiz" || type === "assessment") && (
              <>
                <QuestionsBuilder form={form} />
                {form.formState.errors.questions?.message && <p className="text-sm font-medium text-destructive">{form.formState.errors.questions.message}</p>}
              </>
            )}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border border-border/60 p-3">
                  <FormLabel className="mt-0">Visible to students</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : content ? "Save changes" : "Add content"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
