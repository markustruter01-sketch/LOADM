import { z } from "zod";
import type { Control } from "react-hook-form";
import type { FormField as TemplateField } from "@shared/schema";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Raw form state: text-like inputs hold strings, checkboxes hold booleans. */
export type DynamicValues = Record<string, string | boolean>;

/** Build a zod schema at runtime from a template's field list. */
export function buildSchema(fields: TemplateField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    if (f.type === "checkbox") {
      shape[f.id] = f.required ? z.boolean().refine((v) => v === true, { message: `${f.label} must be ticked` }) : z.boolean();
    } else if (f.type === "number") {
      const num = z.string().trim().refine((v) => v === "" || Number.isFinite(Number(v)), { message: "Enter a number" });
      shape[f.id] = f.required ? num.refine((v) => v !== "", { message: `${f.label} is required` }) : num;
    } else if (f.type === "select" && f.options?.length) {
      const opts = f.options;
      const sel = z.string().refine((v) => v === "" || opts.includes(v), { message: "Choose one of the options" });
      shape[f.id] = f.required ? sel.refine((v) => v !== "", { message: `${f.label} is required` }) : sel;
    } else {
      shape[f.id] = f.required ? z.string().trim().min(1, `${f.label} is required`) : z.string();
    }
  }
  return z.object(shape);
}

export function defaultValuesFor(fields: TemplateField[]): DynamicValues {
  const out: DynamicValues = {};
  for (const f of fields) out[f.id] = f.type === "checkbox" ? false : "";
  return out;
}

/** Convert raw form state to the JSON stored as `formData` (numbers as numbers, blanks dropped). */
export function toFormData(fields: TemplateField[], values: DynamicValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.id];
    if (f.type === "checkbox") out[f.id] = v === true;
    else if (typeof v === "string" && v.trim() !== "") out[f.id] = f.type === "number" ? Number(v) : v.trim();
  }
  return out;
}

export function DynamicFormField({ def, control }: { def: TemplateField; control: Control<DynamicValues> }) {
  const label = (
    <>
      {def.label}
      {def.required && <span className="ml-0.5 text-primary">*</span>}
    </>
  );
  return (
    <FormField
      control={control}
      name={def.id}
      render={({ field }) => {
        if (def.type === "checkbox") {
          return (
            <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border border-border/60 p-3">
              <FormControl>
                <Checkbox checked={field.value === true} onCheckedChange={(c) => field.onChange(c === true)} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>{label}</FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          );
        }
        const strValue = typeof field.value === "string" ? field.value : "";
        return (
          <FormItem className={def.type === "textarea" ? "sm:col-span-2" : undefined}>
            <FormLabel>{label}</FormLabel>
            {def.type === "select" ? (
              <Select value={strValue} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={def.placeholder ?? "Select…"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(def.options ?? []).map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <FormControl>
                {def.type === "textarea" ? (
                  <Textarea rows={4} placeholder={def.placeholder} name={field.name} ref={field.ref} value={strValue} onChange={field.onChange} onBlur={field.onBlur} />
                ) : (
                  <Input
                    type={def.type === "number" ? "number" : def.type === "date" ? "date" : "text"}
                    inputMode={def.type === "number" ? "decimal" : undefined}
                    placeholder={def.placeholder}
                    name={field.name}
                    ref={field.ref}
                    value={strValue}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              </FormControl>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
