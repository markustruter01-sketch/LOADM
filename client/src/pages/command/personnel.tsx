import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, UserCog } from "lucide-react";
import { ROLES, ROLE_LABELS, SQUADRONS, SQUADRON_LABELS, THRESHOLDS, type Role, type Squadron } from "@shared/constants";
import type { PublicUser } from "@shared/schema";
import { keys } from "@/lib/keys";
import { PageHeader, QueryState, EmptyState, ScoreBadge, relativeTime } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill, personName } from "@/components/command/charts";
import { ReadinessDialog } from "@/components/ReadinessDialog";
import type { RosterEntry, RosterFlag } from "./types";

const ANY = "any";
const AIRCREW_ROLES: readonly Role[] = ["student", "loadmaster"];

const FLAG_LABELS: Record<RosterFlag, string> = {
  not_flight_ready: "Not flight-ready",
  expired_qualification: "Expired qual",
  expiring_qualification: "Expiring qual",
  low_average_score: "Low average",
  inactive: "Inactive",
};

function flagTone(f: RosterFlag): "bad" | "warn" {
  return f === "not_flight_ready" || f === "expired_qualification" ? "bad" : "warn";
}

export default function CommandPersonnel() {
  const [squadron, setSquadron] = useState<Squadron | undefined>(undefined);
  const [role, setRole] = useState<Role | undefined>(undefined);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PublicUser | null>(null);

  // The server coerces any present includeInactive to true, so only send it when set.
  const users = useQuery<PublicUser[]>({ queryKey: keys.users.list({ squadron, role, includeInactive: includeInactive || undefined }) });
  const roster = useQuery<RosterEntry[]>({ queryKey: keys.personnel.roster({ squadron }) });

  const rosterById = useMemo(() => new Map((roster.data ?? []).map((r) => [r.user.id, r])), [roster.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = users.data ?? [];
    const matched = term
      ? rows.filter((u) => `${u.rank} ${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(term))
      : rows;
    return [...matched].sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
  }, [users.data, search]);

  const readyCount = filtered.filter((u) => rosterById.get(u.id)?.isReady).length;
  const aircrewCount = filtered.filter((u) => rosterById.has(u.id)).length;

  return (
    <div>
      <PageHeader
        eyebrow="Command"
        title="Personnel register"
        description="Everyone on strength, with readiness and risk flags for aircrew. Override readiness after a medical or leave change."
      />

      <Card className="mb-4 border-border/60 bg-card/60">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="pr-search">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input id="pr-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, rank or email" className="pl-8" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-squadron">Squadron</Label>
            <Select value={squadron ?? ANY} onValueChange={(v) => setSquadron(v === ANY ? undefined : (v as Squadron))}>
              <SelectTrigger id="pr-squadron">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All squadrons</SelectItem>
                {SQUADRONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SQUADRON_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-role">Role</Label>
            <Select value={role ?? ANY} onValueChange={(v) => setRole(v === ANY ? undefined : (v as Role))}>
              <SelectTrigger id="pr-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All roles</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2 pb-2">
            <Switch id="pr-inactive" checked={includeInactive} onCheckedChange={setIncludeInactive} />
            <Label htmlFor="pr-inactive">Include inactive</Label>
          </div>
        </CardContent>
      </Card>

      <QueryState
        query={users}
        rows={6}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState title="Nobody matches these filters" />}
      >
        {() =>
          filtered.length === 0 ? (
            <EmptyState title="No matches" description={`Nobody matches “${search}”.`} />
          ) : (
            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-0">
                <div className="border-b border-border/60 px-4 py-3 text-xs text-muted-foreground">
                  {filtered.length} people · {readyCount} of {aircrewCount} aircrew ready
                  {roster.isError && <span className="text-amber-400"> · readiness flags unavailable</span>}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Role</TableHead>
                      <TableHead className="hidden md:table-cell">Squadron</TableHead>
                      <TableHead>Readiness</TableHead>
                      <TableHead className="hidden lg:table-cell">Flags</TableHead>
                      <TableHead className="hidden text-right md:table-cell">90d avg</TableHead>
                      <TableHead className="hidden lg:table-cell">Last active</TableHead>
                      <TableHead className="text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => {
                      const r = rosterById.get(u.id);
                      const aircrew = AIRCREW_ROLES.includes(u.role);
                      return (
                        <TableRow key={u.id} className={u.isActive ? undefined : "opacity-60"}>
                          <TableCell>
                            {aircrew ? (
                              <Link href={`/instructor/students/${u.id}`} className="font-medium hover:text-primary">
                                {personName(u)}
                              </Link>
                            ) : (
                              <span className="font-medium">{personName(u)}</span>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {u.email}
                              {!u.isActive && " · inactive"}
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-sm sm:table-cell">
                            {ROLE_LABELS[u.role]} · Cat {u.category}
                          </TableCell>
                          <TableCell className="hidden text-sm md:table-cell">{u.squadron}</TableCell>
                          <TableCell>
                            {r ? (
                              <StatusPill tone={r.isReady ? "good" : "bad"}>{r.isReady ? "Ready" : "Not ready"}</StatusPill>
                            ) : (
                              <StatusPill tone={u.isFlightReady ? "muted" : "bad"}>{u.isFlightReady ? "Ready" : "Not ready"}</StatusPill>
                            )}
                            {!u.isFlightReady && u.notReadyReason && <div className="mt-1 text-[11px] text-muted-foreground">{u.notReadyReason}</div>}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {(r?.atRisk ?? []).map((f) => (
                                <StatusPill key={f} tone={flagTone(f)}>
                                  {FLAG_LABELS[f]}
                                </StatusPill>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-right md:table-cell">
                            {r ? (
                              <ScoreBadge
                                score={r.recentAverageScore}
                                passed={r.recentAverageScore === null ? null : r.recentAverageScore >= THRESHOLDS.AT_RISK_AVERAGE_SCORE}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{relativeTime(r?.lastActiveAt ?? u.lastActiveAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setEditing(u)} aria-label={`Override readiness for ${personName(u)}`}>
                              <UserCog aria-hidden />
                              <span className="hidden xl:inline">Readiness</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        }
      </QueryState>

      <ReadinessDialog user={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
