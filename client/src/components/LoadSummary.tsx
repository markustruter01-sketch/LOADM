import { Package2 } from "lucide-react";
import { formatNumber } from "@/utils/load-planning-utils";

interface LoadSummaryProps {
  currentLoad: number;
  maxPayload: number;
  positionsFilled: number;
  totalPositions: number;
  balanceCG: number;
  /** Display unit for weights (defaults to kg). */
  unit?: string;
}

export default function LoadSummary({
  currentLoad,
  maxPayload,
  positionsFilled,
  totalPositions,
  balanceCG,
  unit = 'kg'
}: LoadSummaryProps) {
  // Calculate color for CG value
  const getCGColor = () => {
    // Use interpolated colors similar to the balance scale, but never use red
    if (Math.abs(balanceCG - 53) < 10) {
      return '#22c55e'; // Green center (close to 53 degrees)
    } else if (Math.abs(balanceCG - 53) < 20) {
      return '#84cc16'; // Light green/yellow-green
    } else if (Math.abs(balanceCG - 53) < 30) {
      return '#f59e0b'; // Amber
    } else {
      return '#ea580c'; // Orange (instead of red)
    }
  };

  return (
    <div className="bg-card p-4 rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Package2 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Load Summary</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md p-3 bg-background border border-border">
          <p className="text-xs font-medium">Current Load</p>
          <p className="text-lg font-semibold">{formatNumber(currentLoad)} {unit}</p>
        </div>
        
        <div className="rounded-md p-3 bg-background border border-border">
          <p className="text-xs font-medium">Maximum Payload</p>
          <p className="text-lg font-semibold">{formatNumber(maxPayload)} {unit}</p>
        </div>
        
        <div className="rounded-md p-3 bg-background border border-border">
          <p className="text-xs font-medium">Cargo Positions Filled</p>
          <p className="text-lg font-semibold">
            {positionsFilled} of {totalPositions}
          </p>
        </div>
        
        <div className="rounded-md p-3 relative bg-background border border-border">
          <p className="text-xs font-medium">Centre of Gravity</p>
          <p className="flex items-center gap-2">
            <span style={{ 
              color: getCGColor(),
              fontWeight: 600,
              fontSize: '1.8rem', // 50% larger than text-lg (1.2rem)
            }}>{balanceCG.toFixed(2)}°</span>
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: getCGColor() }}></span>
          </p>
        </div>
      </div>
      
      <div className="flex items-center mt-4 px-3 py-2 bg-primary/10 text-primary rounded text-sm">
        <span className="font-medium">{formatNumber(currentLoad)}</span>
        <span className="mx-1">/</span>
        <span>{formatNumber(maxPayload)} {unit}</span>
      </div>
    </div>
  );
}