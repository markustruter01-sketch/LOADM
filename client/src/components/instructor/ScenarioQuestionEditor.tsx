import type { UseFormReturn } from "react-hook-form";
import type { InsertScenario } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OptionsEditor } from "./OptionsEditor";
import { RowControls } from "./shared";

/** One scenario question inside the scenario editor's field array. */
export function ScenarioQuestionEditor({
  form,
  index,
  count,
  onMove,
  onRemove,
}: {
  form: UseFormReturn<InsertScenario>;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  const type = form.watch(`questions.${index}.questionType`);
  const options = form.watch(`questions.${index}.options`);
  const correctAnswer = form.watch(`questions.${index}.correctAnswer`);
  const correctIndex = options.indexOf(correctAnswer);

  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="pt-2 text-sm font-semibold text-muted-foreground">Question {index + 1}</div>
          <RowControls index={index} count={count} onMove={onMove} onRemove={onRemove} disabledRemove={count <= 1} />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
          <FormField
            control={form.control}
            name={`questions.${index}.question`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`questions.${index}.questionType`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    if (v === "multiple-choice" && options.length < 2) {
                      form.setValue(`questions.${index}.options`, ["", "", ""]);
                      form.setValue(`questions.${index}.correctAnswer`, "");
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="multiple-choice">Multiple choice</SelectItem>
                    <SelectItem value="free-text">Free text</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {type === "multiple-choice" ? (
          <FormField
            control={form.control}
            name={`questions.${index}.options`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Options</FormLabel>
                <OptionsEditor
                  idPrefix={`sq-${index}`}
                  options={field.value}
                  correctIndex={correctIndex}
                  onChange={(opts, ci) => {
                    field.onChange(opts);
                    form.setValue(`questions.${index}.correctAnswer`, opts[ci] ?? "", { shouldValidate: form.formState.isSubmitted });
                  }}
                />
                <FormMessage />
                {form.formState.errors.questions?.[index]?.correctAnswer && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.questions[index]?.correctAnswer?.message}</p>
                )}
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name={`questions.${index}.correctAnswer`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model answer</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="What a complete answer covers. Shown to the reviewer while marking." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}
