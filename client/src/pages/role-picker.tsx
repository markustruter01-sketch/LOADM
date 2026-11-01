import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowRight, GraduationCap, Plane, BookOpen, Gauge, type LucideIcon } from "lucide-react";
import type { PublicUser } from "@shared/schema";
import { ROLE_CAPABILITIES, SQUADRON_LABELS, type Role, type Capability } from "@shared/constants";
import { usePersona } from "@/lib/persona";
import { keys } from "@/lib/keys";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/common";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RoleOption {
  role: Role;
  label: string;
  description: string;
  capabilities: readonly Capability[];
  persona: PublicUser | null;
}

const ICONS: Record<Role, LucideIcon> = { student: GraduationCap, loadmaster: Plane, instructor: BookOpen, command: Gauge };

const HIGHLIGHTS: Record<Role, string[]> = {
  student: ["Training modules & assessments", "Quizzes drawn from a live question bank", "Instructor-marked scenarios", "Personal progress and streaks"],
  loadmaster: ["Everything a student has", "Interactive load planning for 4 airframes", "Flight log, qualifications & currency", "Missions, forms and crew chat"],
  instructor: ["Author quizzes, scenarios and modules", "Review queue with marking", "Student roster and at-risk flags", "Question bank and safety records"],
  command: ["Squadron readiness and 90-day trend", "Qualification forecasting", "Safety compliance and flight ops", "Rule-based recommendations"],
};

export default function RolePicker() {
  const { chooseRole } = usePersona();
  const [, navigate] = useLocation();
  const [busy, setBusy] = useState<Role | null>(null);
  const roles = useQuery<RoleOption[]>({ queryKey: keys.demo.roles });

  const pick = async (role: Role) => {
    setBusy(role);
    try {
      await chooseRole(role);
      navigate("/");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.14),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <Logo />
          <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">Showcase build · fictional data</span>
        </header>

        <section className="mt-14 max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Loadmaster training, assessment and readiness — <span className="text-primary">one platform.</span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            LOADM runs the whole training pipeline for air mobility aircrew: modules, quizzes, scenario assessments, load planning, currency tracking and squadron-level analytics. Pick a role to explore it from that seat. Everything is live and editable; the data resets daily.
          </p>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Choose a role">
          {roles.isLoading && (
            <div className="col-span-full flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Loading roles…
            </div>
          )}
          {roles.isError && <div className="col-span-full text-sm text-destructive">Could not reach the server. Refresh to try again.</div>}
          {roles.data?.map((r) => {
            const Icon = ICONS[r.role];
            const p = r.persona;
            return (
              <button
                key={r.role}
                onClick={() => pick(r.role)}
                disabled={busy !== null}
                className={cn(
                  "group flex flex-col rounded-xl border border-border/60 bg-card/50 p-5 text-left transition-all",
                  "hover:-translate-y-0.5 hover:border-primary/60 hover:bg-card hover:shadow-lg hover:shadow-primary/10",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  {busy === r.role ? <Spinner /> : <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />}
                </div>
                <div className="mt-4 text-lg font-semibold">{r.label}</div>
                <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                <ul className="mt-4 space-y-1 text-xs text-foreground/80">
                  {HIGHLIGHTS[r.role].map((h) => (
                    <li key={h} className="flex gap-2">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {h}
                    </li>
                  ))}
                </ul>
                {p && (
                  <div className="mt-5 flex items-center gap-2 border-t border-border/60 pt-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={p.profilePhotoUrl ?? undefined} alt="" />
                      <AvatarFallback className="bg-muted text-xs">{p.firstName[0]}{p.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 text-xs">
                      <div className="truncate font-medium">
                        {p.rank} {p.firstName} {p.lastName}
                      </div>
                      <div className="truncate text-muted-foreground">{SQUADRON_LABELS[p.squadron]}</div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </section>

        <footer className="mt-auto pt-12 text-xs text-muted-foreground">
          React · TypeScript · Express · PostgreSQL · Drizzle · TanStack Query · WebSockets. Role capabilities: {Object.entries(ROLE_CAPABILITIES).map(([r, c]) => `${r} (${c.length})`).join(" · ")}.
        </footer>
      </div>
    </div>
  );
}
