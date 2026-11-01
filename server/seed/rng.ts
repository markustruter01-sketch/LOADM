/**
 * Deterministic PRNG so every demo reset produces identical data.
 * mulberry32 — small, fast, good enough for seeding.
 */
export class Rng {
  private state: number;
  constructor(seed = 0x4c4f4144 /* "LOAD" */) {
    this.state = seed >>> 0;
  }
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  float(min: number, max: number, dp = 1): number {
    const v = min + this.next() * (max - min);
    return Number(v.toFixed(dp));
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  shuffle<T>(arr: readonly T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  sample<T>(arr: readonly T[], n: number): T[] {
    return this.shuffle(arr).slice(0, n);
  }
  /** Normal-ish value via sum of uniforms, clamped. */
  gauss(mean: number, sd: number, min: number, max: number): number {
    const u = (this.next() + this.next() + this.next() + this.next() - 2) * 1.73;
    return Math.max(min, Math.min(max, mean + u * sd));
  }
}

export function daysAgo(days: number, hour = 9, minute = 0): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

export function daysFromNow(days: number): Date {
  return daysAgo(-days);
}
