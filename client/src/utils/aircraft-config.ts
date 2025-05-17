// Aircraft configuration and balance utility functions

export interface AircraftConfig {
  id: string;
  name: string;
  maxPayload: number; // kg
  maxPalletWeight: number; // kg
  positions: number; // Total number of pallet positions
}

// Aircraft configuration - only KC30-A
export const aircraftConfigs: Record<string, AircraftConfig> = {
  kc30a: {
    id: 'kc30a',
    name: 'Airbus KC30-A',
    maxPayload: 45000, // kg
    maxPalletWeight: 6800, // kg (15,000 lbs)
    positions: 26
  }
};

export interface GridConfig {
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
  cellPadding: number;
  palletWidth: number;
  palletHeight: number;
}

/**
 * Get KC30-A grid configuration based on balance scale width
 */
export const getAircraftGridConfig = (balanceScaleWidth: number = 715): GridConfig => {
  const totalWidth = balanceScaleWidth || 715; // Default if not measured yet
  
  // KC30-A has 13 columns in 2 rows
  const kc30aCellWidth = totalWidth / 13;
  const kc30aCellHeight = 76;
  return {
    rows: 2,
    cols: 13,
    cellWidth: kc30aCellWidth,
    cellHeight: kc30aCellHeight,
    cellPadding: 0,
    palletWidth: kc30aCellWidth * 0.9,
    palletHeight: kc30aCellHeight * 0.9
  };
};

/**
 * Calculate the normalized position value for balance calculations
 * Specific to KC30-A: 13 columns, 2 rows layout with 14 forward and 12 aft positions
 */
export const calculateNormalizedPosition = (
  positionNumber: number
): number => {
  // For KC30-A: 13 columns, 2 rows - normalize position with 14 forward and 12 aft
  const col = positionNumber % 13;
  // First 7 positions in each row (14 total) are forward section
  // Remaining 6 positions in each row (12 total) are aft section
  const rowOffset = positionNumber < 13 ? 0 : 0.2; // Slight adjustment for aft row
  return (col - 6) / 6 + rowOffset; // -1 to 1 across columns with row adjustment
};

/**
 * Convert a position string like "P1" to a number
 */
export const positionLabelToNumber = (positionLabel: string): number => {
  return parseInt(positionLabel.replace('P', '')) || 0;
};

/**
 * Calculate balance value (-100 to 100) and CG value (18-88 degrees)
 * Optimized for KC30-A aircraft
 */
export const calculateBalance = (
  pallets: Array<{
    weight: number | null;
    positionLabel?: string;
    position: { x: number };
    size: { width: number };
    location: string;
  }>,
  cargoWidth: number = 715
): { balanceValue: number; balanceCG: number; status: 'safe' | 'moderate' | 'warning' | 'caution' } => {
  let totalWeightMoment = 0;
  let totalWeightInCargo = 0;
  
  // Process each pallet in the cargo area
  pallets.filter(p => p.location === "cargo" && p.weight !== null).forEach(pallet => {
    const weight = pallet.weight || 0;
    
    // Extract position number from position label (e.g., "P1" -> 1)
    const positionNumber = pallet.positionLabel 
      ? positionLabelToNumber(pallet.positionLabel) 
      : 0;
    
    const normalizedPosition = calculateNormalizedPosition(
      positionNumber
    );
    
    // Calculate moment (weight * position)
    totalWeightMoment += weight * normalizedPosition;
    totalWeightInCargo += weight;
  });
  
  // Calculate balance value (-100 to 100)
  let balance = 0;
  if (totalWeightInCargo > 0) {
    // Normalize to -100 to 100 range
    balance = (totalWeightMoment / totalWeightInCargo) * 100;
  }
  
  // Calculate Centre of Gravity value (18-88 degrees)
  // Map from -100:100 to 18:88 (70 degree range) with 2 decimal precision
  const cgExact = ((balance + 100) / 200) * 70 + 18;
  
  // Convert to fixed string with 2 decimal places and parse back for consistent formatting
  const cg = parseFloat(cgExact.toFixed(2));
  
  // Determine balance status based on value
  let status: 'safe' | 'moderate' | 'warning' | 'caution' = 'safe';
  if (Math.abs(balance) < 20) {
    status = 'safe'; // Green center zone
  } else if (Math.abs(balance) < 40) {
    status = 'moderate'; // Yellow-green zone
  } else if (Math.abs(balance) < 60) {
    status = 'warning'; // Amber zone
  } else {
    status = 'caution'; // Orange zone
  }
  
  return { balanceValue: balance, balanceCG: cg, status };
};

/**
 * Check if the balance is at or beyond limits (18-88 degrees)
 */
export const isBalanceAtOrBeyondLimits = (cg: number): boolean => {
  const displayValue = cg.toFixed(2);
  return displayValue === "18.00" || displayValue === "88.00" || cg < 18 || cg > 88;
};

/**
 * Calculate consistent pallet dimensions based on cell dimensions
 */
export const calculatePalletDimensions = (
  cellWidth: number, 
  cellHeight: number
): { width: number; height: number } => {
  // Make pallets 10% smaller than cells for better visual appearance
  return {
    width: cellWidth * 0.9,
    height: cellHeight * 0.9
  };
};