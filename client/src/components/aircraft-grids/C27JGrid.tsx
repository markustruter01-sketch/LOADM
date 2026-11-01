import { useRef } from "react";
import CargoGridCell from "../CargoGridCell";
import { GridConfig } from "@/utils/aircraft-config";
import { debugLog } from "@/utils/debug-helpers";

interface Pallet {
  id: number;
  position: { x: number; y: number };
  location: "cargo" | "configure";
  weight: number | null;
  size: { width: number; height: number };
  cargoType?: "C" | "DG";
  cargoCategory?: string;
  dgClass?: string;
  positionLabel?: string;
}

interface C27JGridProps {
  config: GridConfig;
  pallets: Pallet[];
  onPalletCellClick: (e: React.MouseEvent, pallet: Pallet, posLabel: string) => void;
  onDragStart: (e: React.DragEvent, id: number) => void;
  unitLabel?: string;
}

export default function C27JGrid({ 
  config, 
  pallets, 
  onPalletCellClick, 
  onDragStart,
  unitLabel
}: C27JGridProps) {
  // Container ref for debugging
  const gridContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate cell spacing based on config
  const cellSpacing = config.cellWidth + config.cellPadding;

  // Render all 3 grid cells for C-27J (3 columns, 1 row)
  return (
    <div ref={gridContainerRef} className="absolute inset-0">
      {/* Grid cells for C-27J - 3 pallets (3x1) */}
      {[...Array(config.cols)].map((_, i) => {
        // Position label like "P1", "P2", "P3"
        const positionLabel = `P${i + 1}`;
        
        // Find if a pallet is assigned to this position
        const assignedPallet = pallets.find(p => 
          p.location === "cargo" && 
          p.positionLabel === positionLabel
        );
        
        // Style for the grid cell
        const cellStyle = {
          left: i * cellSpacing,
          top: 50, // Centered vertically for single row
          width: config.cellWidth,
          height: config.cellHeight
        };
        
        return (
          <CargoGridCell
            key={`c27j-cell-${i}`}
            positionLabel={positionLabel}
            assignedPallet={assignedPallet}
            cellStyle={cellStyle}
            onDragStart={onDragStart}
            unitLabel={unitLabel}
            aircraftId="c27j"
            onClick={(e) => {
              if (assignedPallet) {
                debugLog("C27J position clicked", { 
                  id: assignedPallet.id, 
                  position: positionLabel 
                });
                onPalletCellClick(e, assignedPallet, positionLabel);
              }
            }}
          />
        );
      })}
    </div>
  );
}