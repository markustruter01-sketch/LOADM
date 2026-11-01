import type { ChangeEvent } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { PublicUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Small pieces shared across the instructor pages. */

export function personName(u: Pick<PublicUser, "rank" | "firstName" | "lastName"> | null | undefined): string {
  if (!u) return "Unknown";
  return `${u.rank} ${u.firstName} ${u.lastName}`;
}

/** yyyy-mm-dd for <input type="date">. */
export function toDateInput(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** Up / down / remove controls for a dynamic list row. */
export function RowControls({
  index,
  count,
  onMove,
  onRemove,
  disabledRemove,
}: {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  disabledRemove?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMove(index, index - 1)} disabled={index === 0} aria-label="Move up">
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onMove(index, index + 1)}
        disabled={index >= count - 1}
        aria-label="Move down"
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onRemove(index)} disabled={disabledRemove} aria-label="Remove">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

/** Number input whose empty state is `null` (for nullable/optional numeric fields). */
export function NullableNumberInput({
  id,
  value,
  onChange,
  min,
  max,
  placeholder,
  disabled,
  className,
}: {
  id?: string;
  value: number | null | undefined;
  onChange: (next: number | null) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      value={value === null || value === undefined || Number.isNaN(value) ? "" : value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge variant="outline" className={cn("font-medium", active ? "border-emerald-500/40 text-emerald-400" : "border-border text-muted-foreground")}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "reviewed" || status === "closed"
      ? "border-emerald-500/40 text-emerald-400"
      : status === "submitted" || status === "open"
        ? "border-amber-500/40 text-amber-400"
        : "border-border text-muted-foreground";
  return (
    <Badge variant="outline" className={cn("capitalize", tone)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
