import { useCallback, useEffect, useState, type DragEvent } from "react";
import { Link, useParams } from "wouter";
import { AlertTriangle, Download, Eraser, Flame, PackagePlus, Sparkles } from "lucide-react";
import { AIRCRAFT_LABELS } from "@shared/constants";
import { EmptyState, PageHeader, Section } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BalanceIndicator, LoadSummary, PalletConfigDialog, TemplatePalletConfig, WarningPopup } from "@/components/load-planning";
import { CargoBay, TEMPLATE_DRAG_ID } from "@/components/load-planning/CargoBay";
import { PalletTable, DG_CLASS_LABELS } from "@/components/load-planning/PalletTable";
import { useLoadPlan, type DisplayUnit } from "@/components/load-planning/useLoadPlan";
import { ENGINE_TO_FLEET, isEngineAircraftId, type EngineAircraftId } from "@/components/load-planning/aircraft-map";
import { aircraftConfigs, isBalanceAtOrBeyondLimits } from "@/utils/aircraft-config";
import { downloadLoadPlanPdf } from "@/lib/load-plan-pdf";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function LoadPlanning() {
  const { aircraft } = useParams<{ aircraft: string }>();
  const id = aircraft?.toLowerCase();
  if (!isEngineAircraftId(id)) {
    return (
      <EmptyState
        title="Unknown aircraft"
        description="Choose one of the supported airframes to start a load plan."
        action={
          <Button asChild>
            <Link href="/load-planning">Choose aircraft</Link>
          </Button>
        }
      />
    );
  }
  return <Planner key={id} aircraftId={id} />;
}

function Planner({ aircraftId }: { aircraftId: EngineAircraftId }) {
  const config = aircraftConfigs[aircraftId];
  const label = AIRCRAFT_LABELS[ENGINE_TO_FLEET[aircraftId]];
  const plan = useLoadPlan(aircraftId, config);
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [cgAlertOpen, setCgAlertOpen] = useState(false);

  const beyondLimits = plan.loaded.length > 0 && isBalanceAtOrBeyondLimits(plan.balance.balanceCG);
  useEffect(() => {
    setCgAlertOpen(beyondLimits);
  }, [beyondLimits]);
  const closeCgAlert = useCallback(() => setCgAlertOpen(false), []);

  const unitLabel = plan.unit;
  const isDg = plan.draft.cargoType === "DG";

  const handleTemplateDragStart = (e: DragEvent) => {
    e.dataTransfer.setData("text/plain", TEMPLATE_DRAG_ID);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDrop = (position: string, source: number | typeof TEMPLATE_DRAG_ID) => {
    if (source === TEMPLATE_DRAG_ID) {
      if (plan.loaded.length >= config.positions) {
        toast({ title: "All positions filled", description: `The ${label} has ${config.positions} positions.` });
        return;
      }
      if (!plan.freePositions.includes(position)) {
        toast({ title: "Position occupied", description: `${position} already has a pallet.` });
        return;
      }
      plan.openNew(position);
    } else {
      plan.move(source, position);
    }
  };

  const addToFirstFree = () => {
    const first = plan.freePositions[0];
    if (!first) {
      toast({ title: "All positions filled", description: `The ${label} has ${config.positions} positions.` });
      return;
    }
    plan.openNew(first);
  };

  const exportPdf = () => {
    setExporting(true);
    try {
      downloadLoadPlanPdf({
        aircraftLabel: label,
        config,
        grid: plan.grid,
        pallets: plan.pallets,
        unit: unitLabel,
        toDisplay: plan.toDisplay,
        totalWeight: plan.totalWeight,
        balanceCG: plan.balance.balanceCG,
        balanceStatus: plan.balance.status,
        warnings: plan.warnings,
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Export failed", description: e instanceof Error ? e.message : "Could not create the PDF." });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        backHref="/load-planning"
        eyebrow="Load planning"
        title={label}
        description={`${config.positions} positions · max payload ${Math.round(plan.toDisplay(config.maxPayload)).toLocaleString()} ${unitLabel} · max ${Math.round(plan.toDisplay(config.maxPalletWeight)).toLocaleString()} ${unitLabel} per position`}
        actions={
          <>
            <div className="inline-flex rounded-md border border-border/60 bg-background/40 p-0.5" role="group" aria-label="Weight unit">
              {(["kg", "lb"] as DisplayUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => plan.setUnit(u)}
                  aria-pressed={plan.unit === u}
                  className={cn(
                    "rounded px-3 py-1 text-sm font-medium transition-colors",
                    plan.unit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={plan.loadSample}>
              <Sparkles className="mr-2 h-4 w-4" /> Load template
            </Button>
            <Button variant="outline" size="sm" onClick={plan.clear} disabled={plan.pallets.length === 0}>
              <Eraser className="mr-2 h-4 w-4" /> Clear
            </Button>
            <Button size="sm" onClick={exportPdf} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" /> {exporting ? "Exporting…" : "Export PDF"}
            </Button>
          </>
        }
      />

      {cgAlertOpen && (
        <div className="mb-4">
          <WarningPopup open={cgAlertOpen} onClose={closeCgAlert} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Cargo bay</CardTitle>
              <Button size="sm" variant="secondary" onClick={addToFirstFree}>
                <PackagePlus className="mr-2 h-4 w-4" /> Add pallet
              </Button>
            </CardHeader>
            <CardContent>
              <CargoBay
                aircraftId={aircraftId}
                pallets={plan.pallets}
                unitLabel={unitLabel}
                onPalletClick={plan.openEdit}
                onEmptyClick={plan.openNew}
                onDrop={handleDrop}
              />
              <BalanceIndicator balanceValue={plan.balance.balanceValue} balanceCG={plan.balance.balanceCG} balanceStatus={plan.balance.status} />
            </CardContent>
          </Card>

          <Section title="Pallets" description="Every loaded position with its weight and cargo type.">
            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-2 sm:p-4">
                <PalletTable pallets={plan.pallets} unit={unitLabel} toDisplay={plan.toDisplay} onEdit={plan.openEdit} onRemove={plan.remove} />
              </CardContent>
            </Card>
          </Section>
        </div>

        <aside className="space-y-6">
          <LoadSummary
            currentLoad={Math.round(plan.toDisplay(plan.totalWeight))}
            maxPayload={Math.round(plan.toDisplay(config.maxPayload))}
            positionsFilled={plan.loaded.length}
            totalPositions={config.positions}
            balanceCG={plan.balance.balanceCG}
            unit={unitLabel}
          />

          <TemplatePalletConfig maxPallets={config.positions} aircraftName={label} onTemplateDragStart={handleTemplateDragStart} />

          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="h-4 w-4 text-red-400" /> Dangerous goods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {plan.dgPallets.length === 0 ? (
                <p className="text-muted-foreground">No dangerous goods declared.</p>
              ) : (
                <ul className="space-y-1.5">
                  {plan.dgPallets.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <span className="font-medium">{p.positionLabel}</span>
                      <Badge variant="destructive">{p.dgClass ? `Class ${p.dgClass} · ${DG_CLASS_LABELS[p.dgClass] ?? ""}` : "Class not set"}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {plan.warnings.length > 0 && (
            <Alert className="border-amber-500/40 bg-amber-500/5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertTitle>Check before loading</AlertTitle>
              <AlertDescription>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {plan.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </aside>
      </div>

      <PalletConfigDialog
        open={plan.editing !== null}
        onOpenChange={(open) => !open && plan.closeDialog()}
        palletId={plan.editing?.id ?? null}
        position={plan.editing?.position ?? ""}
        weight={plan.draft.weight}
        cargoType={plan.draft.cargoType}
        cargoCategory={plan.draft.cargoCategory}
        dgClass={plan.draft.dgClass}
        isDangerousGoods={isDg}
        maxPalletWeight={Math.round(plan.toDisplay(config.maxPalletWeight))}
        unitLabel={unitLabel}
        onConfirm={plan.confirm}
        onCancel={plan.closeDialog}
        onWeightChange={(v) => plan.setDraft((d) => ({ ...d, weight: v }))}
        onCargoTypeChange={(v) => plan.setDraft((d) => ({ ...d, cargoType: v }))}
        onCategoryChange={(v) => plan.setDraft((d) => ({ ...d, cargoCategory: v }))}
        onDgClassChange={(v) => plan.setDraft((d) => ({ ...d, dgClass: v }))}
        onDangerousGoodsChange={(checked) => plan.setDraft((d) => ({ ...d, cargoType: checked ? "DG" : "C", dgClass: checked ? d.dgClass : "" }))}
      />
    </>
  );
}
