import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Plus } from "lucide-react";
import { CHECKLIST_AIRCRAFT, CHECKLIST_CATEGORIES } from "@shared/constants";
import { insertChecklistSchema, type InsertChecklist, type Checklist } from "@shared/schema";
import { post, put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, QueryState, Section } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RowControls, aircraftLabel } from "@/components/instructor/shared";
import type { ChecklistListItem } from "../types";

type Item = InsertChecklist["items"][number];
const blankItem = (section = ""): Item => ({ itemText: "", isRequired: true, section });

function toForm(c: ChecklistListItem | null): InsertChecklist {
  if (!c) return { title: "", description: "", aircraftType: "General", category: "startup", isActive: true, enforceLinearProgression: false, items: [blankItem()] };
  return {
    title: c.title,
    description: c.description ?? "",
    aircraftType: c.aircraftType,
    category: c.category,
    isActive: c.isActive,
    enforceLinearProgression: c.enforceLinearProgression,
    items: c.items
      .slice()
      .sort((a, b) => a.itemOrder - b.itemOrder)
      .map((i) => ({ itemText: i.itemText, isRequired: i.isRequired, section: i.section ?? "" })),
  };
}

function ChecklistForm({ checklist }: { checklist: ChecklistListItem | null }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const form = useForm<InsertChecklist>({ resolver: zodResolver(insertChecklistSchema), defaultValues: toForm(checklist) });
  const items = useFieldArray({ control: form.control, name: "items" });

  const save = useMutation({
    mutationFn: (body: InsertChecklist) => (checklist ? put<Checklist>(`/api/checklists/${checklist.id}`, body) : post<Checklist>("/api/checklists", body)),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: keys.checklists.all });
      qc.invalidateQueries({ queryKey: keys.checklists.manage });
      qc.invalidateQueries({ queryKey: keys.checklists.one(row.id) });
      toast({ title: checklist ? "Checklist updated" : "Checklist created" });
      navigate("/instructor/checklists");
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not save checklist", description: e.message }),
  });

  // The full item list is always sent, so a PUT replaces every item in order.
  const onSubmit = (v: InsertChecklist) =>
    save.mutate({
      ...v,
      title: v.title.trim(),
      description: v.description?.trim() ? v.description.trim() : null,
      items: v.items.map((i) => ({ itemText: i.itemText.trim(), isRequired: i.isRequired ?? true, section: i.section?.trim() ? i.section.trim() : null })),
    });

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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="aircraftType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aircraft</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CHECKLIST_AIRCRAFT.map((a) => (
                          <SelectItem key={a} value={a}>
                            {aircraftLabel(a)}
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value ?? "startup"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CHECKLIST_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c} className="capitalize">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="enforceLinearProgression"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3">
                    <div>
                      <FormLabel>Enforce linear progression</FormLabel>
                      <FormDescription>Items must be ticked in order.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3">
                    <div>
                      <FormLabel>Active</FormLabel>
                      <FormDescription>Inactive checklists are hidden from crews.</FormDescription>
                    </div>
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
          title="Items"
          description="Group items with an optional section heading. Required items must be ticked for the checklist to count as complete."
          actions={
            <Button type="button" variant="outline" size="sm" onClick={() => items.append(blankItem(form.getValues(`items.${items.fields.length - 1}.section`) ?? ""))}>
              <Plus className="h-4 w-4" /> Add item
            </Button>
          }
        >
          <Card className="border-border/60 bg-card/60">
            <CardContent className="divide-y divide-border/60 p-0">
              {items.fields.map((f, i) => (
                <div key={f.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
                  <div className="w-6 pt-2 text-sm tabular-nums text-muted-foreground">{i + 1}</div>
                  <FormField
                    control={form.control}
                    name={`items.${i}.section`}
                    render={({ field }) => (
                      <FormItem className="sm:w-44">
                        <FormLabel className="sr-only">Section for item {i + 1}</FormLabel>
                        <FormControl>
                          <Input placeholder="Section" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${i}.itemText`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="sr-only">Item {i + 1}</FormLabel>
                        <FormControl>
                          <Input placeholder="Check item" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${i}.isRequired`}
                    render={({ field }) => (
                      <FormItem className="flex h-10 items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value ?? true} onCheckedChange={(v) => field.onChange(v === true)} />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">Required</FormLabel>
                      </FormItem>
                    )}
                  />
                  <RowControls index={i} count={items.fields.length} onMove={(a, b) => items.move(a, b)} onRemove={(idx) => items.remove(idx)} disabledRemove={items.fields.length <= 1} />
                </div>
              ))}
            </CardContent>
          </Card>
          {form.formState.errors.items?.message && <p className="mt-2 text-sm font-medium text-destructive">{form.formState.errors.items.message}</p>}
        </Section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/instructor/checklists")}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : checklist ? "Save changes" : "Create checklist"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function ChecklistEditor() {
  const { id: idParam } = useParams<{ id?: string }>();
  const id = idParam ? Number(idParam) : null;
  const checklist = useQuery<ChecklistListItem>({ queryKey: keys.checklists.one(id ?? 0), enabled: id !== null });

  return (
    <>
      <PageHeader backHref="/instructor/checklists" title={id ? "Edit checklist" : "New checklist"} description="Items are saved in the order shown." />
      {id === null ? <ChecklistForm checklist={null} /> : <QueryState query={checklist}>{(c) => <ChecklistForm key={c.id} checklist={c} />}</QueryState>}
    </>
  );
}
