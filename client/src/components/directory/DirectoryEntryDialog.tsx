import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { insertPhoneDirectorySchema, type InsertPhoneDirectory, type PhoneDirectory } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { post, put } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";

const newContact = () => ({ id: crypto.randomUUID(), name: "", phoneNumber: "", description: "" });

function toValues(entry: PhoneDirectory | null): InsertPhoneDirectory {
  if (!entry) return { airbaseCode: "", airbaseName: "", contacts: [newContact()] };
  return {
    airbaseCode: entry.airbaseCode,
    airbaseName: entry.airbaseName,
    contacts: entry.contacts.map((c) => ({ ...c, id: c.id || crypto.randomUUID(), description: c.description ?? "" })),
  };
}

export function DirectoryEntryDialog({ open, entry, onOpenChange }: { open: boolean; entry: PhoneDirectory | null; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const form = useForm<InsertPhoneDirectory>({ resolver: zodResolver(insertPhoneDirectorySchema), defaultValues: toValues(entry) });
  const contacts = useFieldArray<InsertPhoneDirectory, "contacts", "key">({ control: form.control, name: "contacts", keyName: "key" });

  useEffect(() => {
    if (open) form.reset(toValues(entry));
  }, [open, entry, form]);

  const save = useMutation({
    mutationFn: (body: InsertPhoneDirectory) => (entry ? put<PhoneDirectory>(`/api/directory/${entry.id}`, body) : post<PhoneDirectory>("/api/directory", body)),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: keys.directory.all });
      toast({ title: entry ? "Entry updated" : "Entry added", description: row.airbaseName });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not save entry", description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{entry ? `Edit ${entry.airbaseName}` : "Add airbase"}</DialogTitle>
          <DialogDescription>Airbase details and the contacts crews need on arrival.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
              <FormField
                control={form.control}
                name="airbaseCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ICAO code</FormLabel>
                    <FormControl>
                      <Input placeholder="YAMB" className="uppercase" maxLength={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="airbaseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Airbase name</FormLabel>
                    <FormControl>
                      <Input placeholder="RAAF Base Amberley" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Contacts</h3>
                <Button type="button" size="sm" variant="secondary" onClick={() => contacts.append(newContact())}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add contact
                </Button>
              </div>
              {contacts.fields.length === 0 && <p className="text-sm text-muted-foreground">No contacts. Add at least the ops desk.</p>}
              {contacts.fields.map((c, i) => (
                <div key={c.key} className="grid gap-2 rounded-md border border-border/60 p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <FormField
                    control={form.control}
                    name={`contacts.${i}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Name / role</FormLabel>
                        <FormControl>
                          <Input placeholder="Base Ops" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`contacts.${i}.phoneNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+61 7 5361 0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end">
                    <Button type="button" variant="ghost" size="icon" aria-label="Remove contact" className="text-muted-foreground hover:text-destructive" onClick={() => contacts.remove(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name={`contacts.${i}.description`}
                    render={({ field }) => (
                      <FormItem className="sm:col-span-3">
                        <FormLabel className="text-xs">Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="24/7, ask for duty loadmaster" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : entry ? "Save changes" : "Add airbase"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
