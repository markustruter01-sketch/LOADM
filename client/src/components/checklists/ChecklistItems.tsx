import type { ChecklistItem } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/** Group items by `section`, keeping the item order (consecutive runs of the same section). */
export function groupBySection(items: ChecklistItem[]): Array<{ section: string | null; items: ChecklistItem[] }> {
  const groups: Array<{ section: string | null; items: ChecklistItem[] }> = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.section === (item.section ?? null)) last.items.push(item);
    else groups.push({ section: item.section ?? null, items: [item] });
  }
  return groups;
}

export function ChecklistItemsList({
  items,
  completed,
  isEnabled,
  onToggle,
}: {
  items: ChecklistItem[];
  completed: Set<number>;
  isEnabled: (item: ChecklistItem) => boolean;
  onToggle: (item: ChecklistItem, checked: boolean) => void;
}) {
  const groups = groupBySection(items);
  let n = 0;
  return (
    <div className="space-y-6">
      {groups.map((g, gi) => (
        <section key={`${g.section ?? "items"}-${gi}`}>
          {g.section && <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{g.section}</h2>}
          <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card/60">
            {g.items.map((item) => {
              n += 1;
              const checked = completed.has(item.id);
              const enabled = isEnabled(item);
              const id = `item-${item.id}`;
              return (
                <li key={item.id} className={cn("flex items-start gap-3 px-4 py-3 transition-colors", checked && "bg-emerald-500/5", !enabled && !checked && "opacity-50")}>
                  <Checkbox
                    id={id}
                    checked={checked}
                    disabled={!enabled}
                    onCheckedChange={(c) => onToggle(item, c === true)}
                    className="mt-0.5 h-5 w-5"
                  />
                  <Label htmlFor={id} className={cn("flex-1 cursor-pointer text-sm font-normal leading-snug", checked && "text-muted-foreground line-through", !enabled && "cursor-not-allowed")}>
                    <span className="mr-2 tabular-nums text-muted-foreground">{n}.</span>
                    {item.itemText}
                    {!item.isRequired && <span className="ml-2 text-xs text-muted-foreground">(optional)</span>}
                  </Label>
                  {!enabled && !checked && <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Complete the previous item first" />}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
