import { Link } from "wouter";
import { ArrowRight, AlertTriangle, Scale } from "lucide-react";
import { PageHeader } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AIRCRAFT_CARDS, nativeUnit } from "@/components/load-planning/aircraft-map";
import { formatNumber } from "@/utils/load-planning-utils";

export default function LoadPlanningSelect() {
  return (
    <>
      <PageHeader
        eyebrow="Operate"
        title="Load planning"
        description="Pick an airframe to build a pallet load, check balance and export the plan. Each aircraft has its own positions, payload limit and balance envelope."
      />

      <Alert className="mb-6 border-amber-500/40 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertTitle>Planning aid only</AlertTitle>
        <AlertDescription>
          This tool is for general planning and training. Refer to squadron procedures and the aircraft load and trim sheet for
          operational weight and balance.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AIRCRAFT_CARDS.map((a) => {
          const unit = nativeUnit(a.config);
          return (
            <Card key={a.id} className="group flex flex-col border-border/60 bg-card/60 transition-colors hover:border-primary/50">
              <div className="flex h-36 items-center justify-center border-b border-border/60 bg-background/40 p-4">
                <img src={a.image} alt="" className="max-h-28 max-w-full object-contain transition-transform group-hover:scale-[1.03]" />
              </div>
              <CardContent className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-primary">{a.fleet}</div>
                  <h2 className="text-lg font-semibold leading-tight">{a.label}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{a.blurb}</p>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md border border-border/60 bg-background/40 p-2">
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Max payload</dt>
                    <dd className="font-semibold tabular-nums">
                      {formatNumber(a.config.maxPayload)} {unit}
                    </dd>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/40 p-2">
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Positions</dt>
                    <dd className="font-semibold tabular-nums">{a.config.positions}</dd>
                  </div>
                  <div className="col-span-2 rounded-md border border-border/60 bg-background/40 p-2">
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Max per position</dt>
                    <dd className="font-semibold tabular-nums">
                      {formatNumber(a.config.maxPalletWeight)} {unit}
                    </dd>
                  </div>
                </dl>
                <Button asChild className="mt-auto w-full">
                  <Link href={`/load-planning/${a.id}`}>
                    <Scale className="mr-2 h-4 w-4" />
                    Plan load
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
