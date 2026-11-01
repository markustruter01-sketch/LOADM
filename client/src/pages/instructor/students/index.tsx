import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { FLYING_SQUADRONS, SQUADRON_LABELS } from "@shared/constants";
import { keys } from "@/lib/keys";
import { PageHeader, QueryState, EmptyState, relativeTime } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { personName } from "@/components/instructor/shared";
import { cn } from "@/lib/utils";
import { AT_RISK_LABELS, type RosterEntry } from "../types";

const ALL = "all";
type SortKey = "name" | "squadron" | "score" | "lastActive" | "flags";
type SortDir = "asc" | "desc";

function sortValue(r: RosterEntry, key: SortKey): string | number {
  switch (key) {
    case "name":
      return `${r.user.lastName} ${r.user.firstName}`.toLowerCase();
    case "squadron":
      return r.user.squadron;
    case "score":
      return r.recentAverageScore ?? -1;
    case "lastActive":
      return r.lastActiveAt ? new Date(r.lastActiveAt).getTime() : 0;
    case "flags":
      return r.atRisk.length;
  }
}

export default function Students() {
  const [, navigate] = useLocation();
  const [squadron, setSquadron] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("flags");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const roster = useQuery<RosterEntry[]>({ queryKey: keys.personnel.roster({ squadron: squadron === ALL ? undefined : squadron }) });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = (roster.data ?? []).filter((r) => !term || personName(r.user).toLowerCase().includes(term) || r.user.email.toLowerCase().includes(term));
    const dir = sortDir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [roster.data, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" || key === "squadron" ? "asc" : "desc");
    }
  };

  const SortHead = ({ label, k, className }: { label: string; k: SortKey; className?: string }) => {
    const active = sortKey === k;
    const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
    return (
      <TableHead className={className}>
        <button type="button" className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")} onClick={() => toggleSort(k)} aria-label={`Sort by ${label}`}>
          {label}
          <Icon className="h-3.5 w-3.5" />
        </button>
      </TableHead>
    );
  };

  return (
    <>
      <PageHeader title="Students" description="Readiness roster for aircrew. Flags combine readiness, qualifications, recent scores and activity." />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <Tabs value={squadron} onValueChange={setSquadron}>
          <TabsList className="flex-wrap">
            <TabsTrigger value={ALL}>All</TabsTrigger>
            {FLYING_SQUADRONS.map((s) => (
              <TabsTrigger key={s} value={s}>
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="w-full md:w-72">
          <Label htmlFor="student-search" className="sr-only">
            Search by name
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="student-search" className="pl-8" placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <QueryState query={roster} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No aircrew on the roster" description="Nobody matches this squadron." />}>
        {() =>
          rows.length === 0 ? (
            <EmptyState title="No matches" description="Try a different name or squadron." />
          ) : (
            <Card className="border-border/60 bg-card/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHead label="Name" k="name" />
                    <SortHead label="Squadron" k="squadron" className="hidden md:table-cell" />
                    <TableHead className="hidden sm:table-cell">Ready</TableHead>
                    <SortHead label="Avg score" k="score" />
                    <SortHead label="Last active" k="lastActive" className="hidden lg:table-cell" />
                    <SortHead label="Flags" k="flags" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.user.id} className="cursor-pointer" onClick={() => navigate(`/instructor/students/${r.user.id}`)}>
                      <TableCell>
                        <div className="font-medium">{personName(r.user)}</div>
                        <div className="text-xs text-muted-foreground">Cat {r.user.category}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{SQUADRON_LABELS[r.user.squadron]}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className={cn("inline-flex items-center gap-1.5 text-sm", r.isReady ? "text-emerald-400" : "text-red-400")}>
                          <span className={cn("h-2 w-2 rounded-full", r.isReady ? "bg-emerald-400" : "bg-red-400")} />
                          {r.isReady ? "Ready" : "Not ready"}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">{r.recentAverageScore === null ? <span className="text-muted-foreground">—</span> : `${r.recentAverageScore}%`}</TableCell>
                      <TableCell className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">{relativeTime(r.lastActiveAt)}</TableCell>
                      <TableCell>
                        {r.atRisk.length === 0 ? (
                          <span className="text-xs text-muted-foreground">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {r.atRisk.map((f) => (
                              <Badge key={f} variant="outline" className="border-amber-500/40 text-amber-400">
                                {AT_RISK_LABELS[f]}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )
        }
      </QueryState>
    </>
  );
}
