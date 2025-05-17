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

interface KC30AGridProps {
  config: GridConfig;
  pallets: Pallet[];
  onPalletCellClick: (e: React.MouseEvent, pallet: Pallet, posLabel: string) => void;
  onDragStart: (e: React.DragEvent, id: number) => void;
}

export default function KC30AGrid({ 
  config, 
  pallets, 
  onPalletCellClick, 
  onDragStart 
}: KC30AGridProps) {
  // Container ref for debugging
  const gridContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate cell spacing based on config
  const cellSpacing = config.cellWidth;

  // Render all 26 grid cells for KC30-A (13 columns, 2 rows)
  return (
    <div ref={gridContainerRef} className="absolute inset-0">
      {/* Grid cells for KC30-A - 26 pallets (2x13) */}
      {(() => {
        // Create array of cells for both rows (13 columns x 2 rows = 26 positions total)
        return (
          <>
            {/* First row - positions 1-13 */}
            {[...Array(config.cols)].map((_, i) => {
              // Position label like "P1", "P2", etc.
              const positionLabel = `P${i + 1}`;
              
              // Find if a pallet is assigned to this position
              const assignedPallet = pallets.find(p => 
                p.location === "cargo" && 
                p.positionLabel === positionLabel
              );
              
              // Style for the grid cell
              const cellStyle = {
                left: i * cellSpacing,
                top: 10,
                width: config.cellWidth,
                height: config.cellHeight
              };
              
              return (
                <CargoGridCell
                  key={`kc30a-cell-row1-${i}`}
                  positionLabel={positionLabel}
                  assignedPallet={assignedPallet}
                  cellStyle={cellStyle}
                  onDragStart={onDragStart}
                  onClick={(e) => {
                    if (assignedPallet) {
                      debugLog("KC30A position clicked", { 
                        id: assignedPallet.id, 
                        position: positionLabel 
                      });
                      onPalletCellClick(e, assignedPallet, positionLabel);
                    }
                  }}
                />
              );
            })}
            
            {/* Second row - positions 14-26 */}
            {[...Array(config.cols)].map((_, i) => {
              // Position label like "P14", "P15", etc.
              const positionLabel = `P${i + 14}`;
              
              // Find if a pallet is assigned to this position
              const assignedPallet = pallets.find(p => 
                p.location === "cargo" && 
                p.positionLabel === positionLabel
              );
              
              // Style for the grid cell
              const cellStyle = {
                left: i * cellSpacing,
                top: 105,
                width: config.cellWidth,
                height: config.cellHeight
              };
              
              return (
                <CargoGridCell
                  key={`kc30a-cell-row2-${i}`}
                  positionLabel={positionLabel}
                  assignedPallet={assignedPallet}
                  cellStyle={cellStyle}
                  onDragStart={onDragStart}
                  onClick={(e) => {
                    if (assignedPallet) {
                      debugLog("KC30A position clicked", { 
                        id: assignedPallet.id, 
                        position: positionLabel 
                      });
                      onPalletCellClick(e, assignedPallet, positionLabel);
                    }
                  }}
                />
              );
            })}
          </>
        );
      })()}
    </div>
  );
}