import { useCallback, useMemo, useState } from "react";
import type { Pallet, PalletFormData } from "@/types/load-planning";
import { calculateBalance, getAircraftGridConfig, isBalanceAtOrBeyondLimits, kgToLbs, lbsToKg, type AircraftConfig } from "@/utils/aircraft-config";
import { calculateTotalWeight, checkPayloadLimits, generatePalletId, isPositionOccupied } from "@/utils/load-planning-utils";
import { useToast } from "@/hooks/use-toast";
import { positionLabels } from "./CargoBay";
import { nativeUnit, type EngineAircraftId } from "./aircraft-map";

export type DisplayUnit = "kg" | "lb";

export interface PalletDraft {
  weight: string;
  cargoType: "C" | "DG";
  cargoCategory: string;
  dgClass: string;
}

const EMPTY_DRAFT: PalletDraft = { weight: "", cargoType: "C", cargoCategory: "general", dgClass: "" };

export interface EditingTarget {
  id: number;
  position: string;
  isNew: boolean;
}

/** Client-side state for one aircraft load plan. Nothing is persisted. */
export function useLoadPlan(aircraftId: EngineAircraftId, config: AircraftConfig) {
  const { toast } = useToast();
  const native = nativeUnit(config);
  const [unit, setUnit] = useState<DisplayUnit>(native);
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [editing, setEditing] = useState<EditingTarget | null>(null);
  const [draft, setDraft] = useState<PalletDraft>(EMPTY_DRAFT);

  const toDisplay = useCallback(
    (w: number) => (unit === native ? w : unit === "kg" ? lbsToKg(w) : kgToLbs(w)),
    [unit, native],
  );
  const fromDisplay = useCallback(
    (w: number) => (unit === native ? w : native === "kg" ? lbsToKg(w) : kgToLbs(w)),
    [unit, native],
  );

  const grid = useMemo(() => getAircraftGridConfig(aircraftId), [aircraftId]);
  const labels = useMemo(() => positionLabels(grid), [grid]);
  const freePositions = useMemo(() => labels.filter((l) => !isPositionOccupied(pallets, l)), [labels, pallets]);

  const totalWeight = calculateTotalWeight(pallets);
  const balance = useMemo(() => calculateBalance(pallets, aircraftId), [pallets, aircraftId]);
  const loaded = pallets.filter((p) => p.location === "cargo");
  const dgPallets = loaded.filter((p) => p.cargoType === "DG");

  const warnings = useMemo(() => {
    const out: string[] = [];
    if (isBalanceAtOrBeyondLimits(balance.balanceCG)) out.push("Centre of gravity is at or beyond the 18°–88° envelope. Redistribute weight toward the centre.");
    else if (balance.status === "caution") out.push("Centre of gravity is close to the edge of the envelope.");
    const ratio = totalWeight / config.maxPayload;
    if (ratio > 1) out.push("Total load exceeds the aircraft maximum payload.");
    else if (ratio >= 0.9) out.push(`Total load is at ${Math.round(ratio * 100)}% of maximum payload.`);
    if (loaded.some((p) => p.weight === null)) out.push("One or more pallets have no weight entered; they are excluded from the balance calculation.");
    const classes = new Set(dgPallets.map((p) => p.dgClass).filter(Boolean));
    if (classes.has("1") && (classes.has("3") || classes.has("5"))) out.push("Class 1 explosives are loaded alongside Class 3 or Class 5 goods. Check segregation table before loading.");
    if (classes.has("7")) out.push("Class 7 radioactive material on board: confirm transport index and crew separation distance.");
    if (dgPallets.some((p) => !p.dgClass)) out.push("A dangerous-goods pallet has no class selected.");
    return out;
  }, [balance, totalWeight, config.maxPayload, loaded, dgPallets]);

  const openNew = useCallback(
    (position: string) => {
      if (isPositionOccupied(pallets, position)) return;
      setDraft(EMPTY_DRAFT);
      setEditing({ id: generatePalletId(pallets), position, isNew: true });
    },
    [pallets],
  );

  const openEdit = useCallback(
    (p: Pallet) => {
      setDraft({
        weight: p.weight !== null ? String(Math.round(toDisplay(p.weight))) : "",
        cargoType: p.cargoType ?? "C",
        cargoCategory: p.cargoCategory ?? "general",
        dgClass: p.dgClass ?? "",
      });
      setEditing({ id: p.id, position: p.positionLabel ?? "P1", isNew: false });
    },
    [toDisplay],
  );

  const closeDialog = useCallback(() => setEditing(null), []);

  /** Returns false (and toasts) when the edit violates a limit. */
  const confirm = useCallback(
    (data: PalletFormData): boolean => {
      const nativeWeight = data.weight !== null ? Math.round(fromDisplay(data.weight)) : null;
      if (nativeWeight !== null && nativeWeight > config.maxPalletWeight) {
        toast({
          variant: "destructive",
          title: "Pallet over limit",
          description: `Maximum per position is ${Math.round(toDisplay(config.maxPalletWeight)).toLocaleString()} ${unit}.`,
        });
        return false;
      }
      if (nativeWeight !== null && !checkPayloadLimits(pallets, nativeWeight, data.id, config.maxPayload)) {
        toast({
          variant: "destructive",
          title: "Payload exceeded",
          description: `Adding this pallet would exceed the ${Math.round(toDisplay(config.maxPayload)).toLocaleString()} ${unit} maximum payload.`,
        });
        return false;
      }
      setPallets((prev) => {
        const next: Pallet = {
          id: data.id,
          position: { x: 0, y: 0 },
          size: { width: 0, height: 0 },
          location: "cargo",
          positionLabel: data.position,
          weight: nativeWeight,
          cargoType: data.cargoType,
          cargoCategory: data.cargoCategory,
          dgClass: data.cargoType === "DG" ? data.dgClass : "",
        };
        const exists = prev.some((p) => p.id === data.id);
        return exists ? prev.map((p) => (p.id === data.id ? next : p)) : [...prev, next];
      });
      setEditing(null);
      return true;
    },
    [pallets, config, fromDisplay, toDisplay, unit, toast],
  );

  const move = useCallback(
    (id: number, position: string) => {
      if (isPositionOccupied(pallets, position, id)) {
        toast({ title: "Position occupied", description: `${position} already has a pallet.` });
        return;
      }
      setPallets((prev) => prev.map((p) => (p.id === id ? { ...p, positionLabel: position } : p)));
    },
    [pallets, toast],
  );

  const remove = useCallback((id: number) => setPallets((prev) => prev.filter((p) => p.id !== id)), []);
  const clear = useCallback(() => setPallets([]), []);

  /** Fills a representative, balanced load so the tool can be explored quickly. */
  const loadSample = useCallback(() => {
    const count = Math.min(labels.length, grid.cols);
    const per = Math.round(config.maxPalletWeight * 0.55);
    const sample: Pallet[] = labels.slice(0, count).map((label, i) => ({
      id: i + 1,
      position: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
      location: "cargo",
      positionLabel: label,
      weight: Math.round(per * (i % 2 === 0 ? 1 : 0.8)),
      cargoType: i === 1 ? "DG" : "C",
      cargoCategory: i === 1 ? "mechanical" : i % 3 === 0 ? "pax" : "general",
      dgClass: i === 1 ? "9" : "",
    }));
    setPallets(sample);
  }, [labels, grid.cols, config.maxPalletWeight]);

  return {
    unit, setUnit, native, toDisplay, fromDisplay,
    pallets, loaded, dgPallets, freePositions, labels, grid,
    totalWeight, balance, warnings,
    editing, draft, setDraft, openNew, openEdit, closeDialog, confirm, move, remove, clear, loadSample,
  };
}
