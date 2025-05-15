import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, Package2, RefreshCw, AlertCircle, AlertTriangle, X, Plane } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Pallet {
  id: number;
  position: { x: number; y: number };
  location: "cargo" | "configure";
  weight: number | null;
  size: { width: number; height: number };
  cargoType?: "C" | "DG"; // C = Normal Cargo, DG = Dangerous Goods
  positionLabel?: string; // Store position label like "P1", "P2", etc.
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
  const [balanceStatus, setBalanceStatus] = useState<'safe' | 'warning' | 'danger'>('safe');
  
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
    // This ensures cargo area pallets always match the width of the balance scale
    const totalWidth = balanceScaleWidth || 715; // Default if not measured yet
    
    switch (aircraft) {
      case 'c17':
        // C-17 has 9 columns in 2 rows
        const c17CellWidth = Math.floor(totalWidth / 9);
        // Maintain fixed cell aspect ratio for consistency
        const c17CellHeight = Math.floor(c17CellWidth * 1.15); // Keep height proportional to width
        return {
          rows: 2,
          cols: 9,
          cellWidth: c17CellWidth,
          cellHeight: c17CellHeight,
          cellPadding: 5,
          palletWidth: Math.floor(c17CellWidth * 0.9),
          palletHeight: Math.floor(c17CellHeight * 0.9)
        };
      
      case 'c130':
        // C-130 has 4 columns in 2 rows
        const c130CellWidth = Math.floor(totalWidth / 4);
        // Maintain fixed cell aspect ratio for consistency
        const c130CellHeight = Math.floor(c130CellWidth * 0.8); // Slightly wider than tall
        return {
          rows: 2,
          cols: 4,
          cellWidth: c130CellWidth,
          cellHeight: c130CellHeight,
          cellPadding: 5,
          palletWidth: Math.floor(c130CellWidth * 0.9),
          palletHeight: Math.floor(c130CellHeight * 0.9)
        };
      
      default: // c27j, kc30a
        // C-27J/KC30-A has 3 columns in 1 row
        const spartanCellWidth = Math.floor(totalWidth / 3);
        // Maintain fixed cell aspect ratio for consistency
        const spartanCellHeight = Math.floor(spartanCellWidth * 0.9); // Slightly wider than tall
        return {
          rows: 1,
          cols: 3,
          cellWidth: spartanCellWidth,
          cellHeight: spartanCellHeight,
          cellPadding: 5,
          palletWidth: Math.floor(spartanCellWidth * 0.9),
          palletHeight: Math.floor(spartanCellHeight * 0.9)
        };
    }
  };
  
  // For backward compatibility with existing code
  const calculateCellDimensions = (aircraft: string): { width: number, spacing: number } => {
    const config = getAircraftGridConfig(aircraft);
    return {
      width: config.cellWidth,
      spacing: config.cellWidth + config.cellPadding
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
    // Apply 10% size reduction for all pallets - ensure pallets fit perfectly within grid cells
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
  
  // Show pallet input dialog - completely rebuilt
  const showPalletInput = (palletId: number, position?: string) => {
    // Always open the dialog when called, even if pallet ID doesn't match yet
    // The pallet ID is often correct but the state update hasn't completed
    console.log("showPalletInput called with ID:", palletId, "position:", position);
    
    // Set defaults even if pallet is not found yet
    setEditingPalletId(palletId);
    setPalletWeight("");
    setPalletCargoType("C");
    setPalletPosition(position || "");
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
          cargoType: palletCargoType,
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
        console.log("Balance scale width measured:", width);
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
  
  useEffect(() => {
    // Calculate total weight of pallets in cargo area
    const weight = pallets.reduce((total, pallet) => {
      return pallet.location === "cargo" ? total + (pallet.weight || 0) : total;
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
    
    cargoPallets.forEach(pallet => {
      // Skip pallets with no weight
      if (pallet.weight === null) return;
      
      // Get pallet center position relative to cargo area width (0 to 1)
      const centerPosition = (pallet.position.x + pallet.size.width / 2) / cargoWidth;
      // Convert to -1 (left) to 1 (right) where 0 is center
      const normalizedPosition = (centerPosition * 2) - 1;
      
      // Calculate moment (weight * position)
      totalWeightMoment += pallet.weight * normalizedPosition;
      totalWeightInCargo += pallet.weight;
    });
    
    // Calculate balance value (-100 to 100)
    let balance = 0;
    if (totalWeightInCargo > 0) {
      // Normalize to -100 to 100 range and add dampening factor
      balance = (totalWeightMoment / totalWeightInCargo) * 100;
    }
    
    setBalanceValue(balance);
    
    // Determine balance status
    if (Math.abs(balance) < 20) {
      setBalanceStatus('safe');
    } else if (Math.abs(balance) < 50) {
      setBalanceStatus('warning');
    } else {
      setBalanceStatus('danger');
    }
  }, [pallets]);
  
  const handleBackClick = () => {
    navigate("/load-planning");
  };
  
  const handleDragStart = (e: React.DragEvent, id: number | null) => {
    if (id === null) {
      // We're dragging the template pallet
      setIsDraggingTemplate(true);
      e.dataTransfer.setData("text/plain", "template");
    } else {
      // We're dragging an existing pallet
      e.dataTransfer.setData("text/plain", id.toString());
      setDraggedPallet(id);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
                         currentAircraftId === 'c130' ? 8 : 3;
                          
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
      
      // Create a new pallet with size based on aircraft type
      let palletSize;
      
      // Get pallet size from our aircraft configuration
      const config = getAircraftGridConfig(currentAircraftId);
      palletSize = {
        width: config.palletWidth,
        height: config.palletHeight
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
          } else {
            // For C-27J and KC30-A (single row of 3 pallets)
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
        size: palletSize
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
        } else {
          // For C-27J/KC30-A with 3x1 grid
          for (let col = 0; col < 3; col++) {
            // Make positions 120% bigger for Spartan cargo area
            const cellWidth = 132; // 110 * 1.2
            const cellHeight = 96; // 80 * 1.2
            const cellX = col * 144 + cellWidth/2; // center of cell (120 * 1.2 = 144)
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
                0,    // No row for C-27J
                144,  // x spacing of 144 for Spartan
                0     // No additional offset
              );
              
              // Update pallet size to be 10% smaller
              palletSize.width = dimensions.width;
              palletSize.height = dimensions.height;
              
              // Calculate snap position (centered in cell)
              snapX = col * 144 + (cellWidth - dimensions.width) / 2;
              snapY = 20 + (cellHeight - dimensions.height) / 2;
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
              
              // Use helper functions for consistent sizing
              const dimensions = calculatePalletDimensions(cellWidth, cellHeight);
              
              // Update the pallet size to be consistently 10% smaller
              draggedPallet.size = {
                width: dimensions.width,
                height: dimensions.height
              };
              
              // Calculate snap position (centered in cell)
              snapX = col * 144 + (cellWidth - dimensions.width) / 2;
              snapY = 20 + (cellHeight - dimensions.height) / 2;
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
          // Get the proper dimensions based on aircraft type
          const config = getAircraftGridConfig(currentAircraftId);
          const palletSize = dropArea === "configure" 
            ? { width: 88, height: 108 } // Fixed size in config area
            : { width: config.palletWidth, height: config.palletHeight }; // Dynamic size in cargo area
            
          return {
            ...pallet,
            position: { x: newX, y: newY },
            size: palletSize,
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
    setBalanceValue(0);
    setBalanceStatus('safe');
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
              <Label htmlFor="cargoType" className="text-right">
                Cargo Type
              </Label>
              <div className="col-span-2 flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="normal-cargo"
                    className="h-4 w-4"
                    checked={palletCargoType === "C"}
                    onChange={() => setPalletCargoType("C")}
                  />
                  <Label htmlFor="normal-cargo">Normal Cargo (C)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="dangerous-goods"
                    className="h-4 w-4"
                    checked={palletCargoType === "DG"}
                    onChange={() => setPalletCargoType("DG")}
                  />
                  <Label htmlFor="dangerous-goods">Dangerous Goods (DG)</Label>
                </div>
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
                        currentAircraftId === 'c130' ? '8' : '3'
                      }
                    </p>
                  </div>
                  {/* Storage area has been removed */}
                </div>
              </CardContent>
            </Card>
            
            {/* Cargo Area and Configure Pallets side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
              {/* Cargo Area - Always on the left */}
              <Card className="lg:col-span-7">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Plane className="h-5 w-5 mr-2 text-primary" />
                    Cargo Area
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({currentAircraftId === 'c17' ? '18 pallets' : currentAircraftId === 'c130' ? '8 pallets' : '3 pallets'})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    ref={cargoRef}
                    className={`relative w-full ${
                      currentAircraftId === 'c17' 
                        ? 'h-[320px]' 
                        : currentAircraftId === 'c130' 
                          ? 'h-[220px]' 
                          : 'h-[150px]'
                    } overflow-visible bg-transparent`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, "cargo")}
                  >
                    {/* Grid lines */}
                    {currentAircraftId === 'c17' ? (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Custom grid for 9x2 layout with 88x108 pallets */}
                        
                        {/* Grid cells for C-17 */}
                        {(() => {
                          // Get configuration for C-17
                          const config = getAircraftGridConfig('c17');
                          const cellSpacing = config.cellWidth + config.cellPadding;
                          
                          // Create array of cells for both rows
                          return (
                            <>
                              {/* First row */}
                              {[...Array(config.cols)].map((_, i) => (
                                <div 
                                  key={`cell-row1-${i}`} 
                                  className="absolute border-2 border-green-800/80 rounded-sm"
                                  style={{
                                    left: i * cellSpacing,
                                    top: 10,
                                    width: config.cellWidth,
                                    height: config.cellHeight,
                                    backgroundColor: 'rgba(20, 83, 45, 0.15)'
                                  }}
                                >
                                  <div className="absolute inset-0 flex items-center justify-center text-white/50 font-bold text-lg">
                                    P{i + 1}
                                  </div>
                                </div>
                              ))}
                              
                              {/* Second row */}
                              {[...Array(config.cols)].map((_, i) => (
                                <div 
                                  key={`cell-row2-${i}`} 
                                  className="absolute border-2 border-green-800/80 rounded-sm"
                                  style={{
                                    left: i * cellSpacing,
                                    top: 105, 
                                    width: config.cellWidth,
                                    height: config.cellHeight,
                                    backgroundColor: 'rgba(20, 83, 45, 0.15)'
                                  }}
                                >
                                  <div className="absolute inset-0 flex items-center justify-center text-white/50 font-bold text-lg">
                                    P{i + 10}
                                  </div>
                                </div>
                              ))}
                            </>
                          );
                        })()}
                      </div>
                    ) : currentAircraftId === 'c130' ? (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Grid cells for C-130 - 8 pallets (4x2) */}
                        {(() => {
                          // Get configuration for C-130
                          const config = getAircraftGridConfig('c130');
                          const cellSpacing = config.cellWidth + config.cellPadding;
                          
                          // Create array of cells for both rows
                          return (
                            <>
                              {/* First row */}
                              {[...Array(config.cols)].map((_, i) => (
                                <div 
                                  key={`c130-row1-${i}`} 
                                  className="absolute border-2 border-green-800/80 rounded-sm"
                                  style={{
                                    left: i * cellSpacing,
                                    top: 10,
                                    width: config.cellWidth,
                                    height: config.cellHeight,
                                    backgroundColor: 'rgba(20, 83, 45, 0.15)'
                                  }}
                                >
                                  <div className="absolute inset-0 flex items-center justify-center text-white/50 font-bold text-xl">
                                    P{i + 1}
                                  </div>
                                </div>
                              ))}
                              
                              {/* Second row */}
                              {[...Array(config.cols)].map((_, i) => (
                                <div 
                                  key={`c130-row2-${i}`} 
                                  className="absolute border-2 border-green-800/80 rounded-sm"
                                  style={{
                                    left: i * cellSpacing,
                                    top: 100,
                                    width: config.cellWidth,
                                    height: config.cellHeight,
                                    backgroundColor: 'rgba(20, 83, 45, 0.15)'
                                  }}
                                >
                                  <div className="absolute inset-0 flex items-center justify-center text-white/50 font-bold text-xl">
                                    P{i + 5}
                                  </div>
                                </div>
                              ))}
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Grid cells for C-27J/KC30-A - 3 pallets (3x1) */}
                        {(() => {
                          // Get configuration for current aircraft (C-27J or KC30-A)
                          const config = getAircraftGridConfig(currentAircraftId);
                          const cellSpacing = Math.floor(balanceScaleWidth / 3); // Evenly distribute across available width
                          
                          return [...Array(config.cols)].map((_, i) => (
                            <div 
                              key={`spartan-${i}`} 
                              className="absolute border-2 border-green-800/80 rounded-sm"
                              style={{
                                left: i * cellSpacing,
                                top: 20,
                                width: config.cellWidth,
                                height: config.cellHeight,
                                backgroundColor: 'rgba(20, 83, 45, 0.15)'
                              }}
                            >
                              <div className="absolute inset-0 flex items-center justify-center text-white/50 font-bold text-xl">
                                P{i + 1}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                    
                    {/* Pallets in cargo area */}
                    {pallets.filter(pallet => pallet.location === "cargo").map((pallet) => (
                      <div
                        key={pallet.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, pallet.id)}
                        className="absolute cursor-move flex items-center justify-center font-bold text-white bg-orange-500/70 border-2 border-orange-500 rounded-md"
                        style={{
                          left: `${pallet.position.x}px`,
                          top: `${pallet.position.y}px`,
                          width: `${pallet.size.width}px`,  // Dynamic width based on aircraft
                          height: `${pallet.size.height}px`, // Dynamic height based on aircraft
                          zIndex: 10
                        }}
                      >
                        <div className="flex flex-col items-center w-full h-full">
                          <div className="absolute top-1 left-1">
                            {pallet.positionLabel && (
                              <span className="text-xs font-medium bg-white/20 px-1 rounded">
                                {pallet.positionLabel}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1 flex flex-col items-center justify-center">
                            {pallet.weight !== null ? 
                              <span>{pallet.weight} kg</span> : 
                              <span className="text-white/80">No weight</span>
                            }
                          </div>
                          
                          <div className="absolute top-1 right-1">
                            {pallet.cargoType && (
                              <Badge 
                                variant={pallet.cargoType === "C" ? "outline" : "destructive"}
                                className="text-xs px-1"
                              >
                                {pallet.cargoType}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
                    <div ref={balanceScaleRef} className="h-8 relative mb-1 rounded-md overflow-hidden">
                      {/* Background gradient */}
                      <div className="absolute inset-0" style={{ 
                        background: 'linear-gradient(to right, #dc2626 0%, #ea580c 15%, #f59e0b 30%, #84cc16 45%, #22c55e 50%, #84cc16 55%, #f59e0b 70%, #ea580c 85%, #dc2626 100%)'
                      }}></div>
                      
                      {/* Center line */}
                      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/80"></div>
                      
                      {/* Indicator needle */}
                      <div 
                        className="absolute top-0 bottom-0 w-2 bg-white shadow-md"
                        style={{ 
                          left: `${(balanceValue + 100) / 2}%`,
                          transform: 'translateX(-50%)',
                          transition: 'left 0.3s ease-out'
                        }}
                      ></div>
                      
                      {/* Labels */}
                      <div className="absolute inset-0 flex justify-between px-2 items-center text-[10px] font-medium text-white">
                        <span>FWD</span>
                        <span className="mx-auto">BALANCED</span>
                        <span>AFT</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
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
                      (Max: {currentAircraftId === 'c17' ? '18' : currentAircraftId === 'c130' ? '8' : '3'})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Template Pallet */}
                  <div className="mb-6 p-4 border-2 border-dashed border-primary rounded-lg">
                    <h3 className="text-sm font-medium flex items-center mb-3">
                      <Package2 className="h-4 w-4 mr-2 text-primary" />
                      Template Pallet
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      Drag this template pallet to the cargo area to create new pallets.
                      You can add up to {currentAircraftId === 'c17' ? '18' : currentAircraftId === 'c130' ? '8' : '3'} pallets
                      for the {currentAircraft.name}.
                    </p>
                    
                    {/* Draggable template pallet */}
                    <div 
                      className="rounded p-4 flex items-center justify-center bg-orange-500/70 border-2 border-orange-500 cursor-move"
                      style={{ 
                        width: getAircraftGridConfig(currentAircraftId).palletWidth, 
                        height: getAircraftGridConfig(currentAircraftId).palletHeight 
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, null)}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <Package2 className="h-5 w-5 mb-1" />
                        <span className="font-medium text-center text-[10px]">Drag to Create</span>
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
          </div>
        </div>
      </div>
    </>
  );
}