/**
 * Utility functions for load planning operations
 */

import { calculateNormalizedPosition, positionLabelToNumber } from './aircraft-config';

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
 * Finds the best position for a dragged pallet based on drop coordinates
 */
export const findBestDropPosition = (
  dropX: number,
  dropY: number,
  aircraftId: string,
  gridConfig: any,
  pallets: Pallet[],
): { positionLabel: string; snapX: number; snapY: number } => {
  let positionLabel = "";
  let snapX = 0;
  let snapY = 0;
  let closestDistance = Number.MAX_VALUE;
  
  // Get specific configuration based on aircraft type
  if (aircraftId === 'c17') {
    // C-17 has 9 columns in 2 rows (18 positions total)
    const cellWidth = gridConfig.cellWidth;
    const cellHeight = gridConfig.cellHeight;
    
    // Check first row (positions 1-9)
    for (let col = 0; col < 9; col++) {
      const cellX = col * cellWidth + cellWidth/2; // center of cell
      const cellY = 10 + cellHeight/2; // center of cell
      
      const distance = Math.sqrt(
        Math.pow(dropX - cellX, 2) + 
        Math.pow(dropY - cellY, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        positionLabel = `P${col + 1}`;
        
        // Calculate snap position (centered in cell)
        snapX = col * cellWidth + (cellWidth - (cellWidth * 0.9)) / 2;
        snapY = 10 + (cellHeight - (cellHeight * 0.9)) / 2;
      }
    }
    
    // Check second row (positions 10-18)
    for (let col = 0; col < 9; col++) {
      const cellX = col * cellWidth + cellWidth/2; // center of cell
      const cellY = 105 + cellHeight/2; // center of cell
      
      const distance = Math.sqrt(
        Math.pow(dropX - cellX, 2) + 
        Math.pow(dropY - cellY, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        positionLabel = `P${col + 10}`;
        
        // Calculate snap position (centered in cell)
        snapX = col * cellWidth + (cellWidth - (cellWidth * 0.9)) / 2;
        snapY = 105 + (cellHeight - (cellHeight * 0.9)) / 2;
      }
    }
  } else if (aircraftId === 'c130') {
    // C-130 has 4 columns in 2 rows (8 positions total)
    const cellWidth = gridConfig.cellWidth;
    const cellHeight = gridConfig.cellHeight;
    const cellSpacing = cellWidth + gridConfig.cellPadding;
    
    // Check first row (positions 1-4)
    for (let col = 0; col < 4; col++) {
      const cellX = col * cellSpacing + cellWidth/2; // center of cell
      const cellY = 10 + cellHeight/2; // center of cell
      
      const distance = Math.sqrt(
        Math.pow(dropX - cellX, 2) + 
        Math.pow(dropY - cellY, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        positionLabel = `P${col + 1}`;
        
        // Calculate snap position (centered in cell)
        snapX = col * cellSpacing + (cellWidth - (cellWidth * 0.9)) / 2;
        snapY = 10 + (cellHeight - (cellHeight * 0.9)) / 2;
      }
    }
    
    // Check second row (positions 5-8)
    for (let col = 0; col < 4; col++) {
      const cellX = col * cellSpacing + cellWidth/2; // center of cell
      const cellY = 105 + cellHeight/2; // center of cell
      
      const distance = Math.sqrt(
        Math.pow(dropX - cellX, 2) + 
        Math.pow(dropY - cellY, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        positionLabel = `P${col + 5}`;
        
        // Calculate snap position (centered in cell)
        snapX = col * cellSpacing + (cellWidth - (cellWidth * 0.9)) / 2;
        snapY = 105 + (cellHeight - (cellHeight * 0.9)) / 2;
      }
    }
  } else if (aircraftId === 'kc30a') {
    // KC30-A has 13 columns in 2 rows (26 positions total)
    const cellWidth = gridConfig.cellWidth;
    const cellHeight = gridConfig.cellHeight;
    
    // Check first row (positions 1-13)
    for (let col = 0; col < 13; col++) {
      const cellX = col * cellWidth + cellWidth/2; // center of cell
      const cellY = 10 + cellHeight/2; // center of cell
      
      const distance = Math.sqrt(
        Math.pow(dropX - cellX, 2) + 
        Math.pow(dropY - cellY, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        positionLabel = `P${col + 1}`;
        
        // Calculate snap position (centered in cell)
        snapX = col * cellWidth + (cellWidth - (cellWidth * 0.9)) / 2;
        snapY = 10 + (cellHeight - (cellHeight * 0.9)) / 2;
      }
    }
    
    // Check second row (positions 14-26)
    for (let col = 0; col < 13; col++) {
      const cellX = col * cellWidth + cellWidth/2; // center of cell
      const cellY = 105 + cellHeight/2; // center of cell
      
      const distance = Math.sqrt(
        Math.pow(dropX - cellX, 2) + 
        Math.pow(dropY - cellY, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        positionLabel = `P${col + 14}`;
        
        // Calculate snap position (centered in cell)
        snapX = col * cellWidth + (cellWidth - (cellWidth * 0.9)) / 2;
        snapY = 105 + (cellHeight - (cellHeight * 0.9)) / 2;
      }
    }
  } else {
    // C-27J has 3 columns in 1 row (3 positions total)
    for (let col = 0; col < 3; col++) {
      const cellWidth = 132;
      const cellHeight = 96;
      const cellX = col * 144 + cellWidth/2; // center of cell
      const cellY = 20 + cellHeight/2; // center of cell
      
      const distance = Math.sqrt(
        Math.pow(dropX - cellX, 2) + 
        Math.pow(dropY - cellY, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        positionLabel = `P${col + 1}`;
        
        // Update the pallet size to be consistently 10% smaller
        const palletWidth = cellWidth * 0.9;
        const palletHeight = cellHeight * 0.9;
        
        // Calculate snap position (centered in cell)
        snapX = col * 144 + (cellWidth - palletWidth) / 2;
        snapY = 20 + (cellHeight - palletHeight) / 2;
      }
    }
  }
  
  return { positionLabel, snapX, snapY };
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