import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/**
 * Multiple-choice options with a radio marking the correct one. Used by the
 * question bank, scenario questions and module assessments.
 */
export function OptionsEditor({
  idPrefix,
  options,
  correctIndex,
  onChange,
  min = 2,
  max = 6,
  disabled,
}: {
  idPrefix: string;
  options: string[];
  correctIndex: number;
  onChange: (options: string[], correctIndex: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const setOption = (i: number, text: string) => {
    const next = options.slice();
    next[i] = text;
    onChange(next, correctIndex);
  };
  const remove = (i: number) => {
    const next = options.filter((_, idx) => idx !== i);
    let correct = correctIndex;
    if (i === correctIndex) correct = 0;
    else if (i < correctIndex) correct = correctIndex - 1;
    onChange(next, Math.min(correct, Math.max(0, next.length - 1)));
  };

  return (
    <div className="space-y-2">
      <RadioGroup value={String(correctIndex)} onValueChange={(v) => onChange(options, Number(v))} disabled={disabled}>
        {options.map((opt, i) => {
          const id = `${idPrefix}-opt-${i}`;
          return (
            <div key={i} className="flex items-center gap-2">
              <RadioGroupItem value={String(i)} id={`${id}-correct`} aria-label={`Mark option ${i + 1} as correct`} />
              <Label htmlFor={id} className="sr-only">
                Option {i + 1}
              </Label>
              <Input
                id={id}
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                disabled={disabled}
                className={i === correctIndex ? "border-emerald-500/60" : undefined}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(i)}
                disabled={disabled || options.length <= min}
                aria-label={`Remove option ${i + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </RadioGroup>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Select the radio next to the correct answer.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...options, ""], correctIndex)}
          disabled={disabled || options.length >= max}
        >
          <Plus className="h-4 w-4" /> Add option
        </Button>
      </div>
    </div>
  );
}
