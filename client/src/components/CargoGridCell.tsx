import { Badge } from "@/components/ui/badge";

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

interface CargoGridCellProps {
  positionLabel: string;
  assignedPallet: Pallet | undefined;
  cellStyle: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  onDragStart?: (e: React.DragEvent, id: number) => void;
  onClick?: (e: React.MouseEvent) => void;
  weightUnitLabel?: string; // Add prop for weight unit (kg or lbs)
}

export default function CargoGridCell({
  positionLabel,
  assignedPallet,
  cellStyle,
  onDragStart,
  onClick,
  weightUnitLabel = 'kg' // Default to kg if not specified
}: CargoGridCellProps) {
  // Determine cell background color based on occupation
  const bgColor = assignedPallet ? 
    'rgba(234, 88, 12, 0.7)' :  // Orange for occupied
    'rgba(20, 83, 45, 0.15)';   // Green for empty
  
  // Determine border color based on occupation
  const borderColor = assignedPallet ?
    'border-orange-500' :      // Orange border for occupied
    'border-green-800/80';     // Green border for empty

  return (
    <div 
      key={`cell-${positionLabel}`}
      draggable={!!assignedPallet}
      onDragStart={assignedPallet && onDragStart ? 
        (e) => onDragStart(e, assignedPallet.id) : 
        undefined
      }
      onClick={onClick}
      className={`absolute border-2 ${borderColor} rounded-sm ${assignedPallet ? 'cursor-pointer' : ''}`}
      style={{
        left: cellStyle.left,
        top: cellStyle.top,
        width: cellStyle.width,
        height: cellStyle.height,
        backgroundColor: bgColor,
        zIndex: assignedPallet ? 10 : 1
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* If no pallet is assigned, show pale label in center */}
        {!assignedPallet && (
          <div className="text-white/50 font-bold text-lg">
            {positionLabel}
          </div>
        )}
        
        {/* Weight info - only if position is occupied */}
        {assignedPallet && (
          <div className="flex-1 flex flex-col items-center justify-center text-white font-bold">
            {assignedPallet.weight !== null ? 
              <span>{assignedPallet.weight} {weightUnitLabel}</span> : 
              <span className="text-white/80">No weight</span>
            }
          </div>
        )}
        
        {/* Cargo type badge - only if position is occupied */}
        {assignedPallet && assignedPallet.cargoType && (
          <div className="absolute top-1 right-1">
            <Badge 
              variant={assignedPallet.cargoType === "C" ? "outline" : "destructive"}
              className="text-xs px-1"
            >
              {assignedPallet.cargoType}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}