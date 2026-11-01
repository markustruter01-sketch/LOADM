import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Menu, RefreshCw, LogOut, ChevronDown, Info } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ROLE_LABELS, ROLES, SQUADRON_LABELS, type Role } from "@shared/constants";
import { usePersona } from "@/lib/persona";
import { visibleNav } from "@/lib/nav";
import { post } from "@/lib/api";
import { keys } from "@/lib/keys";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { ChatDock } from "@/components/chat/ChatDock";

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = usePersona();
  const [location] = useLocation();
  const sections = visibleNav(can);
  return (
    <nav className="flex flex-col gap-5" aria-label="Main">
      {sections.map((s) => (
        <div key={s.title}>
          <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{s.title}</div>
          <ul className="space-y-0.5">
            {s.items.map((item) => {
              const active = item.prefix ? location === item.href || location.startsWith(item.href + "/") : location === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                      active ? "bg-primary/15 text-primary" : "text-foreground/80 hover:bg-muted hover:text-foreground",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function RoleSwitcher() {
  const { user, role, chooseRole, leave } = usePersona();
  const [, navigate] = useLocation();
  if (!user || !role) return null;
  const photo = user.profilePhotoUrl ?? undefined;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted" aria-label="Switch role">
          <Avatar className="h-8 w-8">
            <AvatarImage src={photo} alt="" />
            <AvatarFallback className="bg-primary/20 text-xs text-primary">{initials(user.firstName, user.lastName)}</AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 sm:block">
            <div className="truncate text-sm font-medium leading-tight">
              {user.rank} {user.firstName} {user.lastName}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {ROLE_LABELS[role]} · {SQUADRON_LABELS[user.squadron]}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>View the app as</DropdownMenuLabel>
        {ROLES.map((r) => (
          <DropdownMenuItem
            key={r}
            disabled={r === role}
            onSelect={async () => {
              await chooseRole(r);
              navigate("/");
            }}
          >
            <span className={cn("mr-2 h-2 w-2 rounded-full", r === role ? "bg-primary" : "bg-muted-foreground/40")} />
            {ROLE_LABELS[r]}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/profile")}>My profile</DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            await leave();
            navigate("/");
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Back to role selection
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DemoControls() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const status = useQuery<{ lastResetAt: string | null; nextResetAt: string | null }>({ queryKey: keys.demo.status, staleTime: 60_000 });
  const reset = useMutation({
    mutationFn: () => post<{ ok: true }>("/api/demo/reset"),
    onSuccess: async () => {
      await qc.invalidateQueries();
      toast({ title: "Demo data restored", description: "Everything is back to the seeded state." });
    },
    onError: (err: Error) => toast({ title: "Reset failed", description: err.message, variant: "destructive" }),
  });
  const next = status.data?.nextResetAt ? new Date(status.data.nextResetAt) : null;
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" onClick={() => reset.mutate()} disabled={reset.isPending}>
            <RefreshCw className={cn("h-3.5 w-3.5", reset.isPending && "animate-spin")} />
            <span className="hidden md:inline">Reset demo data</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Restores the seeded dataset for everyone.
          {next && <div className="text-muted-foreground">Next automatic reset {next.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</div>}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-card/30 lg:flex">
        <div className="flex h-16 items-center border-b border-border/60 px-5">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavList />
        </div>
        <div className="border-t border-border/60 p-3 text-[11px] leading-snug text-muted-foreground">
          <div className="flex items-start gap-1.5">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            <span>Showcase build. All data is fictional and resets daily.</span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur">
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto p-4">
                <div className="mb-4">
                  <Logo />
                </div>
                <NavList onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <Link href="/">
              <Logo compact />
            </Link>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <DemoControls />
            <RoleSwitcher />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        <ChatDock />
      </div>
    </div>
  );
}

export type { Role };
