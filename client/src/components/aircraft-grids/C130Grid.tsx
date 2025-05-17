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

interface C130GridProps {
  config: GridConfig;
  pallets: Pallet[];
  onPalletCellClick: (e: React.MouseEvent, pallet: Pallet, posLabel: string) => void;
  onDragStart: (e: React.DragEvent, id: number) => void;
}

export default function C130Grid({ 
  config, 
  pallets, 
  onPalletCellClick, 
  onDragStart 
}: C130GridProps) {
  // Container ref for debugging
  const gridContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate cell spacing based on config
  const cellSpacing = config.cellWidth + config.cellPadding;

  // Render all 8 grid cells for C-130 (4 columns, 2 rows)
  return (
    <div ref={gridContainerRef} className="absolute inset-0">
      {/* Grid cells for C-130 - 8 pallets (4x2) */}
      {(() => {
        // Create array of cells for both rows
        return (
          <>
            {/* First row - positions 1-4 */}
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
                  key={`c130-cell-row1-${i}`}
                  positionLabel={positionLabel}
                  assignedPallet={assignedPallet}
                  cellStyle={cellStyle}
                  onDragStart={onDragStart}
                  onClick={(e) => {
                    if (assignedPallet) {
                      debugLog("C130 position clicked", { 
                        id: assignedPallet.id, 
                        position: positionLabel 
                      });
                      onPalletCellClick(e, assignedPallet, positionLabel);
                    }
                  }}
                />
              );
            })}
            
            {/* Second row - positions 5-8 */}
            {[...Array(config.cols)].map((_, i) => {
              // Position label like "P5", "P6", etc.
              const positionLabel = `P${i + 5}`;
              
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
                  key={`c130-cell-row2-${i}`}
                  positionLabel={positionLabel}
                  assignedPallet={assignedPallet}
                  cellStyle={cellStyle}
                  onDragStart={onDragStart}
                  onClick={(e) => {
                    if (assignedPallet) {
                      debugLog("C130 position clicked", { 
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