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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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
  
  // State for pallets, grid, and balance
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [nextPalletId, setNextPalletId] = useState(1);
  const [balanceValue, setBalanceValue] = useState(0);
  const [balanceCG, setBalanceCG] = useState(53.00);
  const [balanceStatus, setBalanceStatus] = useState<'safe' | 'moderate' | 'warning' | 'caution'>('safe');
  
  // State for the UI elements
  const [balanceScaleWidth, setBalanceScaleWidth] = useState(0);
  const balanceScaleRef = useRef<HTMLDivElement>(null);
  const cargoRef = useRef<HTMLDivElement>(null);
  const configureRef = useRef<HTMLDivElement>(null);
  
  // State for the pallet input dialog
  const [palletInputOpen, setPalletInputOpen] = useState(false);
  const [editingPalletId, setEditingPalletId] = useState<number | null>(null);
  const [palletWeight, setPalletWeight] = useState<string>("");
  const [palletCargoType, setPalletCargoType] = useState<"C" | "DG">("C");
  const [palletPosition, setPalletPosition] = useState<string>("");
  const [palletCargoCategory, setPalletCargoCategory] = useState<string>("");
  const [palletDgClass, setPalletDgClass] = useState<string>("");
  const [isDangerousGoods, setIsDangerousGoods] = useState(false);
  
  // Alert dialog state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<'warning' | 'error'>('warning');

  // References to track drag operations
  const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
  const [draggedPalletId, setDraggedPalletId] = useState<number | null>(null);
  
  // Get aircraft grid configuration
  const getGridConfig = () => {
    const baseWidth = balanceScaleWidth || 600; // Fallback width if not measured yet
    
    if (currentAircraftId === 'c17') {
      return {
        rows: 2,
        cols: 9,
        cellWidth: baseWidth / 9,
        cellHeight: 108,
        palletWidth: (baseWidth / 9) * 0.9, // 90% of cell width
        palletHeight: 108 * 0.9,
        paddingX: 0,
        paddingY: 10
      };
    } else if (currentAircraftId === 'c130') {
      return {
        rows: 2,
        cols: 4,
        cellWidth: baseWidth / 4,
        cellHeight: 80,
        palletWidth: (baseWidth / 4) * 0.9,
        palletHeight: 80 * 0.9,
        paddingX: 0,
        paddingY: 10
      };
    } else {
      // c27j and kc30a
      return {
        rows: 1,
        cols: 3,
        cellWidth: baseWidth / 3,
        cellHeight: 90,
        palletWidth: (baseWidth / 3) * 0.9,
        palletHeight: 90 * 0.9,
        paddingX: 0,
        paddingY: 20
      };
    }
  };
  
  // Show alert dialog
  const showAlert = (type: 'warning' | 'error', title: string, message: string) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };
  
  // Handle opening the pallet configuration dialog
  const openPalletDialog = (palletId: number, position?: string) => {
    console.log(`Opening pallet dialog for ID:${palletId}, position:${position || "unset"}`);
    
    const pallet = pallets.find(p => p.id === palletId);
    
    if (pallet) {
      console.log("Found pallet:", pallet);
      setEditingPalletId(palletId);
      setPalletWeight(pallet.weight ? pallet.weight.toString() : "");
      setPalletCargoType(pallet.cargoType || "C");
      setPalletPosition(position || pallet.positionLabel || "");
      setPalletCargoCategory(pallet.cargoCategory || "");
      setPalletDgClass(pallet.dgClass || "");
      setIsDangerousGoods(pallet.cargoType === "DG");
      setPalletInputOpen(true);
    } else {
      console.log("Pallet not found:", palletId);
    }
  };
  
  // Handle pallet configuration changes
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
  
  // Handle drag and drop operations
  
  // When starting to drag a pallet
  const handleDragStart = (event: React.DragEvent, palletId: number | null) => {
    console.log("Drag started:", palletId === null ? "template" : palletId);
    
    if (palletId === null) {
      // Dragging the template pallet
      setIsDraggingTemplate(true);
      event.dataTransfer.setData("text/plain", "template");
    } else {
      // Dragging an existing pallet
      event.dataTransfer.setData("text/plain", palletId.toString());
      setDraggedPalletId(palletId);
    }
  };
  
  // Helper to allow drag over
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };
  
  // Check if a position in the cargo area is already occupied
  const isPositionOccupied = (positionLabel: string, excludePalletId?: number): boolean => {
    return pallets.some(p => 
      p.location === "cargo" && 
      p.positionLabel === positionLabel && 
      (excludePalletId === undefined || p.id !== excludePalletId)
    );
  };
  
  // Handle dropping a pallet
  const handlePalletDrop = (event: React.DragEvent, dropArea: "cargo" | "configure") => {
    event.preventDefault();
    console.log("Drop event in:", dropArea);
    
    const dataTransfer = event.dataTransfer.getData("text/plain");
    let palletId: number | null = null;
    
    if (dataTransfer === "template") {
      // Creating a new pallet from template
      setIsDraggingTemplate(false);
      palletId = nextPalletId;
      setNextPalletId(prev => prev + 1);
      
      // Create a new pallet with default values
      const config = getGridConfig();
      const newPallet: Pallet = {
        id: palletId,
        position: { x: 0, y: 0 }, // Will be positioned properly below
        location: dropArea,
        weight: null,
        size: { 
          width: config.palletWidth, 
          height: config.palletHeight 
        }
      };
      
      setPallets(prev => [...prev, newPallet]);
    } else {
      // Moving an existing pallet
      palletId = parseInt(dataTransfer);
      setDraggedPalletId(null);
    }
    
    if (palletId !== null) {
      // Get pallet to update
      const pallet = pallets.find(p => p.id === palletId);
      
      if (!pallet) {
        console.error("Pallet not found:", palletId);
        return;
      }
      
      // Get drop coordinates relative to the drop area
      const rect = dropArea === "cargo" 
        ? cargoRef.current?.getBoundingClientRect() 
        : configureRef.current?.getBoundingClientRect();
      
      if (!rect) return;
      
      const dropX = event.clientX - rect.left;
      const dropY = event.clientY - rect.top;
      
      let positionLabel = "";
      let newPosition = { x: dropX, y: dropY };
      
      if (dropArea === "cargo") {
        const gridConfig = getGridConfig();
        const { cols, rows, cellWidth, cellHeight, paddingY } = gridConfig;
        
        // Determine which grid cell the pallet was dropped in
        let row = 0;
        let col = 0;
        
        if (rows === 2) {
          // For aircraft with 2 rows (C-17, C-130)
          row = dropY > (cellHeight + paddingY) ? 1 : 0;
        }
        
        col = Math.min(cols - 1, Math.max(0, Math.floor(dropX / cellWidth)));
        
        // Calculate position label based on row and column
        let positionNumber = row === 0 ? col + 1 : col + 1 + cols;
        positionLabel = `P${positionNumber}`;
        
        // Check if the position is already occupied
        if (isPositionOccupied(positionLabel, palletId)) {
          showAlert(
            'warning',
            'Position Already Occupied',
            `Position ${positionLabel} is already occupied by another pallet. Please choose a different position.`
          );
          
          // Don't allow the drop if the position is occupied
          if (dataTransfer === "template") {
            // Remove the newly created pallet
            setPallets(prev => prev.filter(p => p.id !== palletId));
            setNextPalletId(prev => prev - 1);
          }
          return;
        }
        
        // Calculate the center of the grid cell for snapping
        const centerX = col * cellWidth + (cellWidth - pallet.size.width) / 2;
        const centerY = row * (cellHeight + paddingY) + (cellHeight - pallet.size.height) / 2 + paddingY;
        
        newPosition = { x: centerX, y: centerY };
        
        // Open the pallet input dialog when dropping in cargo area
        openPalletDialog(palletId, positionLabel);
      }
      
      // Update the pallet's position and area
      setPallets(prev => prev.map(p => {
        if (p.id === palletId) {
          return {
            ...p,
            position: newPosition,
            location: dropArea,
            positionLabel: dropArea === "cargo" ? positionLabel : undefined
          };
        }
        return p;
      }));
    }
  };
  
  // Handle clicking on a pallet in the cargo area
  const handlePalletClick = (event: React.MouseEvent, pallet: Pallet) => {
    console.log("Pallet clicked:", pallet);
    event.stopPropagation();
    
    // Only handle clicks for pallets in the cargo area
    if (pallet.location === "cargo") {
      openPalletDialog(pallet.id, pallet.positionLabel);
    }
  };
  
  // Reset all pallets
  const handleReset = () => {
    setPallets([]);
    setNextPalletId(1);
    setBalanceValue(0);
    setBalanceCG(53.00);
    setBalanceStatus('safe');
  };
  
  // Calculate balance based on pallet positions and weights
  useEffect(() => {
    const cargoPallets = pallets.filter(p => p.location === "cargo");
    
    // If no pallets in cargo or no weight, reset balance
    if (cargoPallets.length === 0 || !cargoPallets.some(p => p.weight !== null)) {
      setBalanceValue(0);
      setBalanceCG(53);
      setBalanceStatus('safe');
      return;
    }
    
    let totalWeightMoment = 0;
    let totalWeight = 0;
    
    // Get cargo area width for position normalization
    const cargoWidth = cargoRef.current?.clientWidth || 800;
    
    console.log("Calculating balance for", cargoPallets.length, "pallets");
    
    cargoPallets.forEach(pallet => {
      if (pallet.weight === null) return;
      
      // Extract position number from pallet label (e.g., 'P2' => 2)
      let positionNumber = 0;
      if (pallet.positionLabel && pallet.positionLabel.startsWith('P')) {
        positionNumber = parseInt(pallet.positionLabel.substring(1)) - 1; // 0-based index
      }
      
      // Normalize position to -1 to 1 range (-1 = fully forward, 1 = fully aft)
      let normalizedPosition = 0;
      const config = getGridConfig();
      
      if (currentAircraftId === 'c17') {
        // For C-17 with 9x2 layout
        const row = positionNumber >= 9 ? 1 : 0;
        const col = row === 0 ? positionNumber : positionNumber - 9;
        
        // Create a gradual progression from forward to aft
        normalizedPosition = -1 + (row * 9 + col) / (9 * 2 - 1) * 2;
      } else if (currentAircraftId === 'c130') {
        // For C-130 with 4x2 layout
        const row = positionNumber >= 4 ? 1 : 0;
        const col = row === 0 ? positionNumber : positionNumber - 4;
        
        normalizedPosition = -1 + (row * 4 + col) / (4 * 2 - 1) * 2;
      } else {
        // For C-27J and KC30-A with 3x1 layout
        normalizedPosition = -1 + positionNumber / (3 - 1) * 2;
      }
      
      // Calculate moment (weight * position)
      totalWeightMoment += pallet.weight * normalizedPosition;
      totalWeight += pallet.weight;
    });
    
    // Calculate balance value (-100 to 100)
    let balance = 0;
    if (totalWeight > 0) {
      // Normalize to -100 to 100 range
      balance = (totalWeightMoment / totalWeight) * 100;
    }
    
    setBalanceValue(balance);
    
    // Calculate Centre of Gravity value (18-88 degrees)
    // Map from -100:100 to 18:88 (70 degree range) with 2 decimal precision
    const cgExact = ((balance + 100) / 200) * 70 + 18;
    const cg = parseFloat(cgExact.toFixed(2));
    setBalanceCG(cg);
    
    // Determine balance status
    if (Math.abs(balance) < 20) {
      setBalanceStatus('safe'); // Green center zone
    } else if (Math.abs(balance) < 40) {
      setBalanceStatus('moderate'); // Yellow-green zone
    } else if (Math.abs(balance) < 60) {
      setBalanceStatus('warning'); // Amber zone
    } else {
      setBalanceStatus('caution'); // Orange zone
    }
  }, [pallets, currentAircraftId]);
  
  // Measure the balance scale width on mount and resize
  useEffect(() => {
    const updateBalanceScaleWidth = () => {
      if (balanceScaleRef.current) {
        const width = balanceScaleRef.current.offsetWidth;
        setBalanceScaleWidth(width);
      }
    };
    
    updateBalanceScaleWidth();
    
    const resizeObserver = new ResizeObserver(updateBalanceScaleWidth);
    if (balanceScaleRef.current) {
      resizeObserver.observe(balanceScaleRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Navigation helper
  const handleBackClick = () => {
    navigate("/load-planning");
  };
  
  // Get constants for current aircraft
  const MAX_PAYLOAD = currentAircraft.maxPayload;
  const MAX_PALLET_WEIGHT = currentAircraft.maxPalletWeight;
  
  // Grid configuration for rendering
  const gridConfig = getGridConfig();
  
  // Calculate total weight
  const totalCargoWeight = pallets
    .filter(p => p.location === "cargo" && p.weight !== null)
    .reduce((sum, p) => sum + (p.weight || 0), 0);
  
  // Calculate weight as percentage of max payload
  const weightPercentage = Math.min(100, (totalCargoWeight / MAX_PAYLOAD) * 100);
  
  // Generate grid cells and pallets
  const renderGrid = () => {
    const { rows, cols, cellWidth, cellHeight, paddingY } = gridConfig;
    
    const grid = [];
    
    // Create grid cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const positionNumber = row === 0 ? col + 1 : col + 1 + cols;
        const positionLabel = `P${positionNumber}`;
        
        // Check if a pallet is assigned to this position
        const assignedPallet = pallets.find(p => 
          p.location === "cargo" && p.positionLabel === positionLabel
        );
        
        // Determine cell styling
        const cellStyle = {
          left: col * cellWidth,
          top: row * (cellHeight + paddingY) + paddingY,
          width: cellWidth,
          height: cellHeight,
          backgroundColor: assignedPallet 
            ? 'rgba(234, 88, 12, 0.7)'  // Orange for occupied
            : 'rgba(20, 83, 45, 0.15)', // Green for empty
          border: assignedPallet
            ? '2px solid #ea580c'   // Orange border for occupied
            : '2px solid #155e35',  // Green border for empty
          position: 'absolute' as const,
          borderRadius: '0.125rem',
          zIndex: assignedPallet ? 10 : 1,
          cursor: assignedPallet ? 'pointer' : 'default'
        };
        
        grid.push(
          <div 
            key={`cell-${row}-${col}`}
            style={cellStyle}
            draggable={!!assignedPallet}
            onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
            onClick={assignedPallet ? (e) => handlePalletClick(e, assignedPallet) : undefined}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Show position label if empty */}
              {!assignedPallet && (
                <div className="text-white/50 font-bold text-xl">
                  {positionLabel}
                </div>
              )}
              
              {/* Show weight if occupied */}
              {assignedPallet && (
                <div className="flex-1 flex flex-col items-center justify-center text-white font-bold">
                  {assignedPallet.weight !== null ? 
                    <span>{assignedPallet.weight} kg</span> : 
                    <span className="text-white/80">No weight</span>
                  }
                </div>
              )}
              
              {/* Show cargo type badge if occupied */}
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
    }
    
    return grid;
  };
  
  return (
    <>
      <Helmet>
        <title>{currentAircraft.name} Load Planning - LOADMdocs</title>
        <meta 
          name="description" 
          content={`Plan cargo loading for the ${currentAircraft.name}. Configure pallets and track weight distribution.`} 
        />
      </Helmet>
      
      {/* Alert Dialog */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {alertType === 'error' ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-warning" />
              )}
              {alertTitle}
            </DialogTitle>
            <DialogDescription>
              {alertMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setAlertOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Pallet Input Dialog */}
      <Dialog open={palletInputOpen} onOpenChange={setPalletInputOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configure Pallet</DialogTitle>
            <DialogDescription>
              Enter weight and cargo details for this pallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="weight" className="text-right">
                Weight (kg)
              </Label>
              <div className="col-span-2">
                <Input
                  id="weight"
                  type="number"
                  value={palletWeight}
                  onChange={(e) => setPalletWeight(e.target.value)}
                  placeholder="Enter weight"
                  min="0"
                  max={MAX_PALLET_WEIGHT}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-right">Cargo Type</Label>
              <div className="col-span-2 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="cargo-normal"
                    checked={!isDangerousGoods}
                    onChange={() => setIsDangerousGoods(false)}
                  />
                  <Label htmlFor="cargo-normal">Normal Cargo (C)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="cargo-dg"
                    checked={isDangerousGoods}
                    onChange={() => setIsDangerousGoods(true)}
                  />
                  <Label htmlFor="cargo-dg">Dangerous Goods (DG)</Label>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="cargo-category" className="text-right">
                Cargo Category
              </Label>
              <div className="col-span-2">
                <Select
                  value={palletCargoCategory}
                  onValueChange={setPalletCargoCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cargo category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pax Bags">Pax Bags</SelectItem>
                    <SelectItem value="Mechanical">Mechanical</SelectItem>
                    <SelectItem value="Medical Equipment">Medical Equipment</SelectItem>
                    <SelectItem value="Perishable">Perishable</SelectItem>
                    <SelectItem value="Military Equipment">Military Equipment</SelectItem>
                    <SelectItem value="Humanitarian Aid">Humanitarian Aid</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="dg-class" className="text-right">
                DG Class
              </Label>
              <div className="col-span-2">
                <Select
                  value={palletDgClass}
                  onValueChange={setPalletDgClass}
                  disabled={!isDangerousGoods}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select DG class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Class 1 - Explosives</SelectItem>
                    <SelectItem value="2">Class 2 - Gases</SelectItem>
                    <SelectItem value="3">Class 3 - Flammable Liquids</SelectItem>
                    <SelectItem value="4">Class 4 - Flammable Solids</SelectItem>
                    <SelectItem value="5">Class 5 - Oxidizers</SelectItem>
                    <SelectItem value="6">Class 6 - Toxic Substances</SelectItem>
                    <SelectItem value="7">Class 7 - Radioactive Materials</SelectItem>
                    <SelectItem value="8">Class 8 - Corrosives</SelectItem>
                    <SelectItem value="9">Class 9 - Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
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
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Grid: Balance Information + Cargo Area */}
            <Card className="lg:col-span-9">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Scale className="h-5 w-5 mr-2 text-primary" />
                  Weight and Balance
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {totalCargoWeight.toLocaleString()} / {MAX_PAYLOAD.toLocaleString()} kg ({weightPercentage.toFixed(1)}%)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Weight Indicator */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Weight</span>
                    <span>{totalCargoWeight.toLocaleString()} kg</span>
                  </div>
                  <Progress value={weightPercentage} className="h-2" />
                </div>
                
                {/* Information Boxes */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-md p-3 relative w-1/2 bg-background border border-border">
                    <p className="text-xs font-medium">Pallets</p>
                    <p className="text-lg font-semibold">
                      {pallets.filter(p => p.location === "cargo").length} of {
                        currentAircraftId === 'c17' ? '18' : 
                        currentAircraftId === 'c130' ? '8' : '3'
                      }
                    </p>
                  </div>
                  <div className="rounded-md p-3 relative w-1/2 bg-background border border-border">
                    <p className="text-xs font-medium">Centre of Gravity</p>
                    <p className="flex items-center gap-2">
                      <span style={{ 
                        color: Math.abs(balanceValue) < 20 ? '#22c55e' : // Green center
                              Math.abs(balanceValue) < 40 ? '#84cc16' : // Light green/yellow-green
                              Math.abs(balanceValue) < 60 ? '#f59e0b' : // Amber
                              '#ea580c', // Orange
                        fontWeight: 600,
                        fontSize: '1.8rem'
                      }}>{balanceCG.toFixed(2)}°</span>
                      <span className="inline-block w-2 h-2 rounded-full" style={{
                        backgroundColor: Math.abs(balanceValue) < 20 ? '#22c55e' : // Green
                                        Math.abs(balanceValue) < 40 ? '#84cc16' : // Yellow-green
                                        Math.abs(balanceValue) < 60 ? '#f59e0b' : // Amber
                                        '#ea580c' // Orange
                      }}></span>
                    </p>
                  </div>
                </div>
                
                {/* Cargo Area - Main grid for pallets */}
                <Card className="mb-6">
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
                      className="relative"
                      style={{
                        width: `${balanceScaleWidth}px`,
                        height: currentAircraftId === 'c17' 
                                ? '320px' 
                                : currentAircraftId === 'c130' 
                                  ? '220px' 
                                  : '150px',
                        maxWidth: '100%',
                        margin: '0 auto',
                        background: 'rgba(0, 0, 0, 0.05)'
                      }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handlePalletDrop(e, "cargo")}
                    >
                      {/* Render grid cells */}
                      {renderGrid()}
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      Drag pallets here to position them in the cargo area.
                    </div>
                  </CardContent>
                </Card>
                
                {/* Balance Indicator */}
                <div>
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
                    {/* Container for the gradient background */}
                    <div className="absolute inset-0 overflow-hidden" style={{ 
                      background: 'linear-gradient(to right, #ea580c 0%, #f59e0b 20%, #84cc16 40%, #22c55e 50%, #84cc16 60%, #f59e0b 80%, #ea580c 100%)'
                    }}></div>
                    
                    {/* Indicator needle */}
                    <div 
                      className="absolute shadow-md"
                      style={{ 
                        backgroundColor: '#40C4D9', // Light blue/teal color
                        width: '1px',
                        left: `${(balanceValue + 100) / 2}%`,
                        top: '-50%', // Extends 50% above
                        height: '200%', // Extends 50% below
                        transform: 'translateX(-50%)',
                        transition: 'left 0.3s ease-out',
                        zIndex: 10,
                        boxShadow: '0px 0px 3px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      {/* Current CG value above the needle */}
                      <div 
                        className="absolute -top-6 left-1/2 transform -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          backgroundColor: 'rgba(64, 196, 217, 0.9)', // Matching needle color
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
                  <div className="relative h-10">
                    {[18, 23, 28, 33, 38, 43, 48, 53, 58, 63, 68, 73, 78, 83, 88].map((value, i) => {
                      const position = (i / 14) * 100;
                      const isMajorTick = i % 3 === 0;
                      const isEndpoint = i === 0 || i === 14;
                      
                      return (
                        <div key={`tick-${i}`}>
                          {/* Tick mark */}
                          <div 
                            className={`absolute top-0 ${isMajorTick ? 'w-0.5' : 'w-px'} ${isMajorTick ? 'bg-gray-500' : 'bg-gray-400'}`}
                            style={{ 
                              left: `${position}%`,
                              height: isMajorTick ? '8px' : '5px'
                            }}
                          ></div>
                          
                          {/* Label (only on major ticks or endpoints) */}
                          {(isMajorTick || isEndpoint) && (
                            <div 
                              className={`absolute text-[9px] ${isEndpoint ? 'font-bold' : 'font-medium'} ${isEndpoint ? 'text-gray-600' : 'text-gray-500'}`}
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
                    <div className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 text-[9px] text-gray-500 whitespace-nowrap">
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
                      className="w-full flex items-center justify-center" 
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
                  </p>
                  
                  {/* Draggable template pallet */}
                  <div 
                    className="rounded p-4 flex items-center justify-center bg-orange-500/70 border-2 border-orange-500 cursor-move"
                    style={{ 
                      width: gridConfig.palletWidth,
                      height: gridConfig.palletHeight
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
                <div 
                  className="space-y-4 h-[400px] overflow-y-auto pr-2" 
                  ref={configureRef} 
                  onDragOver={handleDragOver} 
                  onDrop={(e) => handlePalletDrop(e, "configure")}
                >
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
                                onChange={(e) => {
                                  // Allow empty string to clear weight
                                  if (e.target.value === '') {
                                    setPallets(prev => prev.map(p => {
                                      if (p.id === pallet.id) {
                                        return { ...p, weight: null };
                                      }
                                      return p;
                                    }));
                                    return;
                                  }
                                  
                                  // Convert to number or default to 0 if invalid
                                  let weightValue = parseInt(e.target.value) || 0;
                                  
                                  // Update pallet weight
                                  setPallets(prev => prev.map(p => {
                                    if (p.id === pallet.id) {
                                      return { ...p, weight: weightValue };
                                    }
                                    return p;
                                  }));
                                }}
                                className={`h-7 text-sm`}
                                placeholder="Enter weight"
                              />
                            </div>
                            <div className="ml-1 text-xs text-muted-foreground">kg</div>
                          </div>
                        </div>
                        
                        {/* Edit button */}
                        <div className="mt-3 flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-7"
                            onClick={() => openPalletDialog(pallet.id)}
                          >
                            Edit Details
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}