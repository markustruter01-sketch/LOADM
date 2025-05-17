/**
 * Common type definitions for the load planning module
 */

export interface Pallet {
  id: number;
  position: { x: number; y: number };
  location: "cargo" | "configure";
  weight: number | null;
  size: { width: number; height: number };
  cargoType?: "C" | "DG"; // C = Normal Cargo, DG = Dangerous Goods
  cargoCategory?: string; // Like "Pax Bags", "Mechanical", "Medical Equipment", etc.
  dgClass?: string; // Class of dangerous goods (1-9)
  positionLabel?: string; // Store position label like "P1", "P2", etc.
}

export interface DropZone {
  id: number;
  position: { x: number; y: number };
  occupied: boolean;
  area: "cargo" | "configure";
}

export interface AircraftConfig {
  id: string;
  name: string;
  maxPayload: number; // kg
  maxPalletWeight: number; // kg
  positions: number; // Total number of pallet positions
}

export interface GridConfig {
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
  cellPadding: number;
  palletWidth: number;
  palletHeight: number;
}

export interface BalanceData {
  balanceValue: number; // -100 to 100 range
  balanceCG: number; // 18-88 degrees
  status: 'safe' | 'moderate' | 'warning' | 'caution';
}

export interface PalletFormData {
  id: number;
  weight: number | null;
  cargoType: "C" | "DG";
  cargoCategory: string;
  dgClass: string;
  position: string;
}

export type CargoCategory = 
  | 'pax' // Passenger Bags
  | 'mechanical' 
  | 'medical' 
  | 'perishable'
  | 'general'; // General Cargo

export type DangerousGoodsClass = 
  | '1' // Explosives
  | '2' // Gases
  | '3' // Flammable Liquids
  | '4' // Flammable Solids
  | '5' // Oxidizing Substances
  | '6' // Toxic Substances
  | '7' // Radioactive Material
  | '8' // Corrosives
  | '9'; // Miscellaneous