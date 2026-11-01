import { Pencil, Trash2, Flame } from "lucide-react";
import type { Pallet } from "@/types/load-planning";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const CARGO_CATEGORY_LABELS: Record<string, string> = {
  pax: "Passenger bags",
  mechanical: "Mechanical",
  medical: "Medical equipment",
  perishable: "Perishable",
  general: "General cargo",
};

export const DG_CLASS_LABELS: Record<string, string> = {
  "1": "Explosives",
  "2": "Gases",
  "3": "Flammable liquids",
  "4": "Flammable solids",
  "5": "Oxidising substances",
  "6": "Toxic substances",
  "7": "Radioactive material",
  "8": "Corrosives",
  "9": "Miscellaneous",
};

function positionNumber(p: Pallet): number {
  return Number(p.positionLabel?.replace("P", "") ?? 0);
}

export function PalletTable({
  pallets,
  unit,
  toDisplay,
  onEdit,
  onRemove,
}: {
  pallets: Pallet[];
  unit: string;
  toDisplay: (w: number) => number;
  onEdit: (p: Pallet) => void;
  onRemove: (id: number) => void;
}) {
  const rows = pallets.filter((p) => p.location === "cargo").sort((a, b) => positionNumber(a) - positionNumber(b));
  if (rows.length === 0) {
    return <p className="rounded-md border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground">No pallets loaded yet.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Pos</TableHead>
          <TableHead>Weight</TableHead>
          <TableHead className="hidden sm:table-cell">Category</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="w-20 text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-semibold">{p.positionLabel}</TableCell>
            <TableCell className="tabular-nums">{p.weight !== null ? `${Math.round(toDisplay(p.weight)).toLocaleString()} ${unit}` : <span className="text-muted-foreground">No weight</span>}</TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">{CARGO_CATEGORY_LABELS[p.cargoCategory ?? ""] ?? p.cargoCategory ?? "—"}</TableCell>
            <TableCell>
              {p.cargoType === "DG" ? (
                <Badge variant="destructive" className="gap-1">
                  <Flame className="h-3 w-3" /> DG {p.dgClass ? `cl. ${p.dgClass}` : ""}
                </Badge>
              ) : (
                <Badge variant="outline">Cargo</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit pallet at ${p.positionLabel}`} onClick={() => onEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label={`Remove pallet at ${p.positionLabel}`} onClick={() => onRemove(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
