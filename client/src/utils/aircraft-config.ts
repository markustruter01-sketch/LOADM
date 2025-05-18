// Aircraft configuration and balance utility functions

export interface AircraftConfig {
  id: string;
  name: string;
  maxPayload: number; // kg for KC30A, lbs for others
  maxPalletWeight: number; // kg for KC30A, lbs for others
  positions: number; // Total number of pallet positions
  useKg?: boolean; // Flag to indicate if this aircraft uses kg (true) or lbs (false/undefined)
}

// Conversion functions
export const kgToLbs = (kg: number): number => {
  return kg * 2.20462;
};

export const lbsToKg = (lbs: number): number => {
  return lbs / 2.20462;
};

// Aircraft configurations
export const aircraftConfigs: Record<string, AircraftConfig> = {
  c27j: {
    id: 'c27j',
    name: 'Spartan C-27J',
    maxPayload: 24912, // lbs (converted from 11,300 kg)
    maxPalletWeight: 10000, // lbs
    positions: 3,
    useKg: false
  },
  c17: {
    id: 'c17',
    name: 'Globemaster C-17',
    maxPayload: 170860, // lbs (converted from 77,500 kg)
    maxPalletWeight: 22046, // lbs (converted from 10,000 kg)
    positions: 18,
    useKg: false
  },
  c130: {
    id: 'c130',
    name: 'Hercules C-130',
    maxPayload: 44092, // lbs (converted from 20,000 kg)
    maxPalletWeight: 10000, // lbs
    positions: 8,
    useKg: false
  },
  kc30a: {
    id: 'kc30a',
    name: 'Airbus KC30-A',
    maxPayload: 45000, // kg (keeping as kg)
    maxPalletWeight: 6800, // kg (keeping as kg)
    positions: 26,
    useKg: true
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
 * Get aircraft grid configuration based on aircraft type and balance scale width
 */
export const getAircraftGridConfig = (aircraft: string, balanceScaleWidth: number = 715): GridConfig => {
  const totalWidth = balanceScaleWidth || 715; // Default if not measured yet
  
  switch (aircraft) {
    case 'c17':
      // C-17 has 9 columns in 2 rows
      const c17CellWidth = totalWidth / 9;
      const c17CellHeight = 87;
      return {
        rows: 2,
        cols: 9,
        cellWidth: c17CellWidth,
        cellHeight: c17CellHeight,
        cellPadding: 0,
        palletWidth: c17CellWidth * 0.9,
        palletHeight: c17CellHeight * 0.9
      };
      
    case 'c130':
      // C-130 has 4 columns in 2 rows
      const c130CellWidth = totalWidth / 4;
      const c130CellHeight = 96;
      return {
        rows: 2,
        cols: 4,
        cellWidth: c130CellWidth,
        cellHeight: c130CellHeight,
        cellPadding: 4,
        palletWidth: c130CellWidth * 0.9,
        palletHeight: c130CellHeight * 0.9
      };
      
    case 'kc30a':
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
      
    case 'c27j':
    default:
      // C-27J has 3 columns in 1 row
      const cellWidth = totalWidth / 3;
      const cellHeight = 96;
      return {
        rows: 1,
        cols: 3,
        cellWidth: cellWidth,
        cellHeight: cellHeight,
        cellPadding: 4,
        palletWidth: cellWidth * 0.9,
        palletHeight: cellHeight * 0.9
      };
  }
};

/**
 * Calculate the normalized position value for balance calculations based on aircraft type and position
 */
export const calculateNormalizedPosition = (
  aircraftId: string, 
  positionNumber: number, 
  width: number = 0, 
  x: number = 0
): number => {
  let normalizedPosition = 0;
  
  switch (aircraftId) {
    case 'kc30a':
      // For KC30-A: 13 columns, 2 rows - normalize position with 14 forward and 12 aft
      const col = positionNumber % 13;
      // First 7 positions in each row (14 total) are forward section
      // Remaining 6 positions in each row (12 total) are aft section
      const rowOffset = positionNumber < 13 ? 0 : 0.2; // Slight adjustment for aft row
      normalizedPosition = (col - 6) / 6 + rowOffset; // -1 to 1 across columns with row adjustment
      break;
      
    case 'c27j':
      // For 3-position aircraft: -0.66 (left/P1), 0 (center/P2), 0.66 (right/P3)
      normalizedPosition = (positionNumber - 1) * 0.66; // -0.66, 0, 0.66
      break;
      
    case 'c17':
      // For C-17: 9 columns, 2 rows - normalize position across columns 
      const c17Col = positionNumber % 9;
      normalizedPosition = (c17Col - 4) / 4; // -1 to 1 across columns
      break;
      
    case 'c130':
      // For C-130: 4 columns, 2 rows - normalize position across columns
      const c130Col = positionNumber % 4;
      normalizedPosition = (c130Col - 1.5) / 1.5; // -1 to 1 across columns
      break;
      
    default:
      // Fallback to old calculation if we can't determine position
      const centerPosition = (x + width / 2) / 715; // Using default width if needed
      normalizedPosition = (centerPosition * 2) - 1;
  }
  
  return normalizedPosition;
};

/**
 * Convert a position string like "P1" to a number
 */
export const positionLabelToNumber = (positionLabel: string): number => {
  return parseInt(positionLabel.replace('P', '')) || 0;
};

/**
 * Calculate balance value (-100 to 100) and CG value (18-88 degrees)
 */
export const calculateBalance = (
  pallets: Array<{
    weight: number | null;
    positionLabel?: string;
    position: { x: number };
    size: { width: number };
    location: string;
  }>,
  aircraftId: string,
  cargoWidth: number = 715
): { balanceValue: number; balanceCG: number; status: 'safe' | 'moderate' | 'warning' | 'caution' } => {
  let totalWeightMoment = 0;
  let totalWeightInCargo = 0;
  
  // Process each pallet in the cargo area
  pallets.filter(p => p.location === "cargo" && p.weight !== null).forEach(pallet => {
    const weight = pallet.weight || 0;
    let normalizedPosition = 0;
    
    // Extract position number from position label (e.g., "P1" -> 1)
    const positionNumber = pallet.positionLabel 
      ? positionLabelToNumber(pallet.positionLabel) 
      : 0;
    
    normalizedPosition = calculateNormalizedPosition(
      aircraftId, 
      positionNumber, 
      pallet.size.width, 
      pallet.position.x
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