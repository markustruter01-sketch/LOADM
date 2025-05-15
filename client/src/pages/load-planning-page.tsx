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
  location: "cargo" | "storage" | "configure";
  weight: number | null;
  size: { width: number; height: number };
}

interface DropZone {
  id: number;
  position: { x: number; y: number };
  occupied: boolean;
  area: "cargo" | "storage" | "configure";
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
  
  // Generate drop zones based on aircraft type
  const generateDropZones = (aircraftId: string): DropZone[] => {
    // Common drop zone creation function
    const createDropZones = (count: number, areaType: "cargo" | "storage", startX: number, startY: number, spacingX: number) => {
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
        const cellWidth = 80;  // Width of each grid cell
        const cellHeight = 90; // Height of each grid cell
        const startX = 30;     // Starting X position
        const startY1 = 30;    // Starting Y position for first row
        const startY2 = 150;   // Starting Y position for second row
        
        // Create first row of 9 cargo positions
        for (let i = 0; i < 9; i++) {
          c17CargoZones.push({
            id: i + 1,
            position: { x: startX + (i * cellWidth), y: startY1 },
            occupied: false,
            area: "cargo"
          });
        }
        
        // Create second row of 9 cargo positions
        for (let i = 0; i < 9; i++) {
          c17CargoZones.push({
            id: i + 10, // IDs 10-18
            position: { x: startX + (i * cellWidth), y: startY2 },
            occupied: false,
            area: "cargo"
          });
        }
        
        // Storage zones
        const c17StorageZones = createDropZones(18, "storage", 40, 250, 60);
        return [...c17CargoZones, ...c17StorageZones];
        
      case 'c130':
        // C-130 Hercules - 8 slots
        const c130CargoZones = createDropZones(8, "cargo", 60, 60, 90);
        const c130StorageZones = createDropZones(8, "storage", 60, 150, 90);
        return [...c130CargoZones, ...c130StorageZones];
        
      default:
        // C-27J Spartan (default) - 3 slots
        return [
          // Cargo area - where the pallets are loaded for transport
          { id: 1, position: { x: 80, y: 60 }, occupied: false, area: "cargo" },
          { id: 2, position: { x: 160, y: 60 }, occupied: false, area: "cargo" },
          { id: 3, position: { x: 240, y: 60 }, occupied: false, area: "cargo" },
          
          // Storage area - temporary holding area
          { id: 4, position: { x: 80, y: 60 }, occupied: false, area: "storage" },
          { id: 5, position: { x: 160, y: 60 }, occupied: false, area: "storage" },
          { id: 6, position: { x: 240, y: 60 }, occupied: false, area: "storage" },
        ];
    }
  };
  
  // Drop zones for the cargo and storage areas
  const [dropZones, setDropZones] = useState<DropZone[]>(generateDropZones(currentAircraftId));
  
  // Keep track of the next pallet ID for newly created pallets
  const [nextPalletId, setNextPalletId] = useState(1);
  
  // Track whether we're dragging the template pallet
  const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
  
  const [draggedPallet, setDraggedPallet] = useState<number | null>(null);
  const [totalWeight, setTotalWeight] = useState(0);
  const cargoRef = useRef<HTMLDivElement>(null);
  const storageRef = useRef<HTMLDivElement>(null);
  const configureRef = useRef<HTMLDivElement>(null);
  
  // Alert dialog state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<'warning' | 'error'>('warning');
  
  // Show alert dialog
  const showAlert = (type: 'warning' | 'error', title: string, message: string) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };
  
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
  
  const handleDrop = (e: React.DragEvent, dropArea: "cargo" | "storage" | "configure") => {
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
    } else if (dropArea === "storage" && storageRef.current) {
      rect = storageRef.current.getBoundingClientRect();
      offsetX = rect.left;
      offsetY = rect.top;
      areaWidth = rect.width;
      areaHeight = rect.height;
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
    
    // For cargo and storage areas, snap to grid cells
    let newX = 0;
    let newY = 0;
    
    // Check if we're dropping a template pallet
    if (dataTransfer === "template") {
      // For template pallet, create a new pallet
      
      // Get aircraft constraints
      const maxPallets = currentAircraftId === 'c17' ? 18 : 
                         currentAircraftId === 'c130' ? 8 : 3;
                          
      // Count existing pallets in cargo and storage
      const existingPalletCount = pallets.filter(p => 
        p.location === "cargo" || p.location === "storage"
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
      
      // Create a new pallet with current nextPalletId
      const palletSize = { width: 88, height: 108 };
      
      // Position the new pallet
      if (dropArea === "cargo" || dropArea === "storage") {
        // Special handling for C-17 with 9x2 grid
        if (currentAircraftId === 'c17') {
          const columns = 9;
          const rows = 2;
          const cellWidth = areaWidth / columns;
          const cellHeight = areaHeight / rows;
          
          // Determine which cell the pallet was dropped in (row and column)
          const cellRow = Math.floor(dropY / cellHeight);
          const cellColumn = Math.floor(dropX / cellWidth);
          
          // Use fixed pallet dimensions of 88x108
          const palletWidth = 88;
          const palletHeight = 108;
          
          // Center in the cell
          newX = (cellColumn * cellWidth) + (cellWidth - palletWidth) / 2;
          newY = (cellRow * cellHeight) + (cellHeight - palletHeight) / 2;
          
          // Set the pallet size
          palletSize.width = palletWidth;
          palletSize.height = palletHeight;
        } else {
          // For other aircraft types
          const columns = currentAircraftId === 'c130' ? 4 : 3;
          const cellWidth = areaWidth / columns;
          const cellHeight = areaHeight;
          
          // Determine which cell the pallet was dropped in
          const cellColumn = Math.floor(dropX / cellWidth);
          
          // Use fixed pallet dimensions of 88x108
          const palletWidth = 88;
          const palletHeight = 108;
          
          // Center in the cell
          newX = (cellColumn * cellWidth) + (cellWidth - palletWidth) / 2;
          newY = (cellHeight - palletHeight) / 2;
          
          // Set the pallet size
          palletSize.width = palletWidth;
          palletSize.height = palletHeight;
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
      
      // Create the new pallet with position
      const newPallet: Pallet = {
        id: nextPalletId,
        position: { x: newX, y: newY },
        location: dropArea,
        weight: null,
        size: palletSize
      };
      
      // Check if pallet is being placed in cargo area - needs weight warning
      if (dropArea === "cargo") {
        showAlert(
          'warning',
          'Warning: Pallet Has No Weight',
          'You\'ve placed a pallet with no weight in the cargo area. Please add a weight to this pallet.'
        );
      }
      
      // Add the new pallet to the pallets array
      setPallets(prev => [...prev, newPallet]);
      
      // Increment the next pallet ID
      setNextPalletId(prev => prev + 1);
      
    } else {
      // For existing pallets, get the ID and find the pallet
      const id = parseInt(dataTransfer);
      if (isNaN(id)) return;
      
      const draggedPallet = pallets.find(p => p.id === id);
      if (!draggedPallet) return;
      
      // Position the existing pallet
      if (dropArea === "cargo" || dropArea === "storage") {
        // Special handling for C-17 with 9x2 grid
        if (currentAircraftId === 'c17') {
          const columns = 9;
          const rows = 2;
          const cellWidth = areaWidth / columns;
          const cellHeight = areaHeight / rows;
          
          // Determine which cell the pallet was dropped in (row and column)
          const cellRow = Math.floor(dropY / cellHeight);
          const cellColumn = Math.floor(dropX / cellWidth);
          
          // Use fixed pallet dimensions of 88x108
          const palletWidth = 88;
          const palletHeight = 108;
          
          // Center in the cell
          newX = (cellColumn * cellWidth) + (cellWidth - palletWidth) / 2;
          newY = (cellRow * cellHeight) + (cellHeight - palletHeight) / 2;
          
          // Update the pallet size to fit the grid cell
          draggedPallet.size = {
            width: palletWidth,
            height: palletHeight
          };
        } else {
          // For other aircraft types
          const columns = currentAircraftId === 'c130' ? 4 : 3;
          const cellWidth = areaWidth / columns;
          const cellHeight = areaHeight;
          
          // Determine which cell the pallet was dropped in
          const cellColumn = Math.floor(dropX / cellWidth);
          
          // Use fixed pallet dimensions of 88x108
          const palletWidth = 88;
          const palletHeight = 108;
          
          // Center in the cell
          newX = (cellColumn * cellWidth) + (cellWidth - palletWidth) / 2;
          newY = (cellHeight - palletHeight) / 2;
          
          // Update the pallet size to fit the grid cell
          draggedPallet.size = {
            width: palletWidth,
            height: palletHeight
          };
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
      
      // Check if pallet has no weight and is being moved to cargo area
      if (dropArea === "cargo" && draggedPallet.weight === null) {
        showAlert(
          'warning',
          'Warning: Pallet Has No Weight',
          'You\'ve placed a pallet with no weight in the cargo area. Please add a weight to this pallet.'
        );
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

          {/* Main content grid */}
          <div className={`grid grid-cols-1 ${
            currentAircraftId === 'c17' 
              ? 'lg:grid-cols-1 xl:grid-cols-3' 
              : 'lg:grid-cols-3'
          } gap-4`}>
            {/* Load Summary Card */}
            <Card className={`${
              currentAircraftId === 'c17' ? 'lg:col-span-1 xl:col-span-3' : 'lg:col-span-3'
            }`}>
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
                  <div className="bg-muted rounded-md p-3">
                    <p className="text-xs font-medium">Storage Positions</p>
                    <p className="text-lg">
                      {pallets.filter(p => p.location === "storage").length} of {
                        currentAircraftId === 'c17' ? '18' : 
                        currentAircraftId === 'c130' ? '8' : '3'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cargo Area */}
            <Card className={`${
              currentAircraftId === 'c17' ? 'lg:col-span-1 xl:col-span-2' : 'lg:col-span-2'
            }`}>
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
                  className={`relative bg-green-900/20 border border-green-500/40 rounded-lg w-full ${
                    currentAircraftId === 'c17' 
                      ? 'h-[400px]' 
                      : currentAircraftId === 'c130' 
                        ? 'h-[250px]' 
                        : 'h-[150px]'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "cargo")}
                >
                  {/* Grid lines */}
                  {currentAircraftId === 'c17' ? (
                    <div className="absolute inset-0 grid grid-cols-9 grid-rows-2 gap-0 pointer-events-none">
                      {/* Horizontal grid line separating the two rows */}
                      <div className="absolute left-0 right-0 top-1/2 h-px bg-white/20"></div>
                      
                      {/* Vertical grid lines */}
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="absolute top-0 bottom-0 border-r border-white/20 h-full" 
                             style={{left: `${(i + 1) * (100 / 9)}%`}}></div>
                      ))}
                    </div>
                  ) : currentAircraftId === 'c130' ? (
                    <div className="absolute inset-0 grid grid-cols-4 gap-0 pointer-events-none">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="border-r border-white/20 h-full"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="absolute inset-0 grid grid-cols-3 gap-0 pointer-events-none">
                      <div className="border-r border-white/20 h-full"></div>
                      <div className="border-r border-white/20 h-full"></div>
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
                        width: `${pallet.size.width}px`,
                        height: `${pallet.size.height}px`,
                        zIndex: 10
                      }}
                    >
                      {pallet.weight !== null ? `${pallet.weight} kg` : "No weight"}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Drag pallets here to position them in the cargo area.
                </div>
                
                {/* Balance Indicator */}
                <div className="mt-6">
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
                  <div className="h-6 relative mb-1 rounded-md overflow-hidden">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-yellow-400 to-red-500"></div>
                    
                    {/* Center line */}
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/50"></div>
                    
                    {/* Indicator needle */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white"
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

            {/* Configure Pallets */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Package2 className="h-5 w-5 mr-2 text-primary" />
                  Configure Pallets
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (Max: {currentAircraftId === 'c17' ? '18 pallets' : currentAircraftId === 'c130' ? '8 pallets' : '3 pallets'})
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
                    Drag this template pallet to the cargo or storage areas to create new pallets.
                    You can add up to {currentAircraftId === 'c17' ? '18' : currentAircraftId === 'c130' ? '8' : '3'} pallets
                    for the {currentAircraft.name}.
                  </p>
                  
                  {/* Draggable template pallet */}
                  <div 
                    className="rounded p-4 flex items-center justify-center bg-orange-500/70 border-2 border-orange-500 cursor-move"
                    style={{ width: '88px', height: '108px' }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, null)}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Package2 className="h-5 w-5 mb-2" />
                      <span className="font-medium text-center text-xs">Drag to Create New Pallet</span>
                      <span className="text-xs mt-1">(88×108)</span>
                    </div>
                  </div>
                </div>
                
                {/* List of existing pallets */}
                <div className="space-y-4" ref={configureRef} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "configure")}>
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
                            <span className="font-medium text-sm">Pallet {pallet.id}</span>
                          </div>
                          <Badge 
                            variant={
                              pallet.location === "cargo" ? "default" : 
                              pallet.location === "storage" ? "secondary" : "outline"
                            }
                            className="text-xs"
                          >
                            {pallet.location === "cargo" ? "In Cargo" : 
                             pallet.location === "storage" ? "In Storage" : "Configure"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
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
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Storage Area */}
            <Card className={`${
              currentAircraftId === 'c17' ? 'lg:col-span-1 xl:col-span-3' : 'lg:col-span-3'
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Package2 className="h-5 w-5 mr-2 text-primary" />
                  Storage Area
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (Temporary holding)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={storageRef}
                  className={`relative bg-gray-800/30 border border-gray-500/30 rounded-lg w-full ${
                    currentAircraftId === 'c17' 
                      ? 'h-[300px]' 
                      : currentAircraftId === 'c130' 
                        ? 'h-[200px]' 
                        : 'h-[120px]'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "storage")}
                >
                  {/* Grid lines */}
                  {currentAircraftId === 'c17' ? (
                    <div className="absolute inset-0 grid grid-cols-9 grid-rows-2 gap-0 pointer-events-none">
                      {/* Horizontal grid line separating the two rows */}
                      <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10"></div>
                      
                      {/* Vertical grid lines */}
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="absolute top-0 bottom-0 border-r border-white/10 h-full" 
                             style={{left: `${(i + 1) * (100 / 9)}%`}}></div>
                      ))}
                    </div>
                  ) : currentAircraftId === 'c130' ? (
                    <div className="absolute inset-0 grid grid-cols-4 gap-0 pointer-events-none">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="border-r border-white/10 h-full"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="absolute inset-0 grid grid-cols-3 gap-0 pointer-events-none">
                      <div className="border-r border-white/10 h-full"></div>
                      <div className="border-r border-white/10 h-full"></div>
                    </div>
                  )}
                  
                  {/* Pallets in storage area */}
                  {pallets.filter(pallet => pallet.location === "storage").map((pallet) => (
                    <div
                      key={pallet.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, pallet.id)}
                      className="absolute cursor-move flex items-center justify-center font-bold text-white bg-orange-500/70 border-2 border-orange-500 rounded-md"
                      style={{
                        left: `${pallet.position.x}px`,
                        top: `${pallet.position.y}px`,
                        width: `${pallet.size.width}px`,
                        height: `${pallet.size.height}px`,
                        zIndex: 10
                      }}
                    >
                      {pallet.weight !== null ? `${pallet.weight} kg` : "No weight"}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Use this area for temporary storage. Pallets here don't count toward total load.
                </div>
              </CardContent>
            </Card>
            
            {/* Instructions */}
            <Card className={`${
              currentAircraftId === 'c17' ? 'lg:col-span-1 xl:col-span-3' : 'lg:col-span-3'
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Package2 className="h-5 w-5 mr-2 text-primary" />
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  <strong>How to use:</strong> Drag the template pallet to the cargo or storage area to create new pallets.
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