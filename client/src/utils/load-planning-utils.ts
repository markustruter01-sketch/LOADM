/**
 * Utility functions for load planning operations
 */


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

/**
 * Generates a unique ID for a new pallet
 */
export const generatePalletId = (pallets: Pallet[]): number => {
  if (pallets.length === 0) return 1;
  return Math.max(...pallets.map(p => p.id)) + 1;
};

/**
 * Check if a pallet will exceed aircraft payload limits when added
 */
export const checkPayloadLimits = (
  pallets: Pallet[], 
  palletWeight: number,
  editingPalletId: number | null,
  maxPayload: number
): boolean => {
  // Calculate total weight excluding the current pallet
  const otherPalletsWeight = pallets
    .filter(p => (editingPalletId ? p.id !== editingPalletId : true) && p.location === "cargo" && p.weight !== null)
    .reduce((sum, p) => sum + (p.weight || 0), 0);
  
  // Check if total payload exceeds maximum aircraft capacity
  const totalWeight = otherPalletsWeight + palletWeight;
  return totalWeight <= maxPayload;
};

/**
 * Calculates the total weight of all pallets in the cargo area
 */
export const calculateTotalWeight = (pallets: Pallet[]): number => {
  return pallets
    .filter(p => p.location === "cargo" && p.weight !== null)
    .reduce((sum, p) => sum + (p.weight || 0), 0);
};

/**
 * Check if a position is already occupied by another pallet
 */
export const isPositionOccupied = (
  pallets: Pallet[],
  positionLabel: string,
  excludePalletId?: number
): boolean => {
  return pallets.some(p => 
    p.location === "cargo" && 
    p.positionLabel === positionLabel &&
    (excludePalletId === undefined || p.id !== excludePalletId)
  );
};

/**
 * Format a number with thousand separators for display
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};