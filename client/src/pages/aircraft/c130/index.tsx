import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, Package2, RefreshCw, AlertCircle, AlertTriangle, X, Plane, MessagesSquare } from "lucide-react";
import { useLocation } from "wouter";
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
import { KC30AGrid } from "@/components/aircraft-grids";
import { getAircraftGridConfig, calculateBalance, isBalanceAtOrBeyondLimits } from "@/utils/aircraft-config";
import BalanceIndicator from "@/components/BalanceIndicator";

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

export default function C130LoadPlanningPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // Aircraft configuration - C-130
  const aircraftConfig = {
    id: 'c130',
    name: 'Hercules C-130',
    maxPayload: 20000, // kg
    maxPalletWeight: 4536, // kg (10,000 lbs)
  };
  
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
  
  // Generate drop zones for KC30-A but with C-130 configuration (using the KC30A grid but with C-130 data)
  const generateDropZones = (): DropZone[] => {
    // KC30-A - 26 slots (13 wide x 2 high) with 14 forward and 12 aft - reusing this grid for C-130 simulation
    const cargoZones: DropZone[] = [];
    
    // Calculate grid cell dimensions - use KC30A grid config to match visual layout
    const config = getAircraftGridConfig();
    const cellWidth = config.cellWidth;
    const cellHeight = config.cellHeight;
    
    // First row - 13 positions
    for (let i = 0; i < 13; i++) {
      cargoZones.push({
        id: i + 1,
        position: { x: i * cellWidth, y: 14 },
        occupied: false,
        area: "cargo"
      });
    }
    
    // Second row - 13 positions
    for (let i = 0; i < 13; i++) {
      cargoZones.push({
        id: i + 14, // IDs 14-26
        position: { x: i * cellWidth, y: 94 },
        occupied: false,
        area: "cargo"
      });
    }
    
    return cargoZones;
  };
  
  // Drop zones for the cargo area
  const [dropZones, setDropZones] = useState<DropZone[]>(generateDropZones());
  
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
  const [palletCargoType, setPalletCargoType] = useState<"C" | "DG">("C"); // C = Normal Cargo, DG = Dangerous Goods
  const [palletPosition, setPalletPosition] = useState<string>("");
  const [palletCargoCategory, setPalletCargoCategory] = useState<string>("");
  const [palletDgClass, setPalletDgClass] = useState<string>("");
  const [isDangerousGoods, setIsDangerousGoods] = useState(false);
  
  // Chat interface visibility
  const [isChatVisible, setIsChatVisible] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  
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
    event.preventDefault(); // Prevent default behavior
    event.stopPropagation(); // Prevent event bubbling
    
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
  
  // Handle pallet input confirmation
  const handlePalletInputConfirm = () => {
    if (!editingPalletId) return;
    
    // Get constants for current aircraft
    const MAX_PAYLOAD = aircraftConfig.maxPayload;
    const MAX_PALLET_WEIGHT = aircraftConfig.maxPalletWeight;
    
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
            <span className="text-lg">{pallet.weight + PALLET_BASE_WEIGHT} kg</span>
            <span className="text-xs text-muted-foreground">(includes 136kg base)</span>
          </>
        ) : (
          <span className="text-muted-foreground">No Weight</span>
        )}
      </div>
    );
  };
  
  // Handle drop zone click to add a new pallet
  const handleDropZoneClick = (e: React.MouseEvent, zoneId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If zone is occupied or there is no pallet being dragged, do nothing
    if (dropZones.find(z => z.id === zoneId)?.occupied) return;
    
    // Find the drop zone to get its position
    const targetZone = dropZones.find(z => z.id === zoneId);
    if (!targetZone) return;
    
    // Create a new pallet at the position of the drop zone
    const { cellWidth, cellHeight } = getAircraftGridConfig();
    
    // Position label like P1, P2, etc.
    const positionLabel = `P${zoneId}`;
    
    // Check if this position is already occupied
    if (isPositionOccupied(positionLabel)) {
      showAlert('warning', 'Position Occupied', `Position ${positionLabel} already has a pallet assigned.`);
      return;
    }
    
    // Create a new pallet with base dimensions
    const newPallet: Pallet = {
      id: nextPalletId,
      position: targetZone.position,
      location: "cargo",
      weight: null, // Initially no weight
      size: { 
        width: cellWidth * 0.9, 
        height: cellHeight * 0.9 
      },
      positionLabel,
      cargoType: "C",
      containerType: "pallet"
    };
    
    // Add the new pallet
    setPallets([...pallets, newPallet]);
    setNextPalletId(nextPalletId + 1);
    
    // Mark the drop zone as occupied
    setDropZones(dropZones.map(z => 
      z.id === zoneId ? { ...z, occupied: true } : z
    ));
    
    // Show pallet configuration dialog to set weight
    setEditingPalletId(nextPalletId);
    setPalletWeight("");
    setPalletCargoType("C");
    setPalletPosition(positionLabel);
    setPalletCargoCategory("");
    setPalletDgClass("");
    setIsDangerousGoods(false);
    setPalletInputOpen(true);
  };
  
  // Handle click on pallet in storage/configuration area - this will delete the pallet
  const handleConfigurePalletClick = (id: number) => {
    // Remove the pallet
    setPallets(pallets.filter(p => p.id !== id));
    
    // If the pallet was in a drop zone, mark that zone as unoccupied
    const pallet = pallets.find(p => p.id === id);
    if (pallet && pallet.positionLabel) {
      const zoneId = parseInt(pallet.positionLabel.replace('P', ''));
      setDropZones(dropZones.map(z => 
        z.id === zoneId ? { ...z, occupied: false } : z
      ));
    }
  };
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', id.toString());
    setDraggedPallet(id);
  };
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // Handle drag template start - for creating new pallets
  const handleDragTemplateStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', 'template');
    setIsDraggingTemplate(true);
  };
  
  // Handle drop on cargo area
  const handleDropOnCargo = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Get drop coordinates
    const rect = cargoRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find the closest drop zone
    let closestZone: DropZone | null = null;
    let minDistance = Infinity;
    
    dropZones.forEach(zone => {
      if (zone.area === "cargo") { // Only consider cargo area zones
        const dx = zone.position.x - x;
        const dy = zone.position.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestZone = zone;
        }
      }
    });
    
    // If found a close drop zone and it's not occupied
    if (closestZone && !closestZone.occupied) {
      const dataId = e.dataTransfer.getData('text/plain');
      
      // Check if we're creating a new pallet from template
      if (dataId === 'template' || isDraggingTemplate) {
        // Position label like P1, P2, etc.
        const positionLabel = `P${closestZone.id}`;
        
        // Check if this position is already occupied
        if (isPositionOccupied(positionLabel)) {
          showAlert('warning', 'Position Occupied', `Position ${positionLabel} already has a pallet assigned.`);
          setIsDraggingTemplate(false);
          return;
        }
        
        // Get configuration for grid sizing
        const { cellWidth, cellHeight } = getAircraftGridConfig();
        
        // Create a new pallet with base dimensions
        const newPallet: Pallet = {
          id: nextPalletId,
          position: closestZone.position,
          location: "cargo",
          weight: null, // Initially no weight
          size: { 
            width: cellWidth * 0.9, 
            height: cellHeight * 0.9 
          },
          positionLabel,
          cargoType: "C",
          containerType: "pallet"
        };
        
        // Add the new pallet
        setPallets([...pallets, newPallet]);
        setNextPalletId(nextPalletId + 1);
        
        // Mark the drop zone as occupied
        setDropZones(dropZones.map(z => 
          z.id === closestZone!.id ? { ...z, occupied: true } : z
        ));
        
        // Show pallet configuration dialog to set weight
        setEditingPalletId(nextPalletId);
        setPalletWeight("");
        setPalletCargoType("C");
        setPalletPosition(positionLabel);
        setPalletCargoCategory("");
        setPalletDgClass("");
        setIsDangerousGoods(false);
        setPalletInputOpen(true);
      }
      // Otherwise we're moving an existing pallet
      else if (dataId && !isNaN(parseInt(dataId))) {
        const palletId = parseInt(dataId);
        const movedPallet = pallets.find(p => p.id === palletId);
        
        if (movedPallet) {
          // Position label like P1, P2, etc.
          const positionLabel = `P${closestZone.id}`;
          
          // Check if this position is already occupied by another pallet
          if (isPositionOccupied(positionLabel, palletId)) {
            showAlert('warning', 'Position Occupied', `Position ${positionLabel} already has a pallet assigned.`);
            return;
          }
          
          // Get current position if any
          let previousZoneId = -1;
          if (movedPallet.positionLabel) {
            previousZoneId = parseInt(movedPallet.positionLabel.replace('P', ''));
          }
          
          // Update pallet position
          setPallets(pallets.map(p => {
            if (p.id === palletId) {
              return { 
                ...p, 
                position: closestZone!.position,
                location: "cargo",
                positionLabel
              };
            }
            return p;
          }));
          
          // Mark new zone as occupied and previous zone as unoccupied
          setDropZones(dropZones.map(z => {
            if (z.id === closestZone!.id) {
              return { ...z, occupied: true };
            } 
            else if (z.id === previousZoneId) {
              return { ...z, occupied: false };
            }
            return z;
          }));
        }
      }
    }
    
    // Reset drag state
    setDraggedPallet(null);
    setIsDraggingTemplate(false);
  };
  
  // Calculate cargo width for proper display
  const cargoWidth = balanceScaleWidth; // Automatically sized based on balance scale
  
  // Update balance calculations when pallets change
  useEffect(() => {
    // Calculate the total weight of all pallets with weight
    const newTotalWeight = pallets
      .filter(p => p.location === "cargo" && p.weight !== null)
      .reduce((sum, p) => sum + (p.weight || 0) + PALLET_BASE_WEIGHT, 0);
    
    setTotalWeight(newTotalWeight);
    
    // Calculate the balance (center of gravity) based on pallet positions and weights
    const { balanceValue, balanceCG, status } = calculateBalance(pallets, cargoWidth);
    
    setBalanceValue(balanceValue);
    setBalanceCG(balanceCG);
    setBalanceStatus(status);
    
    // Show warning if balance is beyond safe limits
    const isBalanceBeyondLimits = isBalanceAtOrBeyondLimits(balanceCG);
    
    if ((status === 'warning' || status === 'caution' || isBalanceBeyondLimits) && 
        newTotalWeight > 1000 && !warningPopup) {
      // Only show warning if we have a meaningful weight loaded and the warning wasn't shown yet
      setWarningPopup(true);
    } else if (status === 'safe' && warningPopup) {
      // Clear warning when balance returns to safe zone
      setWarningPopup(false);
    }
  }, [pallets, cargoWidth]);
  
  // Reset all pallets to initial state
  const handleReset = () => {
    // Clear all pallets and reset state
    setPallets([]);
    setNextPalletId(1);
    setDropZones(generateDropZones());
    
    // Reset balance values to default
    setBalanceValue(0);
    setBalanceCG(53.00); // Reset to default CG value (middle of 18-88 range)
    setBalanceStatus('safe');
    setWarningPopup(false);
  };
  
  // Helper for navigating back to aircraft selection
  const handleBackClick = () => {
    navigate('/load-planning');
  };
  
  // Toggle cargo balance assistant visibility
  const toggleChatVisibility = () => {
    setIsChatVisible(!isChatVisible);
    
    // Scroll to chat section when opening
    if (!isChatVisible && chatRef.current) {
      // Delay scroll to allow UI to update
      setTimeout(() => {
        chatRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };
  
  // Get constants for current aircraft
  const MAX_PAYLOAD = aircraftConfig.maxPayload;
  const MAX_PALLET_WEIGHT = aircraftConfig.maxPalletWeight;
  
  return (
    <>
      <Helmet>
        <title>Load Planning - {aircraftConfig.name} | LOADMworkflow</title>
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">
                Position
              </Label>
              <Input
                id="position"
                value={palletPosition}
                readOnly
                className="col-span-3 bg-muted cursor-not-allowed"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weight" className="text-right">
                Weight (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                placeholder="Enter weight in kg"
                value={palletWeight}
                onChange={(e) => setPalletWeight(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label htmlFor="isDG">Dangerous Goods</Label>
              </div>
              <div className="flex items-center space-x-2 col-span-3">
                <Checkbox 
                  id="isDG" 
                  checked={isDangerousGoods} 
                  onCheckedChange={(checked) => {
                    setIsDangerousGoods(checked === true);
                    if (checked === true) {
                      setPalletCargoType("DG");
                    } else {
                      setPalletCargoType("C");
                      setPalletDgClass("");
                    }
                  }}
                />
                <label
                  htmlFor="isDG"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  This pallet contains dangerous goods
                </label>
              </div>
            </div>
            
            {isDangerousGoods && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dgClass" className="text-right">
                  DG Class
                </Label>
                <Select value={palletDgClass} onValueChange={setPalletDgClass}>
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
                    <SelectItem value="8">Class 8 - Corrosives</SelectItem>
                    <SelectItem value="9">Class 9 - Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Cargo Type
              </Label>
              <Select 
                value={palletCargoCategory} 
                onValueChange={setPalletCargoCategory}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select cargo type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pax Bags">Passenger Bags</SelectItem>
                  <SelectItem value="Military Equipment">Military Equipment</SelectItem>
                  <SelectItem value="Medical Supplies">Medical Supplies</SelectItem>
                  <SelectItem value="Food & Water">Food & Water</SelectItem>
                  <SelectItem value="Mechanical Parts">Mechanical Parts</SelectItem>
                  <SelectItem value="Vehicles">Vehicles/Transport</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="General Cargo">General Cargo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPalletInputOpen(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button type="submit" onClick={handlePalletInputConfirm}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Warning Alert */}
      {warningPopup && (
        <Alert 
          variant="destructive" 
          className="mb-4 mx-auto max-w-4xl sticky top-4 z-50 bg-card border-orange-500"
        >
          <AlertTriangleIcon className="h-4 w-4 text-orange-500" />
          <AlertTitle>Balance Warning</AlertTitle>
          <AlertDescription>
            The current cargo distribution is {balanceStatus === 'warning' ? 'significantly' : 'dangerously'} unbalanced. 
            Consider redistributing the weight more evenly.
            <div className="mt-2">
              <Button 
                variant="outline" 
                className="h-8 text-xs" 
                onClick={() => setWarningPopup(false)}
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="container mx-auto pb-20 pt-4">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header with Back Button and Aircraft Info */}
          <div className="flex items-center mb-6">
            <Button
              variant="outline" 
              size="sm" 
              className="mr-4"
              onClick={handleBackClick}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{aircraftConfig.name} Load Planning</h2>
              <p className="text-muted-foreground text-sm">
                Max Payload: {MAX_PAYLOAD.toLocaleString()} kg | Max Pallet Weight: {MAX_PALLET_WEIGHT.toLocaleString()} kg
              </p>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Balance Indicator and Controls - Left Column */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Scale className="h-5 w-5 mr-2 text-primary" />
                  Cargo Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Balance Indicator Component */}
                <div ref={balanceScaleRef}>
                  <BalanceIndicator 
                    balanceValue={balanceValue} 
                    balanceCG={balanceCG}
                    balanceStatus={balanceStatus}
                  />
                </div>
                
                {/* Balance Status and Weight */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <Card className="col-span-1 p-2 flex flex-col items-center">
                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                    <Badge 
                      className={`mt-1 ${
                        balanceStatus === 'safe' ? 'bg-green-500' : 
                        balanceStatus === 'moderate' ? 'bg-yellow-400' : 
                        balanceStatus === 'warning' ? 'bg-orange-500' : 
                        'bg-red-500'
                      }`}
                    >
                      {balanceStatus.charAt(0).toUpperCase() + balanceStatus.slice(1)}
                    </Badge>
                  </Card>
                  
                  <Card className="col-span-1 p-2 flex flex-col items-center">
                    <span className="text-sm font-medium text-muted-foreground">CG Value</span>
                    <span className="text-lg font-bold">{balanceCG.toFixed(2)}°</span>
                  </Card>
                  
                  <Card className="col-span-1 p-2 flex flex-col items-center">
                    <span className="text-sm font-medium text-muted-foreground">Total Weight</span>
                    <span className="text-lg font-bold">{totalWeight.toLocaleString()} kg</span>
                  </Card>
                </div>
                
                {/* Load Percentage */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Load Capacity</span>
                    <span>{Math.min(100, Math.round((totalWeight / MAX_PAYLOAD) * 100))}%</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (totalWeight / MAX_PAYLOAD) * 100)} 
                    className="h-2"
                  />
                </div>
                
                {/* Controls */}
                <div className="mt-6 flex flex-col md:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleReset}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset All
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={toggleChatVisibility}
                  >
                    <MessagesSquare className="mr-2 h-4 w-4" />
                    {isChatVisible ? 'Hide Assistant' : 'Cargo Balance Assistant'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Cargo Area and Configuration - Right Column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Cargo Area - Where pallets are loaded */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Plane className="h-5 w-5 mr-2 text-primary" />
                    C-130 Cargo Area
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (Click or drag pallets to position)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    ref={cargoRef}
                    className="bg-blue-950/20 border border-blue-900/40 rounded-md p-4 min-h-[220px] relative"
                    onDragOver={handleDragOver}
                    onDrop={handleDropOnCargo}
                  >
                    {/* Aircraft Grid - KC30-A only (using same grid for C-130 to simplify) */}
                    <div className="absolute inset-0">
                      {/* Grid cells for C-130 (using KC30A component) */}
                      <KC30AGrid
                        config={getAircraftGridConfig()}
                        pallets={pallets}
                        onPalletCellClick={handlePalletCellClick}
                        onDragStart={handleDragStart}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Configure Pallets - Always on the right */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Package2 className="h-5 w-5 mr-2 text-primary" />
                    Configure Pallets
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (Max: 8)
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
                      Drag template pallet to cargo area or click empty position
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Draggable template pallet */}
                      <div 
                        className="border-2 border-primary rounded p-3 flex items-center cursor-move"
                        draggable
                        onDragStart={handleDragTemplateStart}
                      >
                        <div className="w-12 h-10 bg-primary/20 border border-primary/40 rounded mr-3 flex items-center justify-center">
                          <Package2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">Add Pallet</div>
                          <div className="text-xs text-muted-foreground">Drag or click to place</div>
                        </div>
                      </div>
                      
                      {/* Instructions */}
                      <div className="text-sm text-muted-foreground">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Drag to position pallet</li>
                          <li>Click on pallet to edit weight</li>
                          <li>Click on position to add pallet</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Cargo Balance Assistant */}
          {isChatVisible && (
            <div ref={chatRef} className="mt-8">
              <Card className="bg-card/95 backdrop-blur-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center">
                    <MessagesSquare className="h-5 w-5 mr-2 text-primary" />
                    Cargo Balance Assistant
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => setIsChatVisible(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <LoadBalanceChat 
                    pallets={pallets.filter(p => p.location === "cargo")}
                    balanceValue={balanceValue}
                    balanceCG={balanceCG}
                    aircraftType={aircraftConfig.name}
                    hasInteracted={isChatVisible}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}