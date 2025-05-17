import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, Package2, RefreshCw, AlertCircle, AlertTriangle, X, Plane, MessagesSquare } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangleIcon } from "lucide-react";
import LoadBalanceChat from "@/components/LoadBalanceChat";

interface Pallet {
  id: number;
  position: { x: number; y: number };
  location: "cargo" | "configure";
  weight: number | null;
  size: { width: number; height: number };
  cargoType?: "C" | "DG"; // C = Normal Cargo, DG = Dangerous Goods
  cargoCategory?: string; // Like "Pax Bags", "Mechanical", "Medical Equipment", etc.
  dgClass?: string; // Class of dangerous goods (1-9)
  positionLabel?: string; // Store position label like "P1", "P2", etc.
  containerType?: "pallet" | "ld3"; // The type of container (pallet or LD3)
}

interface DropZone {
  id: number;
  position: { x: number; y: number };
  occupied: boolean;
  area: "cargo" | "configure";
}

interface AircraftConfig {
  id: string;
  name: string;
  maxPayload: number; // kg
  maxPalletWeight: number; // kg
}

export default function LoadPlanningPage() {
  const [_, navigate] = useLocation();
  const [match, params] = useRoute("/load-planning/:aircraftId");
  const { toast } = useToast();
  
  // State for cargo type selection (Pallets or LD3's)
  const [cargoType, setCargoType] = useState<"pallets" | "ld3s">("pallets");
  
  // Aircraft configurations
  const aircraftConfigs: Record<string, AircraftConfig> = {
    c27j: {
      id: 'c27j',
      name: 'Spartan C-27J',
      maxPayload: 11300, // kg
      maxPalletWeight: 4536, // kg (10,000 lbs)
    },
    c17: {
      id: 'c17',
      name: 'Globemaster C-17',
      maxPayload: 77500, // kg
      maxPalletWeight: 10000, // kg
    },
    c130: {
      id: 'c130',
      name: 'Hercules C-130',
      maxPayload: 20000, // kg
      maxPalletWeight: 4536, // kg (10,000 lbs)
    },
    kc30a: {
      id: 'kc30a',
      name: 'Airbus KC30-A',
      maxPayload: 45000, // kg
      maxPalletWeight: 6800, // kg (15,000 lbs)
    }
  };
  
  // Get current aircraft configuration or default to C-27J
  const currentAircraftId = match ? params.aircraftId : 'c27j';
  const currentAircraft = aircraftConfigs[currentAircraftId] || aircraftConfigs.c27j;
  
  // Create pallets array - in new design, we start with empty pallets array
  const [pallets, setPallets] = useState<Pallet[]>([]);
  
  // Balance state: -100 (fully left/forward) to 100 (fully right/aft), 0 is perfectly balanced
  const [balanceValue, setBalanceValue] = useState(0);
  const [balanceCG, setBalanceCG] = useState(53.00); // Centre of Gravity value (18-88 degrees) with decimal precision
  const [balanceStatus, setBalanceStatus] = useState<'safe' | 'moderate' | 'warning' | 'caution'>('safe');
  
  // Fixed warning popup state - simple approach with hard-coded thresholds
  const [warningPopup, setWarningPopup] = useState(false);
  
  // Keep track of the balance scale width to make cargo area match it
  const [balanceScaleWidth, setBalanceScaleWidth] = useState(0);
  const balanceScaleRef = useRef<HTMLDivElement>(null);
  
  // Helper function to get aircraft grid configuration
  const getAircraftGridConfig = (aircraft: string): {
    rows: number;
    cols: number;
    cellWidth: number;
    cellHeight: number;
    cellPadding: number;
    palletWidth: number;
    palletHeight: number;
  } => {
    // Calculate the optimal cell dimensions based on the balance scale width
    // Use exact balance scale width to ensure perfect alignment
    const totalWidth = balanceScaleWidth || 715; // Default if not measured yet
    // Grid configuration for aircraft
    
    switch (aircraft) {
      case 'c17':
        // C-17 has 9 columns in 2 rows
        // Use exact division (not Math.floor) to match balance scale width perfectly
        const c17CellWidth = totalWidth / 9;
        const c17CellHeight = 87;
        return {
          rows: 2,
          cols: 9,
          cellWidth: c17CellWidth,
          cellHeight: c17CellHeight,
          cellPadding: 0, // No padding to ensure perfect alignment
          palletWidth: c17CellWidth * 0.9,
          palletHeight: c17CellHeight * 0.9
        };
      
      case 'c130':
        // C-130 has 4 columns in 2 rows
        const c130CellWidth = totalWidth / 4;
        const c130CellHeight = 80;
        return {
          rows: 2,
          cols: 4,
          cellWidth: c130CellWidth,
          cellHeight: c130CellHeight,
          cellPadding: 0, // No padding to ensure perfect alignment
          palletWidth: c130CellWidth * 0.9,
          palletHeight: c130CellHeight * 0.9
        };
      
      case 'kc30a':
        // KC30-A has 26 positions in a 2x13 grid with 14 forward and 12 aft
        const kc30aCellWidth = totalWidth / 13;
        const kc30aCellHeight = 80;
        return {
          rows: 2,
          cols: 13,
          cellWidth: kc30aCellWidth,
          cellHeight: kc30aCellHeight,
          cellPadding: 0,
          palletWidth: kc30aCellWidth * 0.9,
          palletHeight: kc30aCellHeight * 0.9
        };
        
      default: // c27j only
        // C-27J has 3 columns in 1 row
        const spartanCellWidth = totalWidth / 3;
        const spartanCellHeight = 96;
        return {
          rows: 1,
          cols: 3,
          cellWidth: spartanCellWidth,
          cellHeight: spartanCellHeight,
          cellPadding: 0, // No padding to ensure perfect alignment
          palletWidth: spartanCellWidth * 0.9,
          palletHeight: spartanCellHeight * 0.9
        };
    }
  };
  
  // For backward compatibility with existing code
  const calculateCellDimensions = (aircraft: string): { width: number, spacing: number } => {
    const config = getAircraftGridConfig(aircraft);
    // Use exact width for spacing now that we removed padding, to ensure exact alignment with balance scale
    return {
      width: config.cellWidth,
      spacing: config.cellWidth
    };
  };
  
  // For backward compatibility with existing code
  const calculateCellWidth = (aircraft: string): number => {
    return getAircraftGridConfig(aircraft).cellWidth;
  };
  
  // Helper function to calculate pallet dimensions with 10% reduction and consistent positioning
  const calculatePalletDimensions = (
    cellWidth: number,
    cellHeight: number,
    col?: number,
    row?: number,
    xSpacing?: number,
    yOffset?: number
  ) => {
    // Apply 10% size reduction for all pallets
    const width = Math.floor(cellWidth * 0.9);
    const height = Math.floor(cellHeight * 0.9);
    
    return {
      width,
      height
    };
  };
  
  // Generate drop zones based on aircraft type
  const generateDropZones = (aircraftId: string): DropZone[] => {
    // Common drop zone creation function
    const createDropZones = (count: number, areaType: "cargo", startX: number, startY: number, spacingX: number) => {
      return Array.from({ length: count }, (_, index) => ({
        id: areaType === "cargo" ? index + 1 : count + index + 1,
        position: { x: startX + (index * spacingX), y: startY },
        occupied: false,
        area: areaType
      }));
    };
    
    switch (aircraftId) {
      case 'c17':
        // C-17 Globemaster - 18 slots (9 wide x 2 high)
        // Create custom drop zones for the 9x2 grid layout
        const c17CargoZones: DropZone[] = [];
        
        // Calculate grid cell dimensions
        const cellWidth = 100;  // Width of each grid cell
        const cellHeight = 126; // Height of each grid cell
        
        // First row - 9 positions
        for (let i = 0; i < 9; i++) {
          c17CargoZones.push({
            id: i + 1,
            position: { x: i * cellWidth + 4, y: 14 },
            occupied: false,
            area: "cargo"
          });
        }
        
        // Second row - 9 positions
        for (let i = 0; i < 9; i++) {
          c17CargoZones.push({
            id: i + 10, // IDs 10-18
            position: { x: i * cellWidth + 4, y: 140 },
            occupied: false,
            area: "cargo"
          });
        }
        
        // Storage zones have been removed
        return c17CargoZones;
        
      case 'c130':
        // C-130 Hercules - 8 slots
        const c130CargoZones = createDropZones(8, "cargo", 60, 60, 90);
        return c130CargoZones;
        
      case 'kc30a':
        // KC30-A - 26 slots (13 wide x 2 high) with 14 forward and 12 aft
        const kc30aCargoZones: DropZone[] = [];
        
        // Calculate grid cell dimensions
        const config = getAircraftGridConfig('kc30a');
        const kc30aCellWidth = config.cellWidth;
        const kc30aCellHeight = config.cellHeight;
        
        // First row - 13 positions
        for (let i = 0; i < 13; i++) {
          kc30aCargoZones.push({
            id: i + 1,
            position: { x: i * kc30aCellWidth, y: 14 },
            occupied: false,
            area: "cargo"
          });
        }
        
        // Second row - 13 positions
        for (let i = 0; i < 13; i++) {
          kc30aCargoZones.push({
            id: i + 14, // IDs 14-26
            position: { x: i * kc30aCellWidth, y: 94 },
            occupied: false,
            area: "cargo"
          });
        }
        
        return kc30aCargoZones;
        
      default:
        // C-27J Spartan (default) - 3 slots
        return [
          // Cargo area - where the pallets are loaded for transport
          { id: 1, position: { x: 80, y: 60 }, occupied: false, area: "cargo" },
          { id: 2, position: { x: 160, y: 60 }, occupied: false, area: "cargo" },
          { id: 3, position: { x: 240, y: 60 }, occupied: false, area: "cargo" },
        ];
    }
  };
  
  // Drop zones for the cargo area
  const [dropZones, setDropZones] = useState<DropZone[]>(generateDropZones(currentAircraftId));
  
  // Keep track of the next pallet ID for newly created pallets
  const [nextPalletId, setNextPalletId] = useState(1);
  
  // Track whether we're dragging the template pallet
  const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
  
  const [draggedPallet, setDraggedPallet] = useState<number | null>(null);
  const [totalWeight, setTotalWeight] = useState(0);
  const cargoRef = useRef<HTMLDivElement>(null);
  // Storage area has been removed
  const configureRef = useRef<HTMLDivElement>(null);
  
  // Alert dialog state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<'warning' | 'error'>('warning');
  
  // New pallet input popup states
  const [palletInputOpen, setPalletInputOpen] = useState(false);
  const [editingPalletId, setEditingPalletId] = useState<number | null>(null);
  const [palletWeight, setPalletWeight] = useState<string>("");
  const [palletCargoType, setPalletCargoType] = useState<"C" | "DG">("C"); // C = Normal Cargo, DG = Dangerous Goods
  const [palletPosition, setPalletPosition] = useState<string>("");
  const [palletCargoCategory, setPalletCargoCategory] = useState<string>("");
  const [palletDgClass, setPalletDgClass] = useState<string>("");
  const [isDangerousGoods, setIsDangerousGoods] = useState(false);
  
  // Show alert dialog
  const showAlert = (type: 'warning' | 'error', title: string, message: string) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };
  
  // Check if a position is already occupied
  const isPositionOccupied = (positionLabel: string, excludePalletId?: number) => {
    return pallets.some(p => 
      p.location === "cargo" && 
      p.positionLabel === positionLabel && 
      (excludePalletId === undefined || p.id !== excludePalletId)
    );
  };
  
  // Handle direct click on an existing pallet in the cargo area
  const handlePalletCellClick = (event: React.MouseEvent, pallet: Pallet, posLabel: string) => {
    // Log the click for debugging
    console.log("Pallet clicked:", pallet.id, posLabel);
    
    // Update dialog state for the pallet configuration popup
    setEditingPalletId(pallet.id);
    setPalletWeight(pallet.weight ? pallet.weight.toString() : "");
    setPalletCargoType(pallet.cargoType || "C");
    setPalletPosition(posLabel || pallet.positionLabel || "");
    setPalletCargoCategory(pallet.cargoCategory || "");
    setPalletDgClass(pallet.dgClass || "");
    setIsDangerousGoods(pallet.cargoType === "DG");
    
    // Open the pallet configuration dialog
    setPalletInputOpen(true);
  };
  
  // Calculate position based on aircraft grid layout
  const calculatePalletPosition = (cellWidth: number, cellHeight: number, col: number, row: number = 0, xOffset: number = 0, yOffset: number = 0) => {
    // Use existing calculatePalletDimensions for sizing
    const dimensions = calculatePalletDimensions(cellWidth, cellHeight, col, row, xOffset, yOffset);
    
    // Calculate center position for perfect snapping
    const xCenter = col * xOffset + (cellWidth - dimensions.width) / 2 + (col * cellWidth);
    const yCenter = row * yOffset + (cellHeight - dimensions.height) / 2 + (row * cellHeight);
    
    return {
      width: dimensions.width,
      height: dimensions.height,
      x: xCenter,
      y: yCenter
    };
  };
  
  // Handle pallet click - this will be called when a pallet in the cargo area is clicked
  const handlePalletClick = (palletId: number, position: string) => {
    showPalletInput(palletId, position);
  };

  // Show pallet input dialog
  const showPalletInput = (palletId: number, position?: string) => {
    // Show pallet configuration dialog
    
    const selectedPallet = pallets.find(p => p.id === palletId);
    // Get selected pallet data
    
    // Set defaults even if pallet is not found yet
    setEditingPalletId(palletId);
    setPalletWeight(selectedPallet?.weight ? selectedPallet.weight.toString() : "");
    setPalletCargoType(selectedPallet?.cargoType || "C");
    setPalletPosition(position || selectedPallet?.positionLabel || "");
    setPalletCargoCategory(selectedPallet?.cargoCategory || "");
    setPalletDgClass(selectedPallet?.dgClass || "");
    setIsDangerousGoods(selectedPallet?.cargoType === "DG");
    setPalletInputOpen(true);
  };
  
  // Handle pallet input confirmation
  const handlePalletInputConfirm = () => {
    if (!editingPalletId) return;
    
    // Get constants for current aircraft
    const MAX_PAYLOAD = currentAircraft.maxPayload;
    const MAX_PALLET_WEIGHT = currentAircraft.maxPalletWeight;
    
    // Process weight
    let weightValue: number | null = null;
    
    if (palletWeight !== "") {
      weightValue = parseInt(palletWeight) || 0;
      
      // Never allow negative weights
      if (weightValue < 0) weightValue = 0;
      
      // Check if pallet weight exceeds maximum pallet capacity
      if (weightValue > MAX_PALLET_WEIGHT) {
        showAlert(
          'error',
          'Pallet Weight Limit Exceeded',
          `The weight exceeds the maximum pallet capacity of ${MAX_PALLET_WEIGHT.toLocaleString()} kg.`
        );
        
        // Limit weight to max pallet capacity
        weightValue = MAX_PALLET_WEIGHT;
      }
      
      // Calculate total weight excluding the current pallet
      const otherPalletsWeight = pallets
        .filter(p => p.id !== editingPalletId && p.location === "cargo" && p.weight !== null)
        .reduce((sum, p) => sum + (p.weight || 0), 0);
      
      // Check if total payload exceeds maximum aircraft capacity
      const totalWeight = otherPalletsWeight + weightValue;
      if (totalWeight > MAX_PAYLOAD) {
        showAlert(
          'error',
          'Aircraft Payload Exceeded',
          `The total weight (${totalWeight.toLocaleString()} kg) exceeds the maximum payload capacity of ${MAX_PAYLOAD.toLocaleString()} kg.`
        );
        
        // Update weight but don't close dialog so user can adjust
        setPalletWeight(Math.max(0, MAX_PAYLOAD - otherPalletsWeight).toString());
        return;
      }
    }
    
    // Update the pallet
    setPallets(prev => prev.map(pallet => {
      if (pallet.id === editingPalletId) {
        return { 
          ...pallet, 
          weight: weightValue, 
          cargoType: isDangerousGoods ? "DG" : "C",
          cargoCategory: palletCargoCategory,
          dgClass: isDangerousGoods ? palletDgClass : undefined,
          positionLabel: palletPosition || pallet.positionLabel
        };
      }
      return pallet;
    }));
    
    // Close the dialog
    setPalletInputOpen(false);
  };
  
  // Measure the balance scale width and use it to set grid sizes
  useEffect(() => {
    const updateBalanceScaleWidth = () => {
      if (balanceScaleRef.current) {
        const width = balanceScaleRef.current.offsetWidth;
        setBalanceScaleWidth(width);
        // Balance scale width updated
      }
    };
    
    // Initial measurement
    updateBalanceScaleWidth();
    
    // Setup resize observer for dynamic resizing
    const resizeObserver = new ResizeObserver(() => {
      updateBalanceScaleWidth();
    });
    
    if (balanceScaleRef.current) {
      resizeObserver.observe(balanceScaleRef.current);
    }
    
    // Also handle window resize events as a backup
    window.addEventListener('resize', updateBalanceScaleWidth);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateBalanceScaleWidth);
    };
  }, []);
  
  // Constant for base pallet weight - 136kg (300lbs)
  const PALLET_BASE_WEIGHT = 136;
  
  // Helper function to render pallet weight with base weight included
  const renderPalletWeight = (pallet: Pallet) => {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white font-bold">
        {pallet.weight !== null ? (
          <>
            <span>{pallet.weight} kg</span>
            <span className="text-[9px] text-white/70 mt-0.5">
              +136kg base
            </span>
            <span className="text-[10px] text-white/90 mt-0.5">
              Total: {pallet.weight + PALLET_BASE_WEIGHT} kg
            </span>
          </>
        ) : (
          <>
            <span className="text-white/80">No cargo</span>
            <span className="text-[9px] text-white/70 mt-0.5">
              136kg base
            </span>
          </>
        )}
      </div>
    );
  };
  
  useEffect(() => {
    // Calculate total weight of pallets in cargo area
    // Add base pallet weight (136kg/300lbs) to each pallet but don't show in UI
    const weight = pallets.reduce((total, pallet) => {
      // Add base weight (136kg) plus configured weight for each pallet in cargo area
      return pallet.location === "cargo" ? total + (pallet.weight || 0) + PALLET_BASE_WEIGHT : total;
    }, 0);
    
    setTotalWeight(weight);
    
    // Calculate weight balance
    const cargoPallets = pallets.filter(p => p.location === "cargo");
    if (cargoPallets.length === 0) {
      setBalanceValue(0);
      setBalanceStatus('safe');
      return;
    }
    
    // Get the cargo area width from ref
    let cargoWidth = 0;
    if (cargoRef.current) {
      cargoWidth = cargoRef.current.offsetWidth;
    }
    
    if (cargoWidth === 0) {
      return; // Skip calculation if we can't determine cargo area width
    }
    
    // Calculate weight distribution based on horizontal position
    let totalWeightMoment = 0;
    let totalWeightInCargo = 0;
    
    // Log balance calculation info
    // Balance calculation based on cargo width and pallet configuration
    
    // Determine proper cell positioning based on the grid rather than pallet positions
    // This ensures correct weight distribution calculations for the balance scale
    cargoPallets.forEach(pallet => {
      // Add base weight (136kg) to each pallet's entered weight
      const palletWeight = (pallet.weight || 0) + PALLET_BASE_WEIGHT;
      
      // Extract position number from pallet label (e.g., 'P2' => 2)
      let positionNumber = 0;
      if (pallet.positionLabel && pallet.positionLabel.startsWith('P')) {
        positionNumber = parseInt(pallet.positionLabel.substring(1)) - 1; // 0-based index
      }
      
      // Calculate normalized position for balance based on position number, not pixel coordinates
      let normalizedPosition = 0;
      
      // Aircraft specific handling for weight distribution 
      if (currentAircraftId === 'kc30a') {
        // For KC30-A: 13 columns, 2 rows - normalize position with 14 forward and 12 aft
        const col = positionNumber % 13;
        // First 7 positions in each row (14 total) are forward section
        // Remaining 6 positions in each row (12 total) are aft section
        const rowOffset = positionNumber < 13 ? 0 : 0.2; // Slight adjustment for aft row
        normalizedPosition = (col - 6) / 6 + rowOffset; // -1 to 1 across columns with row adjustment
      } else if (currentAircraftId === 'c27j') {
        // For 3-position aircraft: -0.66 (left/P1), 0 (center/P2), 0.66 (right/P3)
        normalizedPosition = (positionNumber - 1) * 0.66; // -0.66, 0, 0.66
      } else if (currentAircraftId === 'c17') {
        // For C-17: 9 columns, 2 rows - normalize position across columns 
        const col = positionNumber % 9;
        normalizedPosition = (col - 4) / 4; // -1 to 1 across columns
      } else if (currentAircraftId === 'c130') {
        // For C-130: 4 columns, 2 rows - normalize position across columns
        const col = positionNumber % 4;
        normalizedPosition = (col - 1.5) / 1.5; // -1 to 1 across columns
      } else {
        // Fallback to old calculation if we can't determine position
        const centerPosition = (pallet.position.x + pallet.size.width / 2) / cargoWidth;
        normalizedPosition = (centerPosition * 2) - 1;
      }
      
      // Calculate weight moment for balance calculation
      
      // Calculate moment (weight * position)
      totalWeightMoment += palletWeight * normalizedPosition;
      totalWeightInCargo += palletWeight;
    });
    
    // Calculate balance value (-100 to 100)
    let balance = 0;
    if (totalWeightInCargo > 0) {
      // Normalize to -100 to 100 range and add dampening factor
      balance = (totalWeightMoment / totalWeightInCargo) * 100;
    }
    
    setBalanceValue(balance);
    
    // Calculate Centre of Gravity value (18-88 degrees)
    // Map from -100:100 to 18:88 (70 degree range) with 2 decimal precision
    const cgExact = ((balance + 100) / 200) * 70 + 18;
    
    // Convert to fixed string with 2 decimal places to display consistently
    const cgFixedString = cgExact.toFixed(2);
    
    // Parse back to number for calculations - this helps with boundary checking
    const cg = parseFloat(cgFixedString);
    
    // Use the new CG value directly for limit checking BEFORE updating state
    // This ensures we detect limits on the first pallet
    const displayValue = cg.toFixed(2);
    
    // Check if the displayed value in the UI matches our target values
    const atLimit = (displayValue === "88.00" || displayValue === "18.00");
    const beyondLimit = (cg < 18 || cg > 88);
    
    // Check if CG value is at or beyond acceptable limits
    
    // Now set the state for display purposes
    setBalanceCG(cg);
    
    // Check limits and set warning popup
    if (atLimit || beyondLimit) {
      // Force warning popup for any at-limit or beyond-limit values
      // Show warning for CG value outside acceptable range
      setWarningPopup(true);
      
      // Auto hide after 10 seconds
      setTimeout(() => {
        setWarningPopup(false);
      }, 10000);
    } else {
      // Within safe range
      setWarningPopup(false);
    }
    
    // Determine balance status - using more gradual transitions
    if (Math.abs(balance) < 20) {
      setBalanceStatus('safe'); // Green center zone
    } else if (Math.abs(balance) < 40) {
      setBalanceStatus('moderate'); // Yellow-green zone
    } else if (Math.abs(balance) < 60) {
      setBalanceStatus('warning'); // Amber zone
    } else {
      setBalanceStatus('caution'); // Orange zone (instead of danger/red)
    }
  }, [pallets]);
  
  const handleBackClick = () => {
    navigate("/load-planning");
  };
  
  const handleDragStart = (e: React.DragEvent, id: number | null) => {
    console.log("Drag start:", id);
    
    if (id === null) {
      // We're dragging the template pallet
      setIsDraggingTemplate(true);
      e.dataTransfer.setData("text/plain", "template");
      // Add an effect to show it's draggable
      e.dataTransfer.effectAllowed = "move";
    } else {
      // We're dragging an existing pallet
      e.dataTransfer.setData("text/plain", id.toString());
      setDraggedPallet(id);
      // Add an effect to show it's draggable
      e.dataTransfer.effectAllowed = "move";
      
      // Get the pallet that's being dragged
      const pallet = pallets.find(p => p.id === id);
      if (pallet) {
        // Create a visible drag image
        const dragImage = document.createElement('div');
        dragImage.style.width = '80px';
        dragImage.style.height = '80px';
        dragImage.style.backgroundColor = '#ea580c'; // Orange color
        dragImage.style.color = 'white';
        dragImage.style.display = 'flex';
        dragImage.style.alignItems = 'center';
        dragImage.style.justifyContent = 'center';
        dragImage.style.borderRadius = '4px';
        dragImage.style.fontWeight = 'bold';
        dragImage.textContent = pallet.positionLabel || 'Pallet';
        
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 40, 40);
        setTimeout(() => document.body.removeChild(dragImage), 0);
      }
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Show that the element can be dropped here
    e.dataTransfer.dropEffect = "move";
  };
  
  const handleWeightChange = (id: number, newWeight: string) => {
    // Get constants for current aircraft
    const MAX_PAYLOAD = currentAircraft.maxPayload;
    const MAX_PALLET_WEIGHT = currentAircraft.maxPalletWeight;
    
    // Allow empty string to clear weight
    if (newWeight === '') {
      setPallets(prev => prev.map(pallet => {
        if (pallet.id === id) {
          return { ...pallet, weight: null };
        }
        return pallet;
      }));
      return;
    }
    
    // Convert to number or default to 0 if invalid
    let weightValue = parseInt(newWeight) || 0;
    
    // Never allow negative weights
    if (weightValue < 0) weightValue = 0;
    
    // Check if pallet weight exceeds maximum pallet capacity
    if (weightValue > MAX_PALLET_WEIGHT) {
      showAlert(
        'error',
        'Pallet Weight Limit Exceeded',
        `The weight exceeds the maximum pallet capacity of ${MAX_PALLET_WEIGHT.toLocaleString()} kg.`
      );
      
      // Limit weight to max pallet capacity
      weightValue = MAX_PALLET_WEIGHT;
    }
    
    // Calculate total weight excluding the current pallet
    const otherPalletsWeight = pallets
      .filter(p => p.id !== id && p.location === "cargo")
      .reduce((sum, p) => sum + (p.weight || 0), 0);
    
    // Check if the new weight would exceed the maximum payload
    if (weightValue + otherPalletsWeight > MAX_PAYLOAD) {
      showAlert(
        'error',
        'Aircraft Payload Limit Exceeded',
        `The total weight exceeds the maximum payload capacity of ${currentAircraft.name} (${MAX_PAYLOAD.toLocaleString()} kg).`
      );
      
      // Limit the weight to the maximum allowed
      weightValue = Math.max(0, MAX_PAYLOAD - otherPalletsWeight);
    }
    
    setPallets(prev => prev.map(pallet => {
      if (pallet.id === id) {
        return { ...pallet, weight: weightValue };
      }
      return pallet;
    }));
  };
  
  const handleDrop = (e: React.DragEvent, dropArea: "cargo" | "configure") => {
    e.preventDefault();
    console.log("Drop event triggered:", dropArea);
    
    const dataTransfer = e.dataTransfer.getData("text/plain");
    
    // Reset the template dragging flag
    if (isDraggingTemplate) {
      setIsDraggingTemplate(false);
    }
    
    // Get area dimensions to calculate relative position
    let rect;
    let offsetX = 0;
    let offsetY = 0;
    let areaWidth = 0;
    let areaHeight = 0;
    
    if (dropArea === "cargo" && cargoRef.current) {
      rect = cargoRef.current.getBoundingClientRect();
      offsetX = rect.left;
      offsetY = rect.top;
      areaWidth = rect.width;
      areaHeight = rect.height;
    // Storage area has been removed
    } else if (dropArea === "configure" && configureRef.current) {
      rect = configureRef.current.getBoundingClientRect();
      offsetX = rect.left;
      offsetY = rect.top;
      areaWidth = rect.width;
      areaHeight = rect.height;
    } else {
      return;
    }
    
    // Calculate drop position relative to the container
    let dropX = e.clientX - offsetX;
    let dropY = e.clientY - offsetY;
    
    // For cargo area, snap to grid cells
    let newX = 0;
    let newY = 0;
    
    // Check if we're dropping a template pallet
    if (dataTransfer === "template") {
      // For template pallet, create a new pallet
      
      // Get aircraft constraints
      const maxPallets = currentAircraftId === 'c17' ? 18 : 
                         currentAircraftId === 'c130' ? 8 : 
                         currentAircraftId === 'kc30a' ? 26 : 3;
                          
      // Count existing pallets in cargo area
      const existingPalletCount = pallets.filter(p => 
        p.location === "cargo"
      ).length;
      
      // Check if we've reached the maximum pallets for this aircraft
      if (existingPalletCount >= maxPallets) {
        showAlert(
          'warning',
          'Maximum Pallets Reached',
          `You've reached the maximum number of pallets (${maxPallets}) for the ${currentAircraft.name}.`
        );
        return;
      }
      
      // Create a new container (pallet or LD3) with size based on aircraft type and selected cargo type
      let palletSize;
      
      // Get pallet size from our aircraft configuration
      const config = getAircraftGridConfig(currentAircraftId);
      
      // Adjust size based on selected cargo type
      if (cargoType === "ld3s") {
        // LD3 containers are typically more cubic in shape
        palletSize = {
          width: config.palletWidth * 0.9, // Slightly smaller width
          height: config.palletHeight * 1.1 // Slightly taller height
        };
      } else {
        // Standard pallet size
        palletSize = {
          width: config.palletWidth,
          height: config.palletHeight
        };
      };
      
      // Position the new pallet in the cargo area
      if (dropArea === "cargo") {
        // Special handling for C-17 with 9x2 grid
        if (currentAircraftId === 'c17') {
          // Get grid configuration for C-17
          const config = getAircraftGridConfig('c17');
          const rowHeight = 98; // Fixed row height separation (matches grid in UI)
          
          // Determine which cell the pallet was dropped in
          const cellRow = dropY > rowHeight ? 1 : 0;
          const cellColumn = Math.min(config.cols - 1, Math.max(0, Math.floor(dropX / (config.cellWidth + config.cellPadding))));
          
          // Position pallet in the appropriate cell with proper spacing
          const rowTopOffset = cellRow === 0 ? 10 : 105; // top margin for each row
          
          // Calculate position to center the pallet within the cell
          newX = (cellColumn * (config.cellWidth + config.cellPadding)) + (config.cellWidth - config.palletWidth) / 2;
          newY = rowTopOffset + (config.cellHeight - config.palletHeight) / 2;
          
          // Use the pallet size from the configuration
          palletSize.width = config.palletWidth;
          palletSize.height = config.palletHeight;
        } else {
          // For other aircraft types (C-130, C-27J, KC30-A)
          // Get grid configuration for the current aircraft
          const config = getAircraftGridConfig(currentAircraftId);
          
          // For C-130, we have 2 rows
          if (currentAircraftId === 'c130') {
            const cellRow = dropY > 90 ? 1 : 0; // 90px is approximately halfway down the container
            const cellColumn = Math.min(config.cols - 1, Math.max(0, Math.floor(dropX / (config.cellWidth + config.cellPadding))));
            
            // Position pallet in the appropriate cell with proper spacing
            const rowTopOffset = cellRow === 0 ? 10 : 100; // top margin for each row
            
            // Calculate position to center the pallet within the cell
            newX = (cellColumn * (config.cellWidth + config.cellPadding)) + (config.cellWidth - config.palletWidth) / 2;
            newY = rowTopOffset + (config.cellHeight - config.palletHeight) / 2;
            
            // Use the pallet size from the configuration
            palletSize.width = config.palletWidth;
            palletSize.height = config.palletHeight;
          } else if (currentAircraftId === 'kc30a') {
            // Special handling for KC30-A (2 rows of 13 pallets)
            const config = getAircraftGridConfig('kc30a');
            
            // Determine which row based on drop position
            const cellRow = dropY > 70 ? 1 : 0; // Threshold to determine row 1 vs row 2
            // Get column position - KC30-A has 13 columns
            const cellColumn = Math.min(12, Math.max(0, Math.floor(dropX / config.cellWidth)));
            
            // Calculate position label based on row and column
            const positionNumber = cellRow === 0 ? cellColumn + 1 : cellColumn + 14;
            const positionLabel = `P${positionNumber}`;
            
            // Set vertical position based on row
            const rowTopOffset = cellRow === 0 ? 20 : 110;
            
            // Calculate position to center the pallet within the cell
            newX = cellColumn * config.cellWidth + (config.cellWidth - config.palletWidth) / 2;
            newY = rowTopOffset + (config.cellHeight - config.palletHeight) / 2;
            
            // Use the pallet size from the configuration
            palletSize.width = config.palletWidth;
            palletSize.height = config.palletHeight;
            
            console.log(`KC30-A pallet dropped at row ${cellRow}, column ${cellColumn}, position ${positionLabel}`);
          } else {
            // For C-27J (single row of 3 pallets)
            const cellColumn = Math.min(config.cols - 1, Math.max(0, Math.floor(dropX / (config.cellWidth + config.cellPadding))));
            
            // Calculate position to center the pallet within the cell
            newX = (cellColumn * (config.cellWidth + config.cellPadding)) + (config.cellWidth - config.palletWidth) / 2;
            newY = 20 + (config.cellHeight - config.palletHeight) / 2; // Fixed top offset with vertical centering
            
            // Use the pallet size from the configuration
            palletSize.width = config.palletWidth;
            palletSize.height = config.palletHeight;
          }
        }
      } else {
        // For configure area, use the original drop calculation
        newX = dropX - (palletSize.width / 2);
        newY = dropY - (palletSize.height / 2);
        
        // Keep within bounds
        if (rect) {
          newX = Math.max(0, Math.min(newX, areaWidth - palletSize.width));
          newY = Math.max(0, Math.min(newY, areaHeight - palletSize.height));
        }
      }
      
      // Store the current pallet ID before incrementing
      const currentId = nextPalletId;
      
      // Create the new pallet with position
      const newPallet: Pallet = {
        id: currentId,
        position: { x: newX, y: newY },
        location: dropArea,
        weight: null,
        size: palletSize,
        containerType: cargoType === "ld3s" ? "ld3" : "pallet" // Set container type based on dropdown selection
      };
      
      // Add the new pallet to the pallets array first
      setPallets(prev => [...prev, newPallet]);
      
      // Increment the next pallet ID
      setNextPalletId(prev => prev + 1);
      
      // If pallet is being placed in cargo area, find nearest position label and position
      if (dropArea === "cargo") {
        // Extract position label based on nearest grid cell
        let positionLabel = "";
        let closestDistance = Number.MAX_VALUE;
        let snapX = newX;
        let snapY = newY;
        
        // Find closest position based on aircraft type
        if (currentAircraftId === 'c17') {
          // For C-17 with 9x2 grid
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 9; col++) {
              const cellWidth = 71;
              const cellHeight = 87;
              const cellX = col * 76 + cellWidth/2; // center of cell
              const cellY = row * 95 + cellHeight/2 + (row === 0 ? 10 : 105); // center of cell
              
              const distance = Math.sqrt(
                Math.pow(dropX - cellX, 2) + 
                Math.pow(dropY - cellY, 2)
              );
              
              if (distance < closestDistance) {
                closestDistance = distance;
                positionLabel = `P${row === 0 ? col + 1 : col + 10}`;
                
                // Calculate dimensions using helper function for consistent sizing
                const dimensions = calculatePalletDimensions(
                  cellWidth, 
                  cellHeight, 
                  col
                );
                
                // Update pallet size to be 10% smaller
                palletSize.width = dimensions.width;
                palletSize.height = dimensions.height;
                
                // Calculate snap position (centered in cell)
                snapX = col * 76 + (cellWidth - dimensions.width) / 2;
                snapY = (row === 0 ? 10 : 105) + (cellHeight - dimensions.height) / 2;
              }
            }
          }
        } else if (currentAircraftId === 'c130') {
          // For C-130 with 4x2 grid
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
              const cellWidth = 110;
              const cellHeight = 80;
              const cellX = col * 120 + cellWidth/2; // center of cell
              const cellY = row * 90 + cellHeight/2 + (row === 0 ? 10 : 100); // center of cell
              
              const distance = Math.sqrt(
                Math.pow(dropX - cellX, 2) + 
                Math.pow(dropY - cellY, 2)
              );
              
              if (distance < closestDistance) {
                closestDistance = distance;
                positionLabel = `P${row === 0 ? col + 1 : col + 5}`;
                
                // Calculate dimensions using helper function for consistent sizing
                const dimensions = calculatePalletDimensions(
                  cellWidth, 
                  cellHeight, 
                  col
                );
                
                // Update pallet size to be 10% smaller
                palletSize.width = dimensions.width;
                palletSize.height = dimensions.height;
                
                // Calculate snap position (centered in cell)
                snapX = col * 120 + (cellWidth - dimensions.width) / 2;
                snapY = (row === 0 ? 10 : 100) + (cellHeight - dimensions.height) / 2;
              }
            }
          }
        } else if (currentAircraftId === 'kc30a') {
          // For KC30-A with 2x13 grid (26 positions total)
          const config = getAircraftGridConfig('kc30a');
          
          // Check both rows for closest position
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 13; col++) {
              const cellWidth = config.cellWidth;
              const cellHeight = config.cellHeight;
              
              // Calculate cell center position
              const cellX = col * cellWidth + cellWidth/2; // center of cell
              const cellY = (row === 0 ? 20 : 110) + cellHeight/2; // center of cell based on row
              
              const distance = Math.sqrt(
                Math.pow(dropX - cellX, 2) + 
                Math.pow(dropY - cellY, 2)
              );
              
              const posNumber = (row === 0 ? col + 1 : col + 14); // P1-P26
              const posLabel = `P${posNumber}`; 
              
              if (distance < closestDistance) {
                closestDistance = distance;
                positionLabel = posLabel;
                
                // Update pallet size to be 10% smaller than cell
                palletSize.width = cellWidth * 0.9;
                palletSize.height = cellHeight * 0.9;
                
                // Calculate snap position (centered in cell)
                snapX = col * cellWidth + (cellWidth - palletSize.width) / 2;
                snapY = (row === 0 ? 20 : 110) + (cellHeight - palletSize.height) / 2;
              }
            }
          }
        } else {
          // For C-27J with 3x1 grid
          for (let col = 0; col < 3; col++) {
            // Make positions 120% bigger for Spartan cargo area
            const cellWidth = 132; // 110 * 1.2
            const cellHeight = 96; // 80 * 1.2
            
            // Get the grid cell position from the DOM to ensure accurate coordinates
            const gridCells = document.querySelectorAll(`[data-position-key^='spartan-']`);
            
            // Calculate position differently based on available DOM elements
            let cellX, cellY;
            
            if (gridCells.length > col) {
              // Get cell position from DOM if available
              const rect = (gridCells[col] as HTMLElement).getBoundingClientRect();
              const cargoRect = cargoRef.current ? cargoRef.current.getBoundingClientRect() : null;
              
              if (cargoRect) {
                cellX = rect.left - cargoRect.left + rect.width/2;
                cellY = rect.top - cargoRect.top + rect.height/2;
              } else {
                // Fallback to calculated positions if DOM measurement fails
                cellX = col * 144 + cellWidth/2; // Center of cell (120 * 1.2 = 144)
                cellY = 20 + cellHeight/2; // Center of cell
              }
            } else {
              // Fallback to calculated positions
              cellX = col * 144 + cellWidth/2; // Center of cell (120 * 1.2 = 144)
              cellY = 20 + cellHeight/2; // Center of cell
            }
            
            // Log the coordinates for debugging
            console.log(`Cell P${col+1} center: (${cellX}, ${cellY}), Drop position: (${dropX}, ${dropY})`);
            
            const distance = Math.sqrt(
              Math.pow(dropX - cellX, 2) + 
              Math.pow(dropY - cellY, 2)
            );
            
            console.log(`Distance to P${col+1}: ${distance}, Current closest: ${closestDistance}`);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              positionLabel = `P${col + 1}`;
              
              // Calculate dimensions using helper function for consistent sizing
              const dimensions = calculatePalletDimensions(
                cellWidth, 
                cellHeight, 
                col,
                0,    // No row for C-27J
                144,  // x spacing of 144 for Spartan
                0     // No additional offset
              );
              
              // Update pallet size to be 10% smaller
              palletSize.width = dimensions.width;
              palletSize.height = dimensions.height;
              
              // Calculate snap position (centered in cell)
              if (gridCells.length > col) {
                const rect = (gridCells[col] as HTMLElement).getBoundingClientRect();
                const cargoRect = cargoRef.current ? cargoRef.current.getBoundingClientRect() : null;
                
                if (cargoRect) {
                  snapX = rect.left - cargoRect.left + (rect.width - dimensions.width) / 2;
                  snapY = rect.top - cargoRect.top + (rect.height - dimensions.height) / 2;
                } else {
                  snapX = col * 144 + (cellWidth - dimensions.width) / 2;
                  snapY = 20 + (cellHeight - dimensions.height) / 2;
                }
              } else {
                snapX = col * 144 + (cellWidth - dimensions.width) / 2;
                snapY = 20 + (cellHeight - dimensions.height) / 2;
              }
              
              console.log(`Setting position to P${col+1}, snapX: ${snapX}, snapY: ${snapY}`);
            }
          }
        }
        
        // Check if position is already occupied by another pallet
        if (isPositionOccupied(positionLabel)) {
          // Remove the pallet we just added since the position is occupied
          setPallets(prev => prev.filter(p => p.id !== nextPalletId));
          
          // Show alert
          showAlert(
            'warning',
            'Position Already Occupied',
            `Position ${positionLabel} is already occupied by another pallet. Please choose a different position.`
          );
          return;
        }
        
        // Update the position to snap to the grid
        newPallet.position.x = snapX;
        newPallet.position.y = snapY;
        newPallet.positionLabel = positionLabel;
        
        // Directly show pallet input dialog when pallet is placed in cargo area
        // This simpler approach should work more reliably with the improved function
        showPalletInput(currentId, positionLabel);
      }
      
    } else {
      // For existing pallets, get the ID and find the pallet
      const id = parseInt(dataTransfer);
      if (isNaN(id)) return;
      
      const draggedPallet = pallets.find(p => p.id === id);
      if (!draggedPallet) return;
      
      // Position the existing pallet in the cargo area
      if (dropArea === "cargo") {
        // Special handling for C-17 with 9x2 grid
        // Extract position label based on nearest grid cell
        let positionLabel = "";
        let closestDistance = Number.MAX_VALUE;
        let snapX = newX;
        let snapY = newY;
        
        if (currentAircraftId === 'c17') {
          // Fixed cell dimensions to match our custom grid (reduced and adjusted by 12%)
          const cellWidth = 76; // Fixed cell width (matches grid in UI)
          const rowHeight = 98; // Fixed cell height (matches grid in UI)
          
          // Calculate position based on closest grid cell
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 9; col++) {
              const originalCellWidth = 71;
              const originalCellHeight = 87;
              const cellX = col * cellWidth + originalCellWidth/2; // center of cell
              const cellY = row * 95 + originalCellHeight/2 + (row === 0 ? 10 : 105); // center of cell
              
              const distance = Math.sqrt(
                Math.pow(dropX - cellX, 2) + 
                Math.pow(dropY - cellY, 2)
              );
              
              if (distance < closestDistance) {
                closestDistance = distance;
                positionLabel = `P${row === 0 ? col + 1 : col + 10}`;
                
                // Calculate dimensions using helper function for consistent sizing
                const dimensions = calculatePalletPosition(
                  originalCellWidth,
                  originalCellHeight,
                  col
                );
                
                // Calculate snap position (centered in cell)
                snapX = col * cellWidth + (originalCellWidth - dimensions.width) / 2;
                snapY = (row === 0 ? 10 : 105) + (originalCellHeight - dimensions.height) / 2;
                
                // Update the pallet size to be consistently 10% smaller
                draggedPallet.size = {
                  width: dimensions.width,
                  height: dimensions.height
                };
              }
            }
          }
        } else if (currentAircraftId === 'c130') {
          // For C-130 with 4x2 grid
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
              const cellWidth = 110;
              const cellHeight = 80;
              const cellX = col * 120 + cellWidth/2; // center of cell
              const cellY = row * 90 + cellHeight/2 + (row === 0 ? 10 : 100); // center of cell
              
              const distance = Math.sqrt(
                Math.pow(dropX - cellX, 2) + 
                Math.pow(dropY - cellY, 2)
              );
              
              if (distance < closestDistance) {
                closestDistance = distance;
                positionLabel = `P${row === 0 ? col + 1 : col + 5}`;
                
                // Calculate dimensions using helper function for consistent sizing
                const dimensions = calculatePalletDimensions(
                  cellWidth,
                  cellHeight,
                  col
                );
                
                // Calculate snap position (centered in cell)
                snapX = col * 120 + (cellWidth - dimensions.width) / 2;
                snapY = (row === 0 ? 10 : 100) + (cellHeight - dimensions.height) / 2;
                
                // Update the pallet size to be consistently 10% smaller
                draggedPallet.size = {
                  width: dimensions.width,
                  height: dimensions.height
                };
              }
            }
          }
        } else {
          // For C-27J/KC30-A with 3x1 grid
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
              
              // Calculate dimensions using helper function for consistent sizing
              const dimensions = calculatePalletDimensions(
                cellWidth,
                cellHeight,
                col,
                0,     // No row for C-27J
                144,   // x spacing of 144 for Spartan
                0      // No additional offset
              );
              
              // Calculate snap position (centered in cell)
              snapX = col * 144 + (cellWidth - dimensions.width) / 2;
              snapY = 20 + (cellHeight - dimensions.height) / 2;
              
              // Update the pallet size to be consistently 10% smaller
              draggedPallet.size = {
                width: dimensions.width,
                height: dimensions.height
              };
            }
          }
        }
      } else {
        // For configure area, use the original drop calculation
        newX = dropX - (draggedPallet.size.width / 2);
        newY = dropY - (draggedPallet.size.height / 2);
        
        // Keep within bounds
        if (rect) {
          newX = Math.max(0, Math.min(newX, areaWidth - draggedPallet.size.width));
          newY = Math.max(0, Math.min(newY, areaHeight - draggedPallet.size.height));
        }
      }
      
      // If pallet is being moved to cargo area
      if (dropArea === "cargo") {
        // Extract position label based on nearest grid cell
        let positionLabel = "";
        let closestDistance = Number.MAX_VALUE;
        let snapX = newX;
        let snapY = newY;
        
        if (currentAircraftId === 'c17') {
          // For C-17 with 9x2 grid
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 9; col++) {
              const cellWidth = 71;
              const cellHeight = 87;
              const cellX = col * 76 + cellWidth/2; // center of cell
              const cellY = row * 95 + cellHeight/2 + (row === 0 ? 10 : 105); // center of cell
              
              const distance = Math.sqrt(
                Math.pow(dropX - cellX, 2) + 
                Math.pow(dropY - cellY, 2)
              );
              
              if (distance < closestDistance) {
                closestDistance = distance;
                positionLabel = `P${row === 0 ? col + 1 : col + 10}`;
                
                // Use helper functions for consistent sizing and positioning
                const dimensions = calculatePalletDimensions(cellWidth, cellHeight);
                
                // Update the pallet size to be consistently 10% smaller
                draggedPallet.size = {
                  width: dimensions.width,
                  height: dimensions.height
                };
                
                // Calculate snap position (centered in cell)
                snapX = col * 76 + (cellWidth - dimensions.width) / 2;
                snapY = (row === 0 ? 10 : 105) + (cellHeight - dimensions.height) / 2;
              }
            }
          }
        } else if (currentAircraftId === 'c130') {
          // For C-130 with 4x2 grid
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
              const cellWidth = 110;
              const cellHeight = 80;
              const cellX = col * 120 + cellWidth/2; // center of cell
              const cellY = row * 90 + cellHeight/2 + (row === 0 ? 10 : 100); // center of cell
              
              const distance = Math.sqrt(
                Math.pow(dropX - cellX, 2) + 
                Math.pow(dropY - cellY, 2)
              );
              
              if (distance < closestDistance) {
                closestDistance = distance;
                positionLabel = `P${row === 0 ? col + 1 : col + 5}`;
                
                // Use helper functions for consistent sizing
                const dimensions = calculatePalletDimensions(cellWidth, cellHeight);
                
                // Update the pallet size to be consistently 10% smaller
                draggedPallet.size = {
                  width: dimensions.width,
                  height: dimensions.height
                };
                
                // Calculate snap position (centered in cell)
                snapX = col * 120 + (cellWidth - dimensions.width) / 2;
                snapY = (row === 0 ? 10 : 100) + (cellHeight - dimensions.height) / 2;
              }
            }
          }
        } else if (currentAircraftId === 'kc30a') {
          // For KC30-A with 2x13 grid (26 positions total)
          const config = getAircraftGridConfig('kc30a');
          
          // Check both rows for closest position
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 13; col++) {
              const cellWidth = config.cellWidth;
              const cellHeight = config.cellHeight;
              
              // Calculate cell center position
              const cellX = col * cellWidth + cellWidth/2; // center of cell
              const cellY = (row === 0 ? 20 : 110) + cellHeight/2; // center of cell based on row
              
              const distance = Math.sqrt(
                Math.pow(dropX - cellX, 2) + 
                Math.pow(dropY - cellY, 2)
              );
              
              const posNumber = (row === 0 ? col + 1 : col + 14); // P1-P26
              const posLabel = `P${posNumber}`; 
              
              if (distance < closestDistance) {
                closestDistance = distance;
                positionLabel = posLabel;
                
                // Update pallet size to be 10% smaller than cell
                draggedPallet.size = {
                  width: cellWidth * 0.9,
                  height: cellHeight * 0.9
                };
                
                // Calculate snap position (centered in cell)
                snapX = col * cellWidth + (cellWidth - draggedPallet.size.width) / 2;
                snapY = (row === 0 ? 20 : 110) + (cellHeight - draggedPallet.size.height) / 2;
              }
            }
          }
        } else {
          // For C-27J with 3x1 grid
          const config = getAircraftGridConfig('c27j');
          
          // Get exact cell dimensions from config
          const cellWidth = config.cellWidth;
          const cellHeight = config.cellHeight;
          const cellSpacing = cellWidth; // Use width as spacing for exact positioning
          
          for (let col = 0; col < 3; col++) {
            // Calculate cell center position with proper spacing
            const cellX = col * cellSpacing + cellWidth/2; // center of cell
            const cellY = 50 + cellHeight/2; // center of cell (centered vertically)
            
            const distance = Math.sqrt(
              Math.pow(dropX - cellX, 2) + 
              Math.pow(dropY - cellY, 2)
            );
            
            if (distance < closestDistance) {
              closestDistance = distance;
              positionLabel = `P${col + 1}`;
              
              // Use dimension calculations from config
              const dimensions = {
                width: config.palletWidth,
                height: config.palletHeight
              };
              
              // Update the pallet size to be consistently 10% smaller
              draggedPallet.size = dimensions;
              
              // Calculate snap position (centered in cell)
              snapX = col * cellSpacing + (cellWidth - dimensions.width) / 2;
              snapY = 50 + (cellHeight - dimensions.height) / 2;
              
              console.log(`Snapping to position P${col + 1} at (${snapX}, ${snapY})`);
            }
          }
        }
        
        // Check if position is already occupied by another pallet
        if (isPositionOccupied(positionLabel, draggedPallet.id)) {
          // Show alert
          showAlert(
            'warning',
            'Position Already Occupied',
            `Position ${positionLabel} is already occupied by another pallet. Please choose a different position.`
          );
          return;
        }
        
        // Set the snapped coordinates
        newX = snapX;
        newY = snapY;
        
        // Update the position label
        draggedPallet.positionLabel = positionLabel;
        
        // Open pallet input dialog
        showPalletInput(id, positionLabel);
      }
      
      // Update the pallet's position and area
      setPallets(prev => prev.map(pallet => {
        if (pallet.id === id) {
          return {
            ...pallet,
            position: { x: newX, y: newY },
            size: dropArea === "configure" ? { width: 88, height: 108 } : draggedPallet.size,
            location: dropArea
          };
        }
        return pallet;
      }));
    }
  };
  
  // Reset all pallets to initial state
  const handleReset = () => {
    // Clear all pallets and reset state
    setPallets([]);
    setNextPalletId(1);
    setDropZones(generateDropZones(currentAircraftId));
    
    // Reset balance values to default
    setBalanceValue(0);
    setBalanceCG(53.00); // Reset to default CG value (middle of 18-88 range)
    setBalanceStatus('safe');
    setWarningPopup(false);
    
    // Reset complete - all pallets removed and balance values reset
  };

  // Get constants for current aircraft
  const MAX_PAYLOAD = currentAircraft.maxPayload;
  const MAX_PALLET_WEIGHT = currentAircraft.maxPalletWeight;
  
  return (
    <>
      <Helmet>
        <title>Load Planning - {currentAircraft.name} | LOADMdocs</title>
      </Helmet>
      
      {/* Alert Dialog */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className={`${
          alertType === 'error' ? 'border-red-500' : 'border-yellow-500'
        }`}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {alertType === 'error' ? (
                <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
              )}
              {alertTitle}
            </DialogTitle>
            <DialogDescription>{alertMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertOpen(false)} className="w-full">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Pallet Input Dialog */}
      <Dialog open={palletInputOpen} onOpenChange={setPalletInputOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pallet Configuration</DialogTitle>
            <DialogDescription>
              Enter details for this pallet
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="weight" className="text-right">
                Weight (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                value={palletWeight}
                onChange={(e) => setPalletWeight(e.target.value)}
                min="0"
                max={currentAircraft?.maxPalletWeight.toString() || "10000"}
                className="col-span-2"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="cargoCategory" className="text-right">
                Cargo Category
              </Label>
              <div className="col-span-2">
                <Select 
                  value={palletCargoCategory}
                  onValueChange={setPalletCargoCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cargo type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pax-bags">Passenger Bags</SelectItem>
                    <SelectItem value="mechanical">Mechanical Equipment</SelectItem>
                    <SelectItem value="medical">Medical Equipment</SelectItem>
                    <SelectItem value="perishable">Perishable Goods</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="vehicles">Vehicles/Machinery</SelectItem>
                    <SelectItem value="military">Military Equipment</SelectItem>
                    <SelectItem value="humanitarian">Humanitarian Aid</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="dangerousGoods" className="text-right">
                Dangerous Goods
              </Label>
              <div className="flex h-10 items-center space-x-2 col-span-2">
                <Checkbox 
                  id="dangerousGoods" 
                  checked={isDangerousGoods}
                  onCheckedChange={(checked) => setIsDangerousGoods(!!checked)}
                />
                <label
                  htmlFor="dangerousGoods"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  This pallet contains dangerous goods
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="dgClass" className={`text-right ${!isDangerousGoods ? 'text-muted-foreground' : ''}`}>
                DG Classification
              </Label>
              <div className="col-span-2">
                <Select 
                  value={palletDgClass}
                  onValueChange={setPalletDgClass}
                  disabled={!isDangerousGoods}
                >
                  <SelectTrigger className={!isDangerousGoods ? 'opacity-50 cursor-not-allowed' : ''}>
                    <SelectValue placeholder="Select DG class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class-1">Class 1 - Explosives</SelectItem>
                    <SelectItem value="class-2">Class 2 - Gases</SelectItem>
                    <SelectItem value="class-3">Class 3 - Flammable Liquids</SelectItem>
                    <SelectItem value="class-4">Class 4 - Flammable Solids</SelectItem>
                    <SelectItem value="class-5">Class 5 - Oxidizing Substances</SelectItem>
                    <SelectItem value="class-6">Class 6 - Toxic Substances</SelectItem>
                    <SelectItem value="class-7">Class 7 - Radioactive Material</SelectItem>
                    <SelectItem value="class-8">Class 8 - Corrosives</SelectItem>
                    <SelectItem value="class-9">Class 9 - Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
                {!isDangerousGoods && (
                  <p className="text-xs text-muted-foreground mt-1">Check Dangerous Goods to enable selection</p>
                )}
              </div>
            </div>
            {palletPosition && (
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="position" className="text-right">
                  Position
                </Label>
                <div className="col-span-2">
                  <Badge variant="outline" className="px-3 py-1 text-base">
                    {palletPosition}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPalletInputOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handlePalletInputConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Emergency Fixed Position Warning Popup */}
      {/* Balance Warning Popup - Redesigned to match app style with grays and orange */}
      {warningPopup && (
        <div 
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[550px] max-w-[95vw] rounded-md border border-orange-500 bg-gray-900 shadow-lg"
          style={{
            boxShadow: '0 0 20px rgba(234, 88, 12, 0.35)'
          }}
        >
          <div className="px-6 py-5">
            <div className="flex items-center">
              <AlertTriangleIcon className="h-6 w-6 text-orange-500 mr-3" />
              <h3 className="text-xl font-bold text-white">Centre of Gravity Warning</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto -mr-2 text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={() => setWarningPopup(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="mt-3 text-gray-200">
              <p className="mb-2">
                Centre of Gravity value of <span className="text-orange-500 font-bold">{balanceCG.toFixed(2)}°</span> 
                {balanceCG <= 18 ? " is below" : " exceeds"} the safe range of 18° to 88°.
              </p>
              <p className="text-sm text-gray-400 mb-1">
                This load configuration may cause aircraft instability.
              </p>
              <p className="text-sm font-semibold text-orange-500">
                ADJUST CARGO PLACEMENT TO RESTORE BALANCE
              </p>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={() => setWarningPopup(false)}
                className="bg-orange-600 hover:bg-orange-700 text-white border-none"
              >
                Acknowledge
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="container max-w-7xl mx-auto py-6">
        <div className="space-y-6">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4"
              onClick={handleBackClick}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{currentAircraft.name} Load Planning</h2>
              <p className="text-muted-foreground text-sm">
                Max Payload: {MAX_PAYLOAD.toLocaleString()} kg | Max Pallet Weight: {MAX_PALLET_WEIGHT.toLocaleString()} kg
              </p>
            </div>
          </div>

          {/* Main content grid - Consistent across all aircraft types */}
          <div className="space-y-4">
            {/* Load Summary Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Scale className="h-5 w-5 mr-2 text-primary" />
                    Load Summary
                  </CardTitle>
                  <Badge variant={totalWeight > MAX_PAYLOAD * 0.97 ? "destructive" : "default"}>
                    {totalWeight.toLocaleString()} / {MAX_PAYLOAD.toLocaleString()} kg
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-muted rounded-md p-3">
                    <p className="text-xs font-medium">Current Load</p>
                    <p className="text-lg">{totalWeight.toLocaleString()} kg</p>
                  </div>
                  <div className="bg-muted rounded-md p-3">
                    <p className="text-xs font-medium">Maximum Payload</p>
                    <p className="text-lg">{MAX_PAYLOAD.toLocaleString()} kg</p>
                  </div>
                  <div className="bg-muted rounded-md p-3">
                    <p className="text-xs font-medium">Cargo Positions Filled</p>
                    <p className="text-lg">
                      {pallets.filter(p => p.location === "cargo").length} of {
                        currentAircraftId === 'c17' ? '18' : 
                        currentAircraftId === 'c130' ? '8' : 
                        currentAircraftId === 'kc30a' ? '26' : '3'
                      }
                    </p>
                  </div>
                  <div className="rounded-md p-3 relative w-1/2 bg-background border border-border" style={{ 
                    backgroundColor: 'hsl(var(--background))'
                  }}>
                    <p className="text-xs font-medium">Centre of Gravity</p>
                    <p className="flex items-center gap-2">
                      <span style={{ 
                        // Blend colors based on balance value position (-100 to 100)
                        // Use interpolated colors similar to the balance scale, but never use red
                        color: Math.abs(balanceValue) < 20 ? '#22c55e' : // Green center
                              Math.abs(balanceValue) < 40 ? '#84cc16' : // Light green/yellow-green
                              Math.abs(balanceValue) < 60 ? '#f59e0b' : // Amber
                              '#ea580c', // Orange (instead of red)
                        fontWeight: 600,
                        fontSize: '1.8rem', // 50% larger than text-lg (1.2rem)
                      }}>{balanceCG.toFixed(2)}°</span>
                      <span className="inline-block w-2 h-2 rounded-full" style={{
                        backgroundColor: Math.abs(balanceValue) < 20 ? '#22c55e' : // Green center
                                         Math.abs(balanceValue) < 40 ? '#84cc16' : // Light green/yellow-green
                                         Math.abs(balanceValue) < 60 ? '#f59e0b' : // Amber
                                         '#ea580c', // Orange (instead of red)
                      }}></span>
                    </p>
                  </div>
                  {/* Storage area has been removed */}
                </div>

                {/* AI-powered cargo balance chat moved to bottom of page */}
              </CardContent>
            </Card>
            
            {/* Cargo Area and Configure Pallets side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
              {/* Cargo Area - Always on the left */}
              <Card className="lg:col-span-7">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Plane className="h-5 w-5 mr-2 text-primary" />
                      Cargo Area
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({currentAircraftId === 'c17' ? '18 pallets' : 
                           currentAircraftId === 'c130' ? '8 pallets' : 
                           currentAircraftId === 'kc30a' ? '26 pallets' : '3 pallets'})
                      </span>
                    </CardTitle>
                    
                    {/* Cargo Type Selection Dropdown - Only for KC30-A */}
                    {currentAircraftId === 'kc30a' && (
                      <div className="flex items-center">
                        <label htmlFor="cargo-type" className="text-sm font-medium mr-2 text-muted-foreground">
                          Cargo Type:
                        </label>
                        <select 
                          id="cargo-type" 
                          className="h-8 px-2 py-0 rounded-md text-sm border border-orange-500 bg-gray-800 text-white font-medium"
                          value={cargoType}
                          onChange={(e) => setCargoType(e.target.value as "pallets" | "ld3s")}
                          style={{
                            appearance: 'none',
                            backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23EA580C%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '0.65em auto',
                            paddingRight: '1.5rem'
                          }}
                        >
                          <option value="pallets" className="bg-gray-800 text-white">Pallets</option>
                          <option value="ld3s" className="bg-gray-800 text-white">LD3's</option>
                        </select>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div 
                    ref={cargoRef}
                    className={`relative ${
                      currentAircraftId === 'c17' 
                        ? 'h-[320px]' 
                        : currentAircraftId === 'c130' 
                          ? 'h-[220px]' 
                          : currentAircraftId === 'kc30a'
                            ? 'h-[200px]'
                            : 'h-[150px]'
                    } overflow-visible bg-transparent`}
                    style={{
                      // Set exact width to match balance scale width for perfect alignment
                      width: `${balanceScaleWidth}px`,
                      maxWidth: '100%', // Ensure it doesn't overflow on small screens
                      margin: '0 auto' // Center the cargo area if smaller than container
                    }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, "cargo")}
                  >
                    {/* Grid lines */}
                    {currentAircraftId === 'c17' ? (
                      <div className="absolute inset-0">
                        {/* Custom grid for 9x2 layout with 88x108 pallets - removed pointer-events-none to allow dragging */}
                        
                        {/* Grid cells for C-17 */}
                        {(() => {
                          // Get configuration for C-17
                          const config = getAircraftGridConfig('c17');
                          const cellSpacing = config.cellWidth + config.cellPadding;
                          
                          // Create array of cells for both rows
                          return (
                            <>
                              {/* First row */}
                              {[...Array(config.cols)].map((_, i) => {
                                // Calculate position label for this grid cell
                                const positionLabel = `P${i + 1}`;
                                
                                // Find if a pallet is assigned to this position
                                const assignedPallet = pallets.find(p => 
                                  p.location === "cargo" && 
                                  p.positionLabel === positionLabel
                                );
                                
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
                                    key={`cell-row1-${i}`}
                                    draggable={!!assignedPallet}
                                    onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
                                    onClick={(e) => {
                                      if (assignedPallet) {
                                        // C-17 Row 1 pallet clicked
                                        handlePalletCellClick(e, assignedPallet, positionLabel);
                                      }
                                    }}
                                    className={`absolute border-2 ${borderColor} rounded-sm ${assignedPallet ? 'cursor-move' : ''}`}
                                    style={{
                                      left: i * cellSpacing,
                                      top: 10,
                                      width: config.cellWidth,
                                      height: config.cellHeight,
                                      backgroundColor: bgColor,
                                      zIndex: assignedPallet ? 10 : 1
                                    }}
                                  >
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      {/* Only show center label now, corner label removed */}
                                      
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
                                            <span>{assignedPallet.weight} kg</span> : 
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
                              })}
                              
                              {/* Second row */}
                              {[...Array(config.cols)].map((_, i) => {
                                // Calculate position label for this grid cell (for second row, add 10 to position number)
                                const positionLabel = `P${i + 10}`;
                                
                                // Find if a pallet is assigned to this position
                                const assignedPallet = pallets.find(p => 
                                  p.location === "cargo" && 
                                  p.positionLabel === positionLabel
                                );
                                
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
                                    key={`cell-row2-${i}`}
                                    draggable={assignedPallet ? true : false}
                                    onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
                                    onClick={(e) => {
                                      if (assignedPallet) {
                                        // C-17 Row 2 pallet clicked
                                        handlePalletCellClick(e, assignedPallet, positionLabel);
                                      }
                                    }}
                                    className={`absolute border-2 ${borderColor} rounded-sm ${assignedPallet ? 'cursor-pointer' : ''}`}
                                    style={{
                                      left: i * cellSpacing,
                                      top: 105, 
                                      width: config.cellWidth,
                                      height: config.cellHeight,
                                      backgroundColor: bgColor,
                                      zIndex: assignedPallet ? 10 : 1
                                    }}
                                  >
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      {/* Only show center label now, corner label removed */}
                                      
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
                                            <span>{assignedPallet.weight} kg</span> : 
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
                              })}
                            </>
                          );
                        })()}
                      </div>
                    ) : currentAircraftId === 'c130' ? (
                      <div className="absolute inset-0">
                        {/* Grid cells for C-130 - 8 pallets (4x2) - removed pointer-events-none to allow dragging */}
                        {(() => {
                          // Get configuration for C-130
                          const config = getAircraftGridConfig('c130');
                          const cellSpacing = config.cellWidth + config.cellPadding;
                          
                          // Create array of cells for both rows
                          return (
                            <>
                              {/* First row */}
                              {[...Array(config.cols)].map((_, i) => {
                                // Calculate position label for this grid cell
                                const positionLabel = `P${i + 1}`;
                                
                                // Find if a pallet is assigned to this position
                                const assignedPallet = pallets.find(p => 
                                  p.location === "cargo" && 
                                  p.positionLabel === positionLabel
                                );
                                
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
                                    key={`c130-row1-${i}`}
                                    draggable={assignedPallet ? true : false}
                                    onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
                                    onClick={(e) => {
                                      if (assignedPallet) {
                                        // C-130 Row 1 pallet clicked
                                        handlePalletCellClick(e, assignedPallet, positionLabel);
                                      }
                                    }}
                                    className={`absolute border-2 ${borderColor} rounded-sm ${assignedPallet ? 'cursor-pointer' : ''}`}
                                    style={{
                                      left: i * cellSpacing,
                                      top: 10,
                                      width: config.cellWidth,
                                      height: config.cellHeight,
                                      backgroundColor: bgColor,
                                      zIndex: assignedPallet ? 10 : 1
                                    }}
                                  >
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      {/* Only show the center label now, corner label removed */}
                                      
                                      {/* If no pallet is assigned, show pale label in center */}
                                      {!assignedPallet && (
                                        <div className="text-white/50 font-bold text-xl">
                                          {positionLabel}
                                        </div>
                                      )}
                                      
                                      {/* Weight info - only if position is occupied */}
                                      {assignedPallet && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-white font-bold">
                                          {assignedPallet.weight !== null ? 
                                            <span>{assignedPallet.weight} kg</span> : 
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
                              })}
                              
                              {/* Second row */}
                              {[...Array(config.cols)].map((_, i) => {
                                // Calculate position label for this grid cell (second row of C-130 starts with P5)
                                const positionLabel = `P${i + 5}`;
                                
                                // Find if a pallet is assigned to this position
                                const assignedPallet = pallets.find(p => 
                                  p.location === "cargo" && 
                                  p.positionLabel === positionLabel
                                );
                                
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
                                    key={`c130-row2-${i}`} 
                                    draggable={assignedPallet ? true : false}
                                    onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
                                    onClick={(e) => {
                                      if (assignedPallet) {
                                        // C-130 Row 2 pallet clicked
                                        handlePalletCellClick(e, assignedPallet, positionLabel);
                                      }
                                    }}
                                    className={`absolute border-2 ${borderColor} rounded-sm ${assignedPallet ? 'cursor-pointer' : ''}`}
                                    style={{
                                      left: i * cellSpacing,
                                      top: 100,
                                      width: config.cellWidth,
                                      height: config.cellHeight,
                                      backgroundColor: bgColor,
                                      zIndex: assignedPallet ? 10 : 1
                                    }}
                                  >
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      {/* Only show the center label now, corner label removed */}
                                      
                                      {/* If no pallet is assigned, show pale label in center */}
                                      {!assignedPallet && (
                                        <div className="text-white/50 font-bold text-xl">
                                          {positionLabel}
                                        </div>
                                      )}
                                      
                                      {/* Weight info - only if position is occupied */}
                                      {assignedPallet && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-white font-bold">
                                          {assignedPallet.weight !== null ? 
                                            <span>{assignedPallet.weight} kg</span> : 
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
                              })}
                            </>
                          );
                        })()}
                      </div>
                    ) : currentAircraftId === 'kc30a' ? (
                      <div className="absolute inset-0">
                        {/* Grid cells for KC30-A - 26 pallets (2x13) */}
                        {(() => {
                          // Get configuration for KC30-A
                          const config = getAircraftGridConfig('kc30a');
                          const cellSpacing = config.cellWidth;
                          
                          // Create combined array for both rows
                          return (
                            <>
                              {/* First row - 13 positions */}
                              {[...Array(13)].map((_, i) => {
                                // Calculate position label for this grid cell
                                const positionLabel = `P${i + 1}`;
                                
                                // Find if a pallet is assigned to this position
                                const assignedPallet = pallets.find(p => 
                                  p.location === "cargo" && 
                                  p.positionLabel === positionLabel
                                );
                                
                                // Determine cell background color based on occupation
                                const bgColor = assignedPallet ? 
                                  'rgba(234, 88, 12, 0.7)' :  // Orange for occupied
                                  'rgba(20, 83, 45, 0.15)';   // Green for empty
                                
                                // Determine border color based on occupation
                                const borderColor = assignedPallet ?
                                  'border-orange-500' :      // Orange border for occupied
                                  'border-green-800/40';     // Green border for empty
                                
                                return (
                                  <div 
                                    key={`kc30a-cell-row1-${i}`}
                                    draggable={assignedPallet ? true : false}
                                    onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
                                    onClick={(e) => {
                                      if (assignedPallet) {
                                        handlePalletCellClick(e, assignedPallet, positionLabel);
                                      }
                                    }}
                                    className={`absolute border-2 ${borderColor} rounded-sm ${assignedPallet ? 'cursor-pointer' : ''}`}
                                    style={{
                                      left: i * cellSpacing,
                                      top: 20,
                                      width: config.cellWidth,
                                      height: config.cellHeight,
                                      backgroundColor: bgColor,
                                      zIndex: assignedPallet ? 10 : 1
                                    }}
                                  >
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      {/* Only show position label if no pallet is assigned */}
                                      {!assignedPallet && (
                                        <div className="text-white/50 font-bold text-sm">
                                          {positionLabel}
                                        </div>
                                      )}
                                      
                                      {/* Weight info - only if position is occupied */}
                                      {assignedPallet && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-white font-bold text-sm">
                                          {assignedPallet.weight !== null ? 
                                            <span>{assignedPallet.weight} kg</span> : 
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
                              })}
                              
                              {/* Second row - 13 positions */}
                              {[...Array(13)].map((_, i) => {
                                // Calculate position label for this grid cell (positions 14-26)
                                const positionLabel = `P${i + 14}`;
                                
                                // Find if a pallet is assigned to this position
                                const assignedPallet = pallets.find(p => 
                                  p.location === "cargo" && 
                                  p.positionLabel === positionLabel
                                );
                                
                                // Determine cell background color based on occupation
                                const bgColor = assignedPallet ? 
                                  'rgba(234, 88, 12, 0.7)' :  // Orange for occupied
                                  'rgba(20, 83, 45, 0.15)';   // Green for empty
                                
                                // Determine border color based on occupation
                                const borderColor = assignedPallet ?
                                  'border-orange-500' :      // Orange border for occupied
                                  'border-green-800/40';     // Green border for empty
                                
                                return (
                                  <div 
                                    key={`kc30a-cell-row2-${i}`}
                                    draggable={assignedPallet ? true : false}
                                    onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
                                    onClick={(e) => {
                                      if (assignedPallet) {
                                        handlePalletCellClick(e, assignedPallet, positionLabel);
                                      }
                                    }}
                                    className={`absolute border-2 ${borderColor} rounded-sm ${assignedPallet ? 'cursor-pointer' : ''}`}
                                    style={{
                                      left: i * cellSpacing,
                                      top: 110,
                                      width: config.cellWidth,
                                      height: config.cellHeight,
                                      backgroundColor: bgColor,
                                      zIndex: assignedPallet ? 10 : 1
                                    }}
                                  >
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      {/* Only show position label if no pallet is assigned */}
                                      {!assignedPallet && (
                                        <div className="text-white/50 font-bold text-sm">
                                          {positionLabel}
                                        </div>
                                      )}
                                      
                                      {/* Weight info - only if position is occupied */}
                                      {assignedPallet && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-white font-bold text-sm">
                                          {assignedPallet.weight !== null ? 
                                            <span>{assignedPallet.weight} kg</span> : 
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
                              })}
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="absolute inset-0">
                        {/* Grid cells for C-27J - 3 pallets (3x1) - removed pointer-events-none to allow dragging */}
                        {(() => {
                          // Get configuration for C-27J
                          const config = getAircraftGridConfig(currentAircraftId);
                          const cellSpacing = config.cellWidth + config.cellPadding;
                          
                          return [...Array(config.cols)].map((_, i) => {
                            // Calculate position label for this grid cell
                            const positionLabel = `P${i + 1}`;
                            
                            // Find if a pallet is assigned to this position
                            const assignedPallet = pallets.find(p => 
                              p.location === "cargo" && 
                              p.positionLabel === positionLabel
                            );
                            
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
                                key={`spartan-${i}`}
                                data-position-key={`spartan-${i}`}
                                data-position-number={i+1}
                                draggable={assignedPallet ? true : false}
                                onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
                                onClick={(e) => {
                                  if (assignedPallet) {
                                    // C-27J pallet clicked
                                    handlePalletCellClick(e, assignedPallet, positionLabel);
                                  }
                                }}
                                className={`absolute border-2 ${borderColor} rounded-sm ${assignedPallet ? 'cursor-pointer' : ''}`}
                                style={{
                                  left: i * cellSpacing,
                                  top: 20,
                                  width: config.cellWidth,
                                  height: config.cellHeight,
                                  backgroundColor: bgColor,
                                  zIndex: assignedPallet ? 10 : 1
                                }}
                              >
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  {/* Only show the center label now, corner label removed */}
                                  {/* If no pallet is assigned, show pale label in center */}
                                  {!assignedPallet && (
                                    <div className="text-white/50 font-bold text-xl">
                                      {positionLabel}
                                    </div>
                                  )}
                                  
                                  {/* Weight info - only if position is occupied */}
                                  {assignedPallet && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-white font-bold">
                                      {assignedPallet.weight !== null ? 
                                        <span>{assignedPallet.weight} kg</span> : 
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
                          });
                        })()}
                      </div>
                    )}
                    
                    {/* We no longer need separate pallets rendering as the cargo information is shown in the grid cells */}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Drag pallets here to position them in the cargo area.
                  </div>
                  
                  {/* Balance Indicator */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-sm font-medium">Balance</h3>
                      <span className={`text-xs font-medium ${
                        balanceStatus === 'safe' ? 'text-green-500' : 
                        balanceStatus === 'warning' ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {balanceStatus === 'safe' ? 'Safe' : 
                         balanceStatus === 'warning' ? 'Warning' : 'Danger'}
                      </span>
                    </div>
                    
                    {/* Balance Meter */}
                    <div ref={balanceScaleRef} className="h-8 relative mb-1 rounded-md">
                      {/* Container for the gradient background with overflow hidden */}
                      {/* Updated gradient to remove red and use green-centered colors */}
                      <div className="absolute inset-0 overflow-hidden" style={{ 
                        background: 'linear-gradient(to right, #ea580c 0%, #f59e0b 20%, #84cc16 40%, #22c55e 50%, #84cc16 60%, #f59e0b 80%, #ea580c 100%)'
                      }}></div>
                      
                      {/* Indicator needle - light blue/teal needle, extending equally past top and bottom */}
                      <div 
                        className="absolute shadow-md"
                        style={{ 
                          backgroundColor: '#40C4D9', // Light blue/teal color
                          width: '1px',
                          // Calculate constrained position to ensure needle stays within 18-88 degree visual range
                          // Map balanceCG (18-88) to percentage (0-100%), but clamp to never go outside these bounds
                          left: `${Math.max(0, Math.min(100, ((Math.max(18, Math.min(88, balanceCG)) - 18) / 70) * 100))}%`,
                          top: '-50%', // Extends 50% above
                          height: '200%', // Makes it extend 50% below as well
                          transform: 'translateX(-50%)',
                          transition: 'left 0.3s ease-out',
                          zIndex: 10, // Bring forward
                          boxShadow: '0px 0px 3px rgba(0, 0, 0, 0.3)' // Add slight shadow for better visibility
                        }}
                      >
                        {/* Current CG value above the needle */}
                        <div 
                          className="absolute -top-6 left-1/2 transform -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: 'rgba(64, 196, 217, 0.9)', // Matching the #40C4D9 needle color
                            color: 'white',
                            textShadow: '0px 0px 2px rgba(0, 0, 0, 0.5)'
                          }}
                        >
                          {balanceCG.toFixed(2)}°
                        </div>
                      </div>
                      
                      {/* Labels */}
                      <div className="absolute inset-0 flex justify-between px-2 items-center text-[10px] font-medium text-white">
                        <span>FWD</span>
                        <span className="mx-auto">BALANCED</span>
                        <span>AFT</span>
                      </div>
                    </div>
                    
                    {/* CG Scale Markings */}
                    <div className="relative h-8 mb-4">
                      {/* Generate tick marks and labels */}
                      {[...Array(71)].map((_, i) => {
                        const position = i * (100 / 70); // 0-100% across the width
                        const value = 18 + i; // 18-88 degrees
                        const isMajorTick = value % 5 === 0; // Every 5th tick is major
                        const isEndpoint = value === 18 || value === 88; // First or last value
                        
                        return (
                          <div key={`tick-${i}`}>
                            {/* Tick mark - thicker for every 5th mark */}
                            <div 
                              className={`absolute top-0 ${isMajorTick ? 'w-0.5' : 'w-px'} ${isMajorTick ? 'bg-gray-500 dark:bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'}`}
                              style={{ 
                                left: `${position}%`,
                                height: isMajorTick ? '8px' : '5px'
                              }}
                            ></div>
                            
                            {/* Label (only on major ticks or endpoints) */}
                            {(isMajorTick || isEndpoint) && (
                              <div 
                                className={`absolute text-[9px] ${isEndpoint ? 'font-bold' : 'font-medium'} ${isEndpoint ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}
                                style={{ 
                                  left: `${position}%`, 
                                  top: '12px',
                                  transform: 'translateX(-50%)'
                                }}
                              >
                                {value}°
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* C of G label */}
                      <div className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 text-[9px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        Centre of Gravity (degrees)
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-7">
                      <span>Heavy Forward</span>
                      <span>Center of Gravity</span>
                      <span>Heavy Aft</span>
                    </div>
                    
                    {/* Reset Button */}
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700" 
                        onClick={handleReset}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset All Pallets
                      </Button>
                    </div>
                    
                    {/* Cargo Balance Assistant Button - scrolls to chat only when clicked */}
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary" 
                        onClick={() => {
                          // Find the chat component and scroll to it
                          const cargoAssistantElement = document.getElementById('cargo-balance-assistant');
                          if (cargoAssistantElement) {
                            cargoAssistantElement.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        <MessagesSquare className="h-4 w-4 mr-2" />
                        Cargo Balance Assistant
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configure Pallets - Always on the right */}
              <Card className="lg:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Package2 className="h-5 w-5 mr-2 text-primary" />
                    Configure Pallets
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (Max: {
                        currentAircraftId === 'c17' ? '18' : 
                        currentAircraftId === 'c130' ? '8' : 
                        currentAircraftId === 'kc30a' ? '26' : '3'
                      })
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Template Pallet */}
                  <div className="mb-6 p-4 border-2 border-dashed border-primary rounded-lg">
                    <h3 className="text-sm font-medium flex items-center mb-3">
                      <Package2 className="h-4 w-4 mr-2 text-primary" />
                      {currentAircraftId === 'kc30a' ? 
                        `Template ${cargoType === "ld3s" ? "LD3" : "Pallet"}` :
                        "Template Pallet"
                      }
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {currentAircraftId === 'kc30a' ?
                        `Drag this template ${cargoType === "ld3s" ? "LD3" : "pallet"} to the cargo area to create new ${cargoType === "ld3s" ? "LD3 containers" : "pallets"}.` :
                        "Drag this template pallet to the cargo area to create new pallets."
                      }
                      You can add up to {
                        currentAircraftId === 'c17' ? '18' : 
                        currentAircraftId === 'c130' ? '8' : 
                        currentAircraftId === 'kc30a' ? '26' : '3'
                      } pallets
                      for the {currentAircraft.name}.
                    </p>
                    
                    {/* Draggable template pallet */}
                    <div 
                      className="rounded p-4 flex items-center justify-center bg-orange-500/70 border-2 border-orange-500 cursor-move"
                      style={{ 
                        width: currentAircraftId === 'c17' ? '71px' : '110px', 
                        height: currentAircraftId === 'c17' ? '87px' : '80px' 
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, null)}
                    >
                      <div className="flex items-center justify-center">
                        <Package2 className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                  
                  {/* List of existing pallets */}
                  <div className="space-y-4 h-[400px] overflow-y-auto pr-2" ref={configureRef} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "configure")}>
                    <h3 className="font-medium text-sm">
                      Current Pallets ({pallets.length})
                    </h3>
                    
                    {pallets.length === 0 ? (
                      <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
                        No pallets created yet. Drag the template pallet above to create new pallets.
                      </div>
                    ) : (
                      pallets.map((pallet) => (
                        <div 
                          key={pallet.id} 
                          className="bg-card border border-border rounded-md p-3"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                              <Package2 className="h-4 w-4 mr-2 text-primary" />
                              <span className="font-medium text-sm">
                                Pallet {pallet.id}
                                {pallet.positionLabel && (
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    ({pallet.positionLabel})
                                  </span>
                                )}
                              </span>
                              {pallet.cargoType && (
                                <Badge 
                                  variant={pallet.cargoType === "C" ? "outline" : "destructive"}
                                  className="text-xs ml-2 px-1"
                                >
                                  {pallet.cargoType}
                                </Badge>
                              )}
                            </div>
                            <Badge 
                              variant={
                                pallet.location === "cargo" ? "default" : "outline"
                              }
                              className="text-xs"
                            >
                              {pallet.location === "cargo" ? "In Cargo" : "Configure"}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <Label htmlFor={`weight-${pallet.id}`} className="text-xs mr-2 w-16">
                                Weight:
                              </Label>
                              <div className="flex-1">
                                <Input
                                  id={`weight-${pallet.id}`}
                                  type="number"
                                  min="0"
                                  max={MAX_PAYLOAD}
                                  value={pallet.weight === null ? '' : pallet.weight.toString()}
                                  onChange={(e) => handleWeightChange(pallet.id, e.target.value)}
                                  className={`h-7 text-sm`}
                                  placeholder="Enter weight"
                                />
                              </div>
                              <div className="ml-1 text-xs text-muted-foreground">kg</div>
                            </div>
                            
                            <div className="flex items-center">
                              <Label className="text-xs mr-2 w-16">
                                Type:
                              </Label>
                              <div className="flex gap-3">
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    id={`cargo-normal-${pallet.id}`}
                                    className="h-3 w-3"
                                    checked={!pallet.cargoType || pallet.cargoType === "C"}
                                    onChange={() => {
                                      setPallets(prev => prev.map(p => {
                                        if (p.id === pallet.id) {
                                          return { ...p, cargoType: "C" };
                                        }
                                        return p;
                                      }));
                                    }}
                                  />
                                  <Label htmlFor={`cargo-normal-${pallet.id}`} className="text-xs ml-1">
                                    Normal (C)
                                  </Label>
                                </div>
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    id={`cargo-dg-${pallet.id}`}
                                    className="h-3 w-3"
                                    checked={pallet.cargoType === "DG"}
                                    onChange={() => {
                                      setPallets(prev => prev.map(p => {
                                        if (p.id === pallet.id) {
                                          return { ...p, cargoType: "DG" };
                                        }
                                        return p;
                                      }));
                                    }}
                                  />
                                  <Label htmlFor={`cargo-dg-${pallet.id}`} className="text-xs ml-1">
                                    Dangerous (DG)
                                  </Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>


            
            {/* Instructions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Package2 className="h-5 w-5 mr-2 text-primary" />
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  <strong>How to use:</strong> Drag the template pallet from the Configure Pallets section on the right to create new pallets.
                  Drop them in the cargo area on the left to position them for transport.
                  You can edit the weight of each pallet using the input fields.
                  Only pallets in the cargo area count toward the total weight.
                </p>
                <div className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded-md">
                  <p className="text-sm font-medium text-primary">
                    {currentAircraftId === 'c17' 
                      ? 'C-17 Globemaster maximum payload is 77,500 kg with 18 pallet positions (9×2 grid).'
                      : currentAircraftId === 'c130'
                        ? 'C-130 Hercules maximum payload is 20,000 kg with 8 pallet positions.'
                        : 'C-27J Spartan maximum payload is 11,300 kg with 3 pallet positions.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI-powered cargo balance chat - moved to bottom of page */}
            <Card className="mt-4" id="cargo-balance-assistant">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <MessagesSquare className="h-5 w-5 mr-2 text-primary" />
                  Cargo Balance Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LoadBalanceChat 
                  cargoData={pallets.filter(p => p.location === "cargo")} 
                  balanceData={{
                    balanceValue: balanceValue,
                    balanceCG: balanceCG
                  }}
                  aircraftType={currentAircraftId}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}