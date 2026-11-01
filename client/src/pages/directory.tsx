import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Phone, Plus, Search, Trash2 } from "lucide-react";
import type { PhoneDirectory } from "@shared/schema";
import { EmptyState, PageHeader, QueryState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DirectoryEntryDialog } from "@/components/directory/DirectoryEntryDialog";
import { usePersona } from "@/lib/persona";
import { del } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";

function matches(entry: PhoneDirectory, q: string): boolean {
  if (!q) return true;
  const hay = [entry.airbaseCode, entry.airbaseName, ...entry.contacts.flatMap((c) => [c.name, c.phoneNumber, c.description])].join(" ").toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => hay.includes(t));
}

export default function Directory() {
  const { can } = usePersona();
  const instruct = can("instruct");
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery<PhoneDirectory[]>({ queryKey: keys.directory.all });
  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState<string[]>([]);
  const [editing, setEditing] = useState<{ entry: PhoneDirectory | null } | null>(null);
  const [deleting, setDeleting] = useState<PhoneDirectory | null>(null);

  const filtered = useMemo(() => (q.data ?? []).filter((e) => matches(e, search.trim())), [q.data, search]);
  // While searching, every match is expanded so the hit is visible.
  const openValues = search.trim() ? filtered.map((e) => String(e.id)) : opened;

  const remove = useMutation({
    mutationFn: (id: number) => del<{ id: number }>(`/api/directory/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.directory.all });
      toast({ title: "Entry deleted" });
      setDeleting(null);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not delete entry", description: e.message }),
  });

  return (
    <>
      <PageHeader
        eyebrow="Operate"
        title="Airbase directory"
        description="Ops desks, movements, fuel and DG contacts for every base the fleet uses."
        actions={
          instruct && (
            <Button onClick={() => setEditing({ entry: null })}>
              <Plus className="mr-2 h-4 w-4" /> Add airbase
            </Button>
          )
        }
      />

      <div className="relative mb-4 max-w-md">
        <Label htmlFor="dir-search" className="sr-only">
          Search directory
        </Label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id="dir-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search base, ICAO code, contact or number" className="pl-9" />
      </div>

      <QueryState query={q} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No airbases yet" description={instruct ? "Add the first airbase and its contacts." : "Instructors haven't added any airbases yet."} />}>
        {() =>
          filtered.length === 0 ? (
            <EmptyState icon={<Search className="h-8 w-8" />} title="No matches" description={`Nothing matches “${search}”.`} />
          ) : (
            <Accordion type="multiple" value={openValues} onValueChange={(v) => !search.trim() && setOpened(v)} className="space-y-2">
              {filtered.map((e) => (
                <AccordionItem key={e.id} value={String(e.id)} className="rounded-lg border border-border/60 bg-card/60 px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex min-w-0 items-center gap-3 text-left">
                      <Badge variant="outline" className="shrink-0 font-mono">{e.airbaseCode}</Badge>
                      <span className="truncate font-medium">{e.airbaseName}</span>
                      <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
                        {e.contacts.length} contact{e.contacts.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {e.contacts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No contacts listed.</p>
                    ) : (
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {e.contacts.map((c) => (
                          <li key={c.id} className="rounded-md border border-border/60 bg-background/40 p-3">
                            <div className="font-medium">{c.name}</div>
                            <a href={`tel:${c.phoneNumber.replace(/[^\d+]/g, "")}`} className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                              <Phone className="h-3.5 w-3.5" /> {c.phoneNumber}
                            </a>
                            {c.description && <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {instruct && (
                      <div className="mt-3 flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing({ entry: e })}>
                          <Pencil className="mr-1.5 h-4 w-4" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleting(e)}>
                          <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )
        }
      </QueryState>

      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" /> Numbers are fictional demo data.
      </p>

      {instruct && <DirectoryEntryDialog open={editing !== null} entry={editing?.entry ?? null} onOpenChange={(o) => !o && setEditing(null)} />}

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.airbaseName}?</AlertDialogTitle>
            <AlertDialogDescription>The airbase and all of its contacts will be removed from the directory.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleting && remove.mutate(deleting.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
