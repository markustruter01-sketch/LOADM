import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function formatSeconds(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Seconds elapsed since `startedAt` (ms epoch), ticking once a second. */
export function useElapsedSeconds(startedAt: number | null, running = true): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (startedAt === null || !running) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt, running]);
  return elapsed;
}

/** Counts up from when it mounts (or from `startedAt`). */
export function Stopwatch({ startedAt, className }: { startedAt: number | null; className?: string }) {
  const elapsed = useElapsedSeconds(startedAt);
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono text-sm tabular-nums text-muted-foreground", className)} aria-live="off">
      <Clock className="h-4 w-4" aria-hidden />
      <span aria-label="Time elapsed">{formatSeconds(elapsed)}</span>
    </span>
  );
}

/**
 * Counts down from `limitSeconds` starting at `startedAt`. Calls `onExpire`
 * once when the limit is reached.
 */
export function Countdown({
  startedAt,
  limitSeconds,
  onExpire,
  className,
}: {
  startedAt: number | null;
  limitSeconds: number;
  onExpire: () => void;
  className?: string;
}) {
  const elapsed = useElapsedSeconds(startedAt);
  const remaining = Math.max(0, limitSeconds - elapsed);
  const fired = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (startedAt !== null && remaining === 0 && !fired.current) {
      fired.current = true;
      onExpireRef.current();
    }
  }, [remaining, startedAt]);

  const urgent = remaining <= 60;
  const warning = remaining <= 300 && !urgent;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-sm tabular-nums",
        urgent ? "border-red-500/50 bg-red-500/10 text-red-400" : warning ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : "border-border/60 text-foreground",
        className,
      )}
      role="timer"
      aria-live={urgent ? "assertive" : "off"}
    >
      <Clock className="h-4 w-4" aria-hidden />
      <span aria-label="Time remaining">{formatSeconds(remaining)}</span>
    </span>
  );
}
