import type { CSSProperties, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FLYING_SQUADRONS, THRESHOLDS, type FlyingSquadron } from "@shared/constants";
import type { PublicUser } from "@shared/schema";
import { cn } from "@/lib/utils";

/** Theme colours for recharts. Everything comes from the CSS variables so charts follow the theme. */
export const CHART = {
  primary: "hsl(var(--primary))",
  c1: "hsl(var(--chart-1))",
  c2: "hsl(var(--chart-2))",
  c3: "hsl(var(--chart-3))",
  c4: "hsl(var(--chart-4))",
  c5: "hsl(var(--chart-5))",
  axis: "hsl(var(--muted-foreground))",
  grid: "hsl(var(--border))",
  /** Status colours; only used where colour carries meaning. */
  good: "#34d399",
  warn: "#fbbf24",
  bad: "#f87171",
} as const;

export const SQUADRON_COLORS: Record<FlyingSquadron, string> = {
  "33SQN": CHART.c1,
  "35SQN": CHART.c2,
  "36SQN": CHART.c3,
  "37SQN": CHART.c4,
};

/** Dark tooltip props shared by every chart. */
export const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    color: "hsl(var(--popover-foreground))",
    fontSize: 12,
  } satisfies CSSProperties,
  labelStyle: { color: "hsl(var(--muted-foreground))", marginBottom: 4 } satisfies CSSProperties,
  itemStyle: { color: "hsl(var(--popover-foreground))", padding: 0 } satisfies CSSProperties,
  cursor: { fill: "hsl(var(--muted) / 0.4)" },
};

export const axisProps = { tick: { fill: CHART.axis, fontSize: 11 }, axisLine: { stroke: CHART.grid }, tickLine: false } as const;

/** Colour for a readiness percentage against the shared thresholds. */
export function readinessColor(percent: number): string {
  if (percent >= THRESHOLDS.READINESS_TARGET_PERCENT) return CHART.good;
  if (percent >= THRESHOLDS.READINESS_CRITICAL_PERCENT) return CHART.warn;
  return CHART.bad;
}

export function readinessTone(percent: number): "good" | "warn" | "bad" {
  if (percent >= THRESHOLDS.READINESS_TARGET_PERCENT) return "good";
  if (percent >= THRESHOLDS.READINESS_CRITICAL_PERCENT) return "warn";
  return "bad";
}

/** "YYYY-MM" → "Mar 26". */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
}

export function personName(u: Pick<PublicUser, "rank" | "firstName" | "lastName">): string {
  return `${u.rank} ${u.firstName} ${u.lastName}`;
}

/** Every chart lives in a card with a title and a one-line reading of what it shows. */
export function ChartCard({
  title,
  reading,
  actions,
  height = 280,
  children,
  className,
}: {
  title: string;
  reading: string;
  actions?: ReactNode;
  height?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/60 bg-card/60", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="text-xs">{reading}</CardDescription>
        </div>
        {actions}
      </CardHeader>
      <CardContent className="pt-2">
        <div style={{ height }} className="w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

/** Full ring showing a 0–100 value. */
export function ScoreRing({
  value,
  color,
  size = 120,
  stroke = 10,
  label,
  sublabel,
}: {
  value: number;
  color: string;
  size?: number;
  stroke?: number;
  label?: ReactNode;
  sublabel?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(pct)}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 400ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-semibold tabular-nums" style={{ color }}>
          {label ?? `${Math.round(pct)}%`}
        </div>
        {sublabel && <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{sublabel}</div>}
      </div>
    </div>
  );
}

/** Semicircle gauge for a 0–100 value, with a tick at the target. */
export function Gauge({ value, color, target, width = 160 }: { value: number; color: string; target?: number; width?: number }) {
  const stroke = 12;
  const r = width / 2 - stroke;
  const cx = width / 2;
  const cy = width / 2;
  const half = Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const targetAngle = target === undefined ? null : Math.PI * (1 - target / 100);
  return (
    <div className="relative mx-auto" style={{ width, height: width / 2 + 8 }}>
      <svg width={width} height={width / 2 + 8} viewBox={`0 0 ${width} ${width / 2 + 8}`} role="img" aria-label={`${Math.round(pct)}%`}>
        <path d={arc} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} strokeLinecap="round" />
        <path
          d={arc}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={half}
          strokeDashoffset={half * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 400ms ease" }}
        />
        {targetAngle !== null && (
          <line
            x1={cx + (r - stroke) * Math.cos(targetAngle)}
            y1={cy - (r - stroke) * Math.sin(targetAngle)}
            x2={cx + (r + stroke) * Math.cos(targetAngle)}
            y2={cy - (r + stroke) * Math.sin(targetAngle)}
            stroke="hsl(var(--foreground))"
            strokeWidth={2}
            opacity={0.7}
          />
        )}
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="text-2xl font-semibold tabular-nums leading-none" style={{ color }}>
          {Math.round(pct)}%
        </div>
      </div>
    </div>
  );
}

export const ALL_SQUADRONS = "ALL" as const;
export type SquadronSelection = FlyingSquadron | typeof ALL_SQUADRONS;

/** Squadron selector: All + each flying squadron. `undefined` means all. */
export function SquadronTabs({ value, onChange }: { value: FlyingSquadron | undefined; onChange: (s: FlyingSquadron | undefined) => void }) {
  return (
    <Tabs
      value={value ?? ALL_SQUADRONS}
      onValueChange={(v) => onChange(v === ALL_SQUADRONS ? undefined : (v as FlyingSquadron))}
    >
      <TabsList aria-label="Squadron">
        <TabsTrigger value={ALL_SQUADRONS}>All</TabsTrigger>
        {FLYING_SQUADRONS.map((s) => (
          <TabsTrigger key={s} value={s}>
            {s}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

/** Small coloured status pill. */
export function StatusPill({ tone, children }: { tone: "good" | "warn" | "bad" | "muted"; children: ReactNode }) {
  const cls = {
    good: "bg-emerald-400/10 text-emerald-400",
    warn: "bg-amber-400/10 text-amber-400",
    bad: "bg-red-400/10 text-red-400",
    muted: "bg-muted text-muted-foreground",
  }[tone];
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", cls)}>{children}</span>;
}
