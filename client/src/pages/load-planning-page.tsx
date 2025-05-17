import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, Package2, PackageOpen, RefreshCw, AlertCircle, AlertTriangle, X, Plane, MessagesSquare } from "lucide-react";
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
  cargoType?: "C" | "DG" | "LD3"; // C = Normal Cargo, DG = Dangerous Goods, LD3 = Container
  cargoCategory?: string; // Like "Pax Bags", "Mechanical", "Medical Equipment", "LD3 Container" etc.
  dgClass?: string; // Class of dangerous goods (1-9)
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
  const { toast } = useToast();
  
  // Get badge variant based on cargo type
  const getCargoTypeBadgeVariant = (cargoType?: string) => {
    if (cargoType === "C") return "outline";
    if (cargoType === "LD3") return "secondary";
    if (cargoType === "DG") return "destructive";
    return "outline"; // Default
  };
  
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
    console.log(`Grid config: Aircraft ${aircraft}, balance scale width: ${totalWidth}px`);
    
    switch (aircraft) {
      case 'c17':
        // C-17 has 9 columns in 2 rows (18 pallets total)
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
        // C-130 has 4 columns in 2 rows (8 pallets total)
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
        // KC30-A has 13 columns in 2 rows (26 pallets total)
        const kc30aCellWidth = totalWidth / 13;
        const kc30aCellHeight = 50; // Smaller height to fit 2 rows
        return {
          rows: 2,
          cols: 13,
          cellWidth: kc30aCellWidth,
          cellHeight: kc30aCellHeight,
          cellPadding: 0, // No padding to ensure perfect alignment
          palletWidth: kc30aCellWidth * 0.9,
          palletHeight: kc30aCellHeight * 0.9
        };
        
      default: // c27j
        // C-27J has 3 columns in 1 row (3 pallets total)
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
  
  // Drop zones for the cargo area
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  
  // Keep track of the next pallet ID for newly created pallets
  const [nextPalletId, setNextPalletId] = useState(1);
  
  // Track whether we're dragging the template pallet
  const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
  
  const [draggedPallet, setDraggedPallet] = useState<number | null>(null);
  const [totalWeight, setTotalWeight] = useState(0);
  const cargoRef = useRef<HTMLDivElement>(null);
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
  const [palletCargoType, setPalletCargoType] = useState<"C" | "DG" | "LD3">("C"); // C = Normal Cargo, DG = Dangerous Goods, LD3 = Container
  const [palletPosition, setPalletPosition] = useState<string>("");
  const [palletCargoCategory, setPalletCargoCategory] = useState<string>("");
  const [palletDgClass, setPalletDgClass] = useState<string>("");
  const [isDangerousGoods, setIsDangerousGoods] = useState(false);

  // Position error state
  const [positionError, setPositionError] = useState<string>("");
  
  // Helper function to calculate positions
  const calculatePalletPosition = (aircraft: string, dropX: number, dropY: number) => {
    const config = getAircraftGridConfig(aircraft);
    let positionLabel = "";
    let newX = dropX;
    let newY = dropY;
    
    if (aircraft === 'c17') {
      const cellRow = dropY > 98 ? 1 : 0;
      const cellColumn = Math.min(config.cols - 1, Math.max(0, Math.floor(dropX / config.cellWidth)));
      
      // Position label
      positionLabel = `P${cellRow === 0 ? cellColumn + 1 : cellColumn + 10}`;
      
      // Calculate position to center the pallet within the cell
      const rowTopOffset = cellRow === 0 ? 10 : 105; // top margin for each row
      newX = (cellColumn * config.cellWidth) + (config.cellWidth - config.palletWidth) / 2;
      newY = rowTopOffset + (config.cellHeight - config.palletHeight) / 2;
    }
    else if (aircraft === 'c130') {
      const cellRow = dropY > 98 ? 1 : 0;
      const cellColumn = Math.min(config.cols - 1, Math.max(0, Math.floor(dropX / config.cellWidth)));
      
      // Position label
      positionLabel = `P${cellRow === 0 ? cellColumn + 1 : cellColumn + 5}`;
      
      // Calculate position to center the pallet within the cell
      const rowTopOffset = cellRow === 0 ? 10 : 105; // top margin for each row
      newX = (cellColumn * config.cellWidth) + (config.cellWidth - config.palletWidth) / 2;
      newY = rowTopOffset + (config.cellHeight - config.palletHeight) / 2;
    }
    else if (aircraft === 'kc30a') {
      // Determine if we're in the top (L) or bottom (P) section based on Y position
      const isTopSection = dropY < 200; // Top section is above 200px
      const cellColumn = Math.min(config.cols - 1, Math.max(0, Math.floor(dropX / config.cellWidth)));
      
      if (isTopSection) {
        // Top section with L positions
        // Determine which row (L1-L13 or L14-L26)
        const rowIndex = dropY < 95 ? 0 : 1; // First or second row
        const yOffset = rowIndex === 0 ? 10 : 110; // Top margin for each row
        
        // Calculate position number based on row
        const positionNumber = rowIndex === 0 
          ? cellColumn + 1  // First row: L1-L13
          : cellColumn + 14; // Second row: L14-L26
        
        // Position label
        positionLabel = `L${positionNumber}`;
        
        // Calculate position to center the pallet within the cell
        newX = (cellColumn * config.cellWidth) + (config.cellWidth - config.palletWidth) / 2;
        newY = yOffset + (config.cellHeight - config.palletHeight) / 2;
      } else {
        // Bottom section with P positions
        const yOffset = 300; // Top margin for bottom section
        
        // Position label
        positionLabel = `P${cellColumn + 1}`;
        
        // Calculate position to center the pallet within the cell
        newX = (cellColumn * config.cellWidth) + (config.cellWidth - config.palletWidth) / 2;
        newY = yOffset + (config.cellHeight - config.palletHeight) / 2;
      }
    }
    else { // Default c27j
      const cellColumn = Math.min(config.cols - 1, Math.max(0, Math.floor(dropX / config.cellWidth)));
      
      // Position label
      positionLabel = `P${cellColumn + 1}`;
      
      // Calculate position to center the pallet within the cell
      newX = (cellColumn * config.cellWidth) + (config.cellWidth - config.palletWidth) / 2;
      newY = 20 + (config.cellHeight - config.palletHeight) / 2; // Fixed top offset with vertical centering
    }
    
    return { positionLabel, x: newX, y: newY };
  };
  
  // Handle drop for a new pallet
  const handleDrop = (event: React.DragEvent<HTMLDivElement>, dropArea: "cargo" | "configure") => {
    event.preventDefault();
    
    if (!isDraggingTemplate && draggedPallet === null) return;
    
    // Get drop coordinates
    const rect = event.currentTarget.getBoundingClientRect();
    const dropX = event.clientX - rect.left;
    const dropY = event.clientY - rect.top;
    
    if (isDraggingTemplate) {
      // Handle template drop
      
      // Get the data transfer type
      const dataTransfer = event.dataTransfer.getData("text/plain");
      console.log("Template dropped:", dataTransfer, "at", { x: dropX, y: dropY });
      
      // Get configuration based on the aircraft type
      const config = getAircraftGridConfig(currentAircraftId);
      
      // Default size for the pallet (will be adjusted based on the aircraft)
      let palletSize = {
        width: config.palletWidth,
        height: config.palletHeight
      };
      
      // Calculate position and position label
      let position = { x: dropX, y: dropY };
      let positionLabel = "";
      
      if (dropArea === "cargo") {
        // Get position information for the specific aircraft
        const posInfo = calculatePalletPosition(currentAircraftId, dropX, dropY);
        position = { x: posInfo.x, y: posInfo.y };
        positionLabel = posInfo.positionLabel;
        
        // Check position rules
        if (dataTransfer === "template-ld3") {
          // LD3 containers can only be in L positions
          if (!positionLabel.startsWith('L')) {
            setPositionError(`LD3 containers can only be placed in L positions`);
          } else {
            setPositionError("");
          }
        } else {
          // Regular pallets should not be in L positions
          if (positionLabel.startsWith('L')) {
            setPositionError(`Regular pallets should not be placed in ${positionLabel}`);
          } else {
            setPositionError("");
          }
        }
      } else {
        // For configure area, use the original drop calculation
        position = { 
          x: dropX - (palletSize.width / 2),
          y: dropY - (palletSize.height / 2)
        };
        
        // Keep within bounds
        if (rect) {
          const areaWidth = rect.width;
          const areaHeight = rect.height;
          position.x = Math.max(0, Math.min(position.x, areaWidth - palletSize.width));
          position.y = Math.max(0, Math.min(position.y, areaHeight - palletSize.height));
        }
      }
      
      // Store the current pallet ID before incrementing
      const currentId = nextPalletId;
      
      // Create the new pallet
      const newPallet: Pallet = {
        id: currentId,
        position: position,
        location: dropArea,
        weight: null,
        size: palletSize,
        cargoType: dataTransfer === "template-ld3" ? "LD3" : "C", // Mark as LD3 or regular cargo
        cargoCategory: dataTransfer === "template-ld3" ? "LD3 Container" : "Pax Bags", // Default category
        positionLabel: positionLabel
      };
      
      // Add the new pallet to the pallets array
      setPallets(prev => [...prev, newPallet]);
      
      // Increment the next pallet ID
      setNextPalletId(prev => prev + 1);
      
      // If pallet is in cargo area, show the input dialog to set weight
      if (dropArea === "cargo") {
        // Show pallet input dialog
        showPalletInput(currentId, positionLabel);
      }
    } 
    else if (draggedPallet !== null) {
      // Handle moving an existing pallet
      
      // Calculate position and position label
      let position = { x: dropX, y: dropY };
      let positionLabel = "";
      
      if (dropArea === "cargo") {
        // Get position information for the specific aircraft
        const posInfo = calculatePalletPosition(currentAircraftId, dropX, dropY);
        position = { x: posInfo.x, y: posInfo.y };
        positionLabel = posInfo.positionLabel;
        
        // Get the pallet being moved
        const movedPallet = pallets.find(p => p.id === draggedPallet);
        
        // Check position rules
        if (movedPallet?.cargoType === "LD3") {
          // LD3 containers can only be in L positions
          if (!positionLabel.startsWith('L')) {
            setPositionError(`LD3 containers can only be placed in L positions`);
          } else {
            setPositionError("");
          }
        } else {
          // Regular pallets should not be in L positions
          if (positionLabel.startsWith('L')) {
            setPositionError(`Regular pallets should not be placed in ${positionLabel}`);
          } else {
            setPositionError("");
          }
        }
      } else {
        // For configure area, calculate position directly
        const movedPallet = pallets.find(p => p.id === draggedPallet);
        if (movedPallet) {
          position = { 
            x: dropX - (movedPallet.size.width / 2),
            y: dropY - (movedPallet.size.height / 2)
          };
          
          // Keep within bounds
          if (rect) {
            const areaWidth = rect.width;
            const areaHeight = rect.height;
            position.x = Math.max(0, Math.min(position.x, areaWidth - movedPallet.size.width));
            position.y = Math.max(0, Math.min(position.y, areaHeight - movedPallet.size.height));
          }
        }
      }
      
      // Update the pallet position in the array
      setPallets(prev => {
        return prev.map(pallet => {
          if (pallet.id === draggedPallet) {
            return {
              ...pallet,
              position: position,
              location: dropArea,
              positionLabel: dropArea === "cargo" ? positionLabel : undefined
            };
          }
          return pallet;
        });
      });
      
      // Reset dragged pallet
      setDraggedPallet(null);
    }
    
    // Reset the dragging status
    setIsDraggingTemplate(false);
  };

  // More code here (rest of the component)
  
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
    event.stopPropagation(); // Prevent event bubbling
    console.log("PALLET CLICKED", pallet, posLabel);
    
    // Update dialog state
    setEditingPalletId(pallet.id);
    setPalletWeight(pallet.weight ? pallet.weight.toString() : "");
    setPalletCargoType(pallet.cargoType || "C");
    setPalletPosition(posLabel || pallet.positionLabel || "");
    setPalletCargoCategory(pallet.cargoCategory || "");
    setPalletDgClass(pallet.dgClass || "");
    setIsDangerousGoods(pallet.cargoType === "DG");
    setPalletInputOpen(true);
  };
  
  // Handle pallet click - this will be called when a pallet in the cargo area is clicked
  const handlePalletClick = (palletId: number, position: string) => {
    console.log("handlePalletClick called with ID:", palletId, "position:", position);
    showPalletInput(palletId, position);
  };

  // Show pallet input dialog
  const showPalletInput = (palletId: number, position?: string) => {
    console.log("showPalletInput called with ID:", palletId, "position:", position);
    
    const selectedPallet = pallets.find(p => p.id === palletId);
    console.log("Found pallet:", selectedPallet);
    
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
      
      // Calculate total weight excluding the current pallet (include base weights)
      const otherPalletsWeight = pallets
        .filter(p => p.id !== editingPalletId && p.location === "cargo")
        .reduce((sum, p) => {
          // Start with cargo weight
          let palletTotalWeight = p.weight || 0;
          
          // Add base weight (136kg for regular pallets, 110kg for LD3)
          if (p.cargoType === "LD3") {
            palletTotalWeight += 110;
          } else {
            palletTotalWeight += 136;
          }
          
          return sum + palletTotalWeight;
        }, 0);
      
      // Add base weight for the current pallet
      const currentPalletBaseWeight = palletCargoType === "LD3" ? 110 : 136;
      const totalWeightWithNew = otherPalletsWeight + weightValue + currentPalletBaseWeight;
      
      // Check if total weight exceeds aircraft maximum payload
      if (totalWeightWithNew > MAX_PAYLOAD) {
        showAlert(
          'error',
          'Aircraft Maximum Payload Exceeded',
          `The total weight (${totalWeightWithNew.toLocaleString()} kg) exceeds the aircraft's maximum payload capacity of ${MAX_PAYLOAD.toLocaleString()} kg.`
        );
        
        // Adjust the weight to fit within the limit
        const availableCapacity = MAX_PAYLOAD - otherPalletsWeight - currentPalletBaseWeight;
        weightValue = Math.max(0, availableCapacity);
      }
    }
    
    const selectedCargoType = isDangerousGoods ? "DG" : palletCargoType;
    
    // Update the pallet in the array
    setPallets(prev => 
      prev.map(pallet => 
        pallet.id === editingPalletId
          ? {
              ...pallet,
              weight: weightValue,
              cargoType: selectedCargoType,
              positionLabel: palletPosition,
              cargoCategory: palletCargoCategory,
              dgClass: selectedCargoType === "DG" ? palletDgClass : undefined
            }
          : pallet
      )
    );
    
    setPalletInputOpen(false);
  };
  
  // Handle drag start for a pallet
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, palletId: number) => {
    // Prevent dragging when in pallet input mode
    if (palletInputOpen) {
      event.preventDefault();
      return;
    }
    
    console.log("Drag start:", palletId);
    setDraggedPallet(palletId);
    
    // Set a ghost image for dragging (otherwise it's the whole component)
    const pallet = pallets.find(p => p.id === palletId);
    if (pallet) {
      const ghostElement = document.createElement('div');
      ghostElement.style.width = `${pallet.size.width}px`;
      ghostElement.style.height = `${pallet.size.height}px`;
      ghostElement.style.backgroundColor = pallet.cargoType === "DG" ? 'rgba(255, 0, 0, 0.5)' : 
                                          pallet.cargoType === "LD3" ? 'rgba(0, 100, 255, 0.5)' : 
                                          'rgba(180, 180, 180, 0.5)';
      ghostElement.style.border = '2px solid #888';
      ghostElement.style.borderRadius = '4px';
      document.body.appendChild(ghostElement);
      
      event.dataTransfer.setDragImage(ghostElement, pallet.size.width / 2, pallet.size.height / 2);
      
      // Remove the ghost element after the drag starts
      setTimeout(() => {
        document.body.removeChild(ghostElement);
      }, 0);
    }
  };
  
  // Handle drag start for template pallets
  const handleTemplateDragStart = (event: React.DragEvent<HTMLDivElement>, templateType: string) => {
    event.dataTransfer.setData("text/plain", templateType);
    setIsDraggingTemplate(true);
    
    // Create a ghost element for dragging
    const ghostElement = document.createElement('div');
    const isLD3 = templateType === "template-ld3";
    
    // Use the same dimensions as the template
    ghostElement.style.width = '80px';
    ghostElement.style.height = '80px';
    ghostElement.style.backgroundColor = isLD3 ? 'rgba(0, 100, 255, 0.5)' : 'rgba(180, 180, 180, 0.5)';
    ghostElement.style.border = '2px solid #888';
    ghostElement.style.borderRadius = '4px';
    document.body.appendChild(ghostElement);
    
    event.dataTransfer.setDragImage(ghostElement, 40, 40);
    
    // Remove the ghost element after the drag starts
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  };
  
  // Handle drag over for the target area
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };
  
  // Delete a pallet
  const deletePallet = (palletId: number) => {
    setPallets(prev => prev.filter(pallet => pallet.id !== palletId));
  };
  
  // Reset all pallets
  const resetAllPallets = () => {
    // Show confirmation dialog before reset
    if (pallets.length > 0) {
      if (window.confirm("Are you sure you want to reset all pallets? This will remove all cargo.")) {
        setPallets([]);
        setNextPalletId(1);
        setTotalWeight(0);
        setBalanceValue(0);
        setBalanceCG(53.00); // Reset to default CG
        setBalanceStatus('safe');
        setPositionError("");
        
        toast({
          title: "Reset complete",
          description: "All pallets have been removed.",
        });
      }
    } else {
      toast({
        title: "No pallets to reset",
        description: "There are no pallets to remove.",
      });
    }
  };
  
  // Calculate normalized lateral position (-1 to +1) for balance calculation
  const getNormalizedPosition = (positionLabel: string): number => {
    let normalizedPosition = 0;
    const positionNumber = parseInt(positionLabel.replace(/[LP]/g, '')) || 0;
    
    if (currentAircraftId === 'c27j' || currentAircraftId === 'kc30a') {
      // For 3-position aircraft: -0.66 (left/P1), 0 (center/P2), 0.66 (right/P3)
      normalizedPosition = (positionNumber - 1) * 0.66 - 0.66; // -0.66, 0, 0.66
    } else if (currentAircraftId === 'c17') {
      // For 9-position aircraft: -0.9 to +0.9
      const col = (positionNumber > 9) ? positionNumber - 10 : positionNumber - 1;
      normalizedPosition = col * 0.225 - 0.9; // -0.9, -0.675, -0.45, ... +0.9
    } else if (currentAircraftId === 'c130') {
      // For 4-position aircraft: -0.75 to +0.75
      const col = (positionNumber > 4) ? positionNumber - 5 : positionNumber - 1;
      normalizedPosition = col * 0.5 - 0.75; // -0.75, -0.25, +0.25, +0.75
    }
    
    return normalizedPosition;
  };
  
  // Effect: Update balance calculation when pallets change
  useEffect(() => {
    // 1. Calculate total weight
    let totalCalculatedWeight = 0;
    
    // Calculate weighted balance value
    let balanceValueSum = 0;
    
    // Only include pallets that are in the cargo area
    const cargoPallets = pallets.filter(p => p.location === "cargo");
    
    cargoPallets.forEach(pallet => {
      // Skip pallets without weight
      if (pallet.weight === null) return;
      
      // Get position and calculate normalized lateral position
      const positionLabel = pallet.positionLabel || '';
      
      // Skip pallets without position labels
      if (!positionLabel) return;
      
      // Add base weight (136kg for regular, 110kg for LD3)
      const baseWeight = pallet.cargoType === "LD3" ? 110 : 136;
      const totalItemWeight = pallet.weight + baseWeight;
      
      totalCalculatedWeight += totalItemWeight;
      
      // Calculate weighted position for balance calculation
      const normalizedPosition = getNormalizedPosition(positionLabel);
      balanceValueSum += normalizedPosition * totalItemWeight;
    });
    
    // Update total weight state
    setTotalWeight(totalCalculatedWeight);
    
    // Calculate balance value (-100 to +100)
    let calculatedBalanceValue = 0;
    if (totalCalculatedWeight > 0) {
      // Weighted average, scaled to -100 to +100
      calculatedBalanceValue = (balanceValueSum / totalCalculatedWeight) * 100;
    }
    
    // Ensure balance is within bounds
    calculatedBalanceValue = Math.max(-100, Math.min(100, calculatedBalanceValue));
    setBalanceValue(calculatedBalanceValue);
    
    // Map balance value to CG scale (18-88 degrees)
    const calculatedCG = (calculatedBalanceValue + 100) / 200 * 70 + 18;
    setBalanceCG(parseFloat(calculatedCG.toFixed(2)));
    
    // Set balance status
    if (Math.abs(calculatedBalanceValue) < 15) {
      setBalanceStatus('safe');
    } else if (Math.abs(calculatedBalanceValue) < 30) {
      setBalanceStatus('moderate');
    } else if (Math.abs(calculatedBalanceValue) < 60) {
      setBalanceStatus('warning');
    } else {
      setBalanceStatus('caution');
      // Show popup warning if outside safe range and we have cargo loaded
      if (totalCalculatedWeight > 0) {
        setWarningPopup(true);
      }
    }
  }, [pallets, currentAircraftId]);
  
  // Effect: Measure the balance scale width to make cargo area match it
  useEffect(() => {
    if (balanceScaleRef.current) {
      const width = balanceScaleRef.current.offsetWidth;
      setBalanceScaleWidth(width);
    }
  }, []);
  
  // Effect: Scroll to cargo chat when component mounts
  const chatRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(false);
  
  // Toggle chat visibility and scroll to it when visible
  const toggleChat = () => {
    const newVisibility = !showChat;
    setShowChat(newVisibility);
    
    // If showing chat, scroll to it after a short delay to allow for rendering
    if (newVisibility) {
      setTimeout(() => {
        chatRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Load Planning - {currentAircraft.name} | LOADM</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Load Planning - {currentAircraft.name}
            </h1>
          </div>
          
          <div className="flex gap-3">
            {/* Selection for different aircraft */}
            <Select
              value={currentAircraftId}
              onValueChange={(value) => {
                navigate(`/load-planning/${value}`);
                
                // Reset all pallets when changing aircraft to prevent invalid configurations
                setPallets([]);
                setNextPalletId(1);
                setTotalWeight(0);
                setBalanceValue(0);
                setBalanceCG(53.00);
                setBalanceStatus('safe');
                setPositionError("");
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select Aircraft" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="c27j">C-27J Spartan</SelectItem>
                <SelectItem value="c17">C-17 Globemaster</SelectItem>
                <SelectItem value="c130">C-130 Hercules</SelectItem>
                <SelectItem value="kc30a">KC30-A Airbus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left panel for cargo storage area */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-md flex items-center gap-2">
                    <Package2 className="h-4 w-4" />
                    Configure Pallet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="flex flex-col gap-2 relative h-[150px] border rounded-md overflow-hidden"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, "configure")}
                    ref={configureRef}
                  >
                    {/* Pallet Templates */}
                    <div className="flex gap-4 p-2">
                      {/* Regular Cargo Template */}
                      <div 
                        className="w-20 h-20 bg-gray-200 border-2 border-gray-500 rounded flex items-center justify-center cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => handleTemplateDragStart(e, "template-cargo")}
                      >
                        <span className="font-bold text-xl text-gray-800">C</span>
                      </div>
                      
                      {/* LD3 Container Template */}
                      <div 
                        className="w-20 h-20 bg-blue-100 border-2 border-blue-500 rounded flex items-center justify-center cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => handleTemplateDragStart(e, "template-ld3")}
                      >
                        <span className="font-bold text-xl text-blue-800">LD3</span>
                      </div>
                    </div>
                    
                    {/* Configurable Pallets */}
                    {pallets.filter(pallet => pallet.location === "configure").map(pallet => (
                      <div
                        key={pallet.id}
                        className={`absolute border-2 rounded flex items-center justify-center 
                          ${pallet.cargoType === "DG" ? 'bg-red-100 border-red-500' : 
                            pallet.cargoType === "LD3" ? 'bg-blue-100 border-blue-500' : 
                            'bg-gray-200 border-gray-500'}`}
                        style={{
                          left: pallet.position.x,
                          top: pallet.position.y,
                          width: pallet.size.width,
                          height: pallet.size.height,
                          cursor: 'grab'
                        }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, pallet.id)}
                      >
                        <span className="font-bold text-xl">
                          {pallet.cargoType === "DG" ? "DG" : 
                           pallet.cargoType === "LD3" ? "LD3" : "C"}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 bg-gray-900 text-white rounded-full p-0"
                          onClick={() => deletePallet(pallet.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-md flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Balance Indicator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div className="text-center mb-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Forward/Left</span>
                        <span>Aft/Right</span>
                      </div>
                      
                      {/* Bar with color gradient for balance status */}
                      <div 
                        className="h-4 rounded-full relative overflow-hidden mt-1"
                        style={{
                          background: 'linear-gradient(to right, #ef4444 0%, #f59e0b 25%, #10b981 42.5%, #10b981 57.5%, #f59e0b 75%, #ef4444 100%)'
                        }}
                        ref={balanceScaleRef}
                      >
                        {/* Needle indicator */}
                        <div 
                          className="absolute top-0 bottom-0 w-1 bg-cyan-300 shadow-lg"
                          style={{
                            left: `${(balanceValue + 100) / 2}%`,
                            transition: 'left 0.3s ease-out'
                          }}
                        ></div>
                      </div>
                      
                      {/* Centre of Gravity value */}
                      <div className="mt-3 text-center">
                        <span className="text-gray-400 text-xs">Centre of Gravity:</span>
                        <div className="text-xl font-bold"
                             style={{
                               color: 
                                 balanceStatus === 'safe' ? '#10b981' :
                                 balanceStatus === 'moderate' ? '#f59e0b' :
                                 '#ef4444'
                             }}
                        >
                          {balanceCG.toFixed(1)}°
                        </div>
                      </div>
                      
                      {/* Total weight */}
                      <div className="mt-2 text-center">
                        <span className="text-gray-400 text-xs">Total Weight:</span>
                        <div className="text-xl font-bold text-white">
                          {totalWeight.toLocaleString()} kg
                        </div>
                        <div className="text-xs text-gray-400">
                          Max: {currentAircraft.maxPayload.toLocaleString()} kg
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="py-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-md flex items-center gap-2">
                    <PackageOpen className="h-4 w-4" />
                    Cargo Area - {currentAircraft.name}
                  </CardTitle>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetAllPallets}
                      className="h-8"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reset All Pallets
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleChat}
                      className="h-8"
                    >
                      <MessagesSquare className="h-4 w-4 mr-1" />
                      Cargo Balance Assistant
                    </Button>
                  </div>
                </div>
                
                {/* Position Error Alert */}
                {positionError && (
                  <Alert variant="destructive" className="mt-2 py-2">
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertTitle className="ml-2 text-sm">Position Warning</AlertTitle>
                    <AlertDescription className="ml-2 text-sm">
                      {positionError}
                    </AlertDescription>
                  </Alert>
                )}
              </CardHeader>
              
              <CardContent>
                <div 
                  className="relative border rounded-md overflow-hidden"
                  style={{ 
                    height: currentAircraftId === 'kc30a' ? '420px' : '220px',
                    width: balanceScaleWidth ? balanceScaleWidth : '100%' 
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "cargo")}
                  ref={cargoRef}
                >
                  {/* Grid Visualization for different aircraft */}
                  <div className="absolute inset-0">
                    {/* Aircraft-specific grid layout */}
                    {currentAircraftId === 'c17' && (
                      <div className="grid-c17">
                        {Array.from({ length: 18 }).map((_, i) => {
                          const row = i < 9 ? 0 : 1;
                          const col = i < 9 ? i : i - 9;
                          const cellWidth = (balanceScaleWidth || 700) / 9;
                          
                          // Find if there's a pallet at this position
                          const posLabel = `P${i + 1}`;
                          const assignedPallet = pallets.find(p => 
                            p.location === "cargo" && p.positionLabel === posLabel
                          );
                          
                          return (
                            <div 
                              key={`c17-${i}`}
                              data-position-key={`c17-${i}`}
                              data-position-number={i+1}
                              draggable={assignedPallet ? true : false}
                              onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
                              className={`absolute border border-gray-600 flex items-center justify-center
                                ${assignedPallet ? 'bg-orange-950/60' : 'bg-gray-800/50'}`}
                              style={{
                                width: cellWidth,
                                height: 87,
                                left: col * cellWidth,
                                top: row === 0 ? 10 : 105,
                                cursor: assignedPallet ? 'grab' : 'default'
                              }}
                              onClick={assignedPallet ? (e) => handlePalletCellClick(e, assignedPallet, posLabel) : undefined}
                            >
                              <div className="text-xs text-gray-400 absolute top-0 left-1">
                                {posLabel}
                              </div>
                              
                              {assignedPallet && (
                                <div className="flex flex-col items-center">
                                  <Badge 
                                    variant={getCargoTypeBadgeVariant(assignedPallet.cargoType)}
                                    className="mb-1"
                                  >
                                    {assignedPallet.cargoType || "C"}
                                  </Badge>
                                  
                                  {assignedPallet.weight !== null && (
                                    <div className="text-white font-bold">
                                      {assignedPallet.weight.toLocaleString()} kg
                                    </div>
                                  )}
                                  
                                  <div className="text-xs text-gray-300 mt-0.5">
                                    {assignedPallet.cargoCategory}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {currentAircraftId === 'c130' && (
                      <div className="grid-c130">
                        {Array.from({ length: 8 }).map((_, i) => {
                          const row = i < 4 ? 0 : 1;
                          const col = i < 4 ? i : i - 4;
                          const cellWidth = (balanceScaleWidth || 700) / 4;
                          
                          // Find if there's a pallet at this position
                          const posLabel = `P${i + 1}`;
                          const assignedPallet = pallets.find(p => 
                            p.location === "cargo" && p.positionLabel === posLabel
                          );
                          
                          return (
                            <div 
                              key={`c130-${i}`}
                              data-position-key={`c130-${i}`}
                              data-position-number={i+1}
                              draggable={assignedPallet ? true : false}
                              onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
                              className={`absolute border border-gray-600 flex items-center justify-center
                                ${assignedPallet ? 'bg-orange-950/60' : 'bg-gray-800/50'}`}
                              style={{
                                width: cellWidth,
                                height: 90,
                                left: col * cellWidth,
                                top: row === 0 ? 10 : 110,
                                cursor: assignedPallet ? 'grab' : 'default'
                              }}
                              onClick={assignedPallet ? (e) => handlePalletCellClick(e, assignedPallet, posLabel) : undefined}
                            >
                              <div className="text-xs text-gray-400 absolute top-0 left-1">
                                {posLabel}
                              </div>
                              
                              {assignedPallet && (
                                <div className="flex flex-col items-center">
                                  <Badge 
                                    variant={getCargoTypeBadgeVariant(assignedPallet.cargoType)}
                                    className="mb-1"
                                  >
                                    {assignedPallet.cargoType || "C"}
                                  </Badge>
                                  
                                  {assignedPallet.weight !== null && (
                                    <div className="text-white font-bold">
                                      {assignedPallet.weight.toLocaleString()} kg
                                    </div>
                                  )}
                                  
                                  <div className="text-xs text-gray-300 mt-0.5">
                                    {assignedPallet.cargoCategory}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {currentAircraftId === 'kc30a' && (
                      <div className="grid-kc30a">
                        {/* Top section with L positions (L1-L26) */}
                        <div className="absolute top-0 left-0 right-0 h-[180px] border-b border-gray-600">
                          {Array.from({ length: 26 }).map((_, i) => {
                            const row = i < 13 ? 0 : 1;
                            const col = i < 13 ? i : i - 13;
                            const cellWidth = (balanceScaleWidth || 700) / 13;
                            
                            // Find if there's a pallet at this position
                            const posLabel = `L${i + 1}`;
                            const assignedPallet = pallets.find(p => 
                              p.location === "cargo" && p.positionLabel === posLabel
                            );
                            
                            return (
                              <div 
                                key={`kc30a-l-${i}`}
                                data-position-key={`kc30a-l-${i}`}
                                data-position-number={i+1}
                                draggable={assignedPallet ? true : false}
                                onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
                                className={`absolute border border-gray-600 flex items-center justify-center
                                  ${assignedPallet ? 'bg-orange-950/60' : 'bg-gray-800/50'}`}
                                style={{
                                  width: cellWidth,
                                  height: 80,
                                  left: col * cellWidth,
                                  top: row === 0 ? 10 : 100,
                                  cursor: assignedPallet ? 'grab' : 'default'
                                }}
                                onClick={assignedPallet ? (e) => handlePalletCellClick(e, assignedPallet, posLabel) : undefined}
                              >
                                <div className="text-xs text-gray-400 absolute top-0 left-1">
                                  {posLabel}
                                </div>
                                
                                {assignedPallet && (
                                  <div className="flex flex-col items-center">
                                    <Badge 
                                      variant={getCargoTypeBadgeVariant(assignedPallet.cargoType)}
                                      className="mb-1"
                                    >
                                      {assignedPallet.cargoType || "C"}
                                    </Badge>
                                    
                                    {assignedPallet.weight !== null && (
                                      <div className="text-white font-bold">
                                        {assignedPallet.weight.toLocaleString()} kg
                                      </div>
                                    )}
                                    
                                    <div className="text-xs text-gray-300 mt-0.5">
                                      {assignedPallet.cargoCategory}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Bottom section with P positions (P1-P8) */}
                        <div className="absolute bottom-0 left-0 right-0 h-[200px]">
                          {Array.from({ length: 8 }).map((_, i) => {
                            const cellWidth = (balanceScaleWidth || 700) / 8;
                            
                            // Find if there's a pallet at this position
                            const posLabel = `P${i + 1}`;
                            const assignedPallet = pallets.find(p => 
                              p.location === "cargo" && p.positionLabel === posLabel
                            );
                            
                            return (
                              <div 
                                key={`kc30a-p-${i}`}
                                data-position-key={`kc30a-p-${i}`}
                                data-position-number={i+1}
                                draggable={assignedPallet ? true : false}
                                onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
                                className={`absolute border border-gray-600 flex items-center justify-center
                                  ${assignedPallet ? 'bg-orange-950/60' : 'bg-gray-800/50'}`}
                                style={{
                                  width: cellWidth,
                                  height: 108,
                                  left: i * cellWidth,
                                  top: 300,
                                  cursor: assignedPallet ? 'grab' : 'default'
                                }}
                                onClick={assignedPallet ? (e) => handlePalletCellClick(e, assignedPallet, posLabel) : undefined}
                              >
                                <div className="text-xs text-gray-400 absolute top-0 left-1">
                                  {posLabel}
                                </div>
                                
                                {assignedPallet && (
                                  <div className="flex flex-col items-center">
                                    <Badge 
                                      variant={getCargoTypeBadgeVariant(assignedPallet.cargoType)}
                                      className="mb-1"
                                    >
                                      {assignedPallet.cargoType || "C"}
                                    </Badge>
                                    
                                    {assignedPallet.weight !== null && (
                                      <div className="text-white font-bold">
                                        {assignedPallet.weight.toLocaleString()} kg
                                      </div>
                                    )}
                                    
                                    <div className="text-xs text-gray-300 mt-0.5">
                                      {assignedPallet.cargoCategory}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* C-27J (default) */}
                    {currentAircraftId === 'c27j' && (
                      <div className="grid-c27j">
                        {Array.from({ length: 3 }).map((_, i) => {
                          const config = getAircraftGridConfig('c27j');
                          const cellSpacing = config.cellWidth + config.cellPadding;
                          
                          // Find if there's a pallet at this position
                          const posLabel = `P${i + 1}`;
                          const assignedPallet = pallets.find(p => 
                            p.location === "cargo" && p.positionLabel === posLabel
                          );
                          
                          return (
                            <div 
                              key={`c27j-${i}`}
                              data-position-key={`c27j-${i}`}
                              data-position-number={i+1}
                              draggable={assignedPallet ? true : false}
                              onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
                              className={`absolute border border-gray-600 flex items-center justify-center
                                ${assignedPallet ? 'bg-orange-950/60' : 'bg-gray-800/50'}`}
                              style={{
                                width: config.cellWidth,
                                height: config.cellHeight,
                                left: i * cellSpacing,
                                top: 20,
                                cursor: assignedPallet ? 'grab' : 'default'
                              }}
                              onClick={assignedPallet ? (e) => handlePalletCellClick(e, assignedPallet, posLabel) : undefined}
                            >
                              <div className="text-xs text-gray-400 absolute top-0 left-1">
                                {posLabel}
                              </div>
                              
                              {assignedPallet && (
                                <div className="flex flex-col items-center">
                                  <Badge 
                                    variant={getCargoTypeBadgeVariant(assignedPallet.cargoType)}
                                    className="mb-1"
                                  >
                                    {assignedPallet.cargoType || "C"}
                                  </Badge>
                                  
                                  {assignedPallet.weight !== null && (
                                    <div className="text-white font-bold">
                                      {assignedPallet.weight.toLocaleString()} kg
                                    </div>
                                  )}
                                  
                                  <div className="text-xs text-gray-300 mt-0.5">
                                    {assignedPallet.cargoCategory}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Chat Component (Hidden by Default) */}
            {showChat && (
              <div ref={chatRef}>
                <LoadBalanceChat 
                  aircraftType={currentAircraft.name}
                  cargoData={pallets.filter(p => p.location === "cargo")}
                  balanceValue={balanceValue}
                  balanceCG={balanceCG}
                />
              </div>
            )}
          </div>
          
          {/* Right panel for pallet list */}
          <div className="lg:col-span-4">
            <Card className="h-full">
              <CardHeader className="py-3">
                <CardTitle className="text-md flex items-center gap-2">
                  <Package2 className="h-4 w-4" />
                  Cargo Manifest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {pallets.filter(pallet => pallet.location === "cargo").length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                      <p>No cargo loaded. Drag pallets from the Configure Pallet area to the Cargo Area.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pallets
                        .filter(pallet => pallet.location === "cargo")
                        .sort((a, b) => {
                          const aPosition = a.positionLabel || "";
                          const bPosition = b.positionLabel || "";
                          return aPosition.localeCompare(bPosition);
                        })
                        .map(pallet => {
                          // Calculate total weight (cargo + base)
                          const baseWeight = pallet.cargoType === "LD3" ? 110 : 136;
                          const totalWeight = (pallet.weight || 0) + baseWeight;
                          
                          return (
                            <div 
                              key={pallet.id}
                              className="border rounded p-3 hover:bg-gray-800/30 transition-colors cursor-pointer"
                              onClick={() => handlePalletClick(pallet.id, pallet.positionLabel || "")}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant={getCargoTypeBadgeVariant(pallet.cargoType)}
                                    >
                                      {pallet.cargoType || "C"}
                                    </Badge>
                                    <span className="font-bold text-white">
                                      {pallet.positionLabel || "Unassigned"}
                                    </span>
                                  </div>
                                  
                                  <div className="text-sm text-gray-300 mt-1">
                                    {pallet.cargoCategory || "Unspecified Cargo"}
                                  </div>
                                  
                                  {pallet.cargoType === "DG" && pallet.dgClass && (
                                    <div className="mt-1 flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3 text-red-500" />
                                      <span className="text-xs text-red-400">
                                        DG Class: {pallet.dgClass}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-right">
                                  <div className="font-bold text-white">
                                    {(pallet.weight || 0).toLocaleString()} kg
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    + {baseWeight} kg (base)
                                  </div>
                                  <div className="text-sm font-medium text-gray-200 mt-0.5">
                                    = {totalWeight.toLocaleString()} kg
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Pallet Input Dialog */}
      <Dialog open={palletInputOpen} onOpenChange={setPalletInputOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configure Cargo</DialogTitle>
            <DialogDescription>
              Enter cargo details for position {palletPosition}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-5 items-center gap-4">
              <Label htmlFor="weight" className="text-right col-span-2">
                Weight (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                min="0"
                max={currentAircraft.maxPalletWeight}
                value={palletWeight}
                onChange={(e) => {
                  // Check if input is a number
                  if (e.target.value === "" || /^\d+$/.test(e.target.value)) {
                    setPalletWeight(e.target.value);
                  } else {
                    // Show warning only for non-empty inputs
                    if (e.target.value !== "") {
                      toast({
                        title: "Invalid input",
                        description: "Please enter numbers only",
                        variant: "destructive",
                      });
                    }
                  }
                }}
                className="col-span-3 text-white font-bold"
              />
            </div>
            
            <div className="grid grid-cols-5 items-center gap-4">
              <Label htmlFor="cargo-type" className="text-right col-span-2">
                Cargo Type
              </Label>
              <Select
                value={palletCargoType}
                onValueChange={(value: "C" | "DG" | "LD3") => {
                  setPalletCargoType(value);
                  // Auto-set dangerous goods flag
                  setIsDangerousGoods(value === "DG");
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select cargo type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C">Standard Cargo</SelectItem>
                  <SelectItem value="DG">Dangerous Goods</SelectItem>
                  <SelectItem value="LD3">LD3 Container</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-5 items-center gap-4">
              <Label htmlFor="category" className="text-right col-span-2">
                Category
              </Label>
              <Select
                value={palletCargoCategory}
                onValueChange={setPalletCargoCategory}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select cargo category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pax Bags">Passenger Bags</SelectItem>
                  <SelectItem value="Mechanical">Mechanical Equipment</SelectItem>
                  <SelectItem value="Medical">Medical Equipment</SelectItem>
                  <SelectItem value="Perishable">Perishable Goods</SelectItem>
                  <SelectItem value="LD3 Container">LD3 Container</SelectItem>
                  <SelectItem value="Military">Military Equipment</SelectItem>
                  <SelectItem value="Humanitarian">Humanitarian Aid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Only show DG class selector when Dangerous Goods is selected */}
            {palletCargoType === "DG" && (
              <div className="grid grid-cols-5 items-center gap-4">
                <Label htmlFor="dg-class" className="text-right col-span-2">
                  DG Class
                </Label>
                <Select
                  value={palletDgClass}
                  onValueChange={setPalletDgClass}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select DG class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Class 1 - Explosives</SelectItem>
                    <SelectItem value="2">Class 2 - Gases</SelectItem>
                    <SelectItem value="3">Class 3 - Flammable Liquids</SelectItem>
                    <SelectItem value="4">Class 4 - Flammable Solids</SelectItem>
                    <SelectItem value="5">Class 5 - Oxidizing Substances</SelectItem>
                    <SelectItem value="6">Class 6 - Toxic Substances</SelectItem>
                    <SelectItem value="7">Class 7 - Radioactive Material</SelectItem>
                    <SelectItem value="8">Class 8 - Corrosive Substances</SelectItem>
                    <SelectItem value="9">Class 9 - Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                // Remove the pallet if cancel is clicked and it's a new pallet
                const pallet = pallets.find(p => p.id === editingPalletId);
                if (pallet && pallet.weight === null) {
                  deletePallet(editingPalletId);
                }
                setPalletInputOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" onClick={handlePalletInputConfirm}>
              Save Cargo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Balance Warning Dialog */}
      <Dialog open={warningPopup} onOpenChange={setWarningPopup}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              Out of Balance Warning
            </DialogTitle>
            <DialogDescription>
              The current cargo distribution is creating an unsafe balance condition.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm">
              The center of gravity value of <span className="font-bold text-red-500">{balanceCG.toFixed(1)}°</span> is 
              outside the recommended safe range.
            </p>
            <p className="text-sm mt-2">
              Consider redistributing your cargo to achieve a more balanced load.
              Aim for a center of gravity between 45° and 60° for optimal flight stability.
            </p>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setWarningPopup(false)}>
              I Understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}