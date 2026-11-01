import { useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent } from "react";
import type { Pallet } from "@/types/load-planning";
import { getAircraftGridConfig, type GridConfig } from "@/utils/aircraft-config";
import { C130Grid, C17Grid, C27JGrid, KC30AGrid } from "@/components/load-planning";
import type { EngineAircraftId } from "./aircraft-map";

/** Row tops used by the retained grid components (px). */
const ROW_TOPS = [10, 105] as const;
const SINGLE_ROW_TOP = 50;
const MIN_CELL_WIDTH = 56;

export const TEMPLATE_DRAG_ID = "template";

export interface CargoBayProps {
  aircraftId: EngineAircraftId;
  pallets: Pallet[];
  unitLabel: string;
  /** Click on an occupied cell. */
  onPalletClick: (pallet: Pallet) => void;
  /** Click on an empty cell. */
  onEmptyClick: (positionLabel: string) => void;
  /** A pallet (by id) or the template was dropped on a position. */
  onDrop: (positionLabel: string, source: number | typeof TEMPLATE_DRAG_ID) => void;
}

/** Resolve the position label under a point inside the grid. */
export function positionFromPoint(x: number, y: number, config: GridConfig): string {
  const spacing = config.cellWidth + config.cellPadding;
  const col = Math.min(config.cols - 1, Math.max(0, Math.floor(x / spacing)));
  let row = 0;
  if (config.rows > 1) {
    const boundary = (ROW_TOPS[0] + config.cellHeight + ROW_TOPS[1]) / 2;
    row = y >= boundary ? 1 : 0;
  }
  return `P${row * config.cols + col + 1}`;
}

export function gridHeight(config: GridConfig): number {
  return config.rows === 1 ? SINGLE_ROW_TOP + config.cellHeight + 14 : ROW_TOPS[1] + config.cellHeight + 10;
}

/** All position labels for an aircraft, in order. */
export function positionLabels(config: GridConfig): string[] {
  return Array.from({ length: config.rows * config.cols }, (_, i) => `P${i + 1}`);
}

export function CargoBay({ aircraftId, pallets, unitLabel, onPalletClick, onEmptyClick, onDrop }: CargoBayProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapWidth, setWrapWidth] = useState(715);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWrapWidth(el.getBoundingClientRect().width || 715);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const baseCols = getAircraftGridConfig(aircraftId).cols;
  const gridWidth = Math.max(wrapWidth, baseCols * MIN_CELL_WIDTH);
  const config = useMemo(() => getAircraftGridConfig(aircraftId, gridWidth), [aircraftId, gridWidth]);
  const height = gridHeight(config);

  const pointFromEvent = (e: MouseEvent | DragEvent, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const handleDragStart = (e: DragEvent, id: number) => {
    e.dataTransfer.setData("text/plain", String(id));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const raw = e.dataTransfer.getData("text/plain");
    const { x, y } = pointFromEvent(e, e.currentTarget);
    const label = positionFromPoint(x, y, config);
    if (raw === TEMPLATE_DRAG_ID) onDrop(label, TEMPLATE_DRAG_ID);
    else {
      const id = Number(raw);
      if (Number.isFinite(id) && id > 0) onDrop(label, id);
    }
  };

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const { x, y } = pointFromEvent(e, e.currentTarget);
    const label = positionFromPoint(x, y, config);
    const occupied = pallets.some((p) => p.location === "cargo" && p.positionLabel === label);
    if (!occupied) onEmptyClick(label);
  };

  const gridProps = {
    config,
    pallets,
    unitLabel,
    onDragStart: handleDragStart,
    onPalletCellClick: (e: MouseEvent, pallet: Pallet) => {
      e.stopPropagation();
      onPalletClick(pallet);
    },
  };

  return (
    <div ref={wrapRef} className="w-full overflow-x-auto">
      <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground" style={{ width: gridWidth }}>
        <span>◀ Nose (fwd)</span>
        <span>Tail (aft) ▶</span>
      </div>
      <div
        role="grid"
        aria-label="Cargo bay positions"
        className={`relative rounded-lg border bg-background/50 transition-colors ${dragOver ? "border-primary/70 bg-primary/5" : "border-border/60"}`}
        style={{ width: gridWidth, height }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (!dragOver) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {aircraftId === "c17" && <C17Grid {...gridProps} />}
        {aircraftId === "c130" && <C130Grid {...gridProps} />}
        {aircraftId === "kc30a" && <KC30AGrid {...gridProps} />}
        {aircraftId === "c27j" && <C27JGrid {...gridProps} />}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Click an empty position to add a pallet, click a loaded position to edit it, or drag pallets between positions.
      </p>
    </div>
  );
}
