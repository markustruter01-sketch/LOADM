import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

/** Two-option unit switch used by every calculator (switching clears inputs, as the legacy tools did). */
export function UnitToggle({ metric, onChange, imperialLabel = "lbs / in", metricLabel = "kg / cm" }: { metric: boolean; onChange: (metric: boolean) => void; imperialLabel?: string; metricLabel?: string }) {
  return (
    <div className="inline-flex rounded-md border border-border/60 bg-background/40 p-0.5" role="group" aria-label="Units">
      {[
        { m: false, label: imperialLabel },
        { m: true, label: metricLabel },
      ].map((o) => (
        <button
          key={o.label}
          type="button"
          aria-pressed={metric === o.m}
          onClick={() => onChange(o.m)}
          className={cn("rounded px-3 py-1 text-sm font-medium transition-colors", metric === o.m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function NumberField({ id, label, value, onChange, placeholder, hint, step }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; step?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" inputMode="decimal" step={step ?? "any"} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CalcCard({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("border-border/60 bg-card/60", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function Actions({ onCalculate, onReset, calculateLabel = "Calculate" }: { onCalculate: () => void; onReset: () => void; calculateLabel?: string }) {
  return (
    <div className="flex gap-2">
      <Button type="button" className="flex-1" onClick={onCalculate}>
        {calculateLabel}
      </Button>
      <Button type="button" variant="outline" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function ResultBox({ label, value, sub, tone = "default" }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "default" | "bad" | "good" }) {
  return (
    <div className={cn("rounded-lg border p-4", tone === "bad" ? "border-red-500/40 bg-red-500/5" : tone === "good" ? "border-emerald-500/40 bg-emerald-500/5" : "border-primary/30 bg-primary/5")}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", tone === "bad" ? "text-red-400" : "text-primary")}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">{children}</p>;
}

/** Formula reference block with an optional worked example. */
export function Formula({ title, lines, example }: { title: string; lines: string[]; example?: ReactNode }) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-3 font-mono text-sm">
      <div className="mb-1 font-sans font-medium text-primary">{title}</div>
      {lines.map((l) => (
        <div key={l}>{l}</div>
      ))}
      {example && <div className="mt-2 border-t border-border/50 pt-2 text-xs text-muted-foreground">{example}</div>}
    </div>
  );
}

export function parse(v: string): number {
  return parseFloat(v);
}
