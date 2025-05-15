import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, Package2, RefreshCw, AlertCircle, AlertTriangle, X } from "lucide-react";
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
  
  // Initial pallet configuration for reset functionality
  const initialPallets: Pallet[] = [
    { id: 1, position: { x: 90, y: 70 }, location: "configure", weight: null, size: { width: 70, height: 50 } },
    { id: 2, position: { x: 170, y: 70 }, location: "configure", weight: null, size: { width: 70, height: 50 } },
    { id: 3, position: { x: 250, y: 70 }, location: "configure", weight: null, size: { width: 70, height: 50 } },
  ];
  
  const [pallets, setPallets] = useState<Pallet[]>(initialPallets);
  
  // Balance state: -100 (fully left/forward) to 100 (fully right/aft), 0 is perfectly balanced
  const [balanceValue, setBalanceValue] = useState(0);
  const [balanceStatus, setBalanceStatus] = useState<'safe' | 'warning' | 'danger'>('safe');
  
  // Drop zones for the cargo and storage areas
  const [dropZones, setDropZones] = useState<DropZone[]>([
    // Cargo area drop zones - 3 positions
    { id: 1, position: { x: 80, y: 60 }, occupied: false, area: "cargo" },
    { id: 2, position: { x: 160, y: 60 }, occupied: false, area: "cargo" },
    { id: 3, position: { x: 240, y: 60 }, occupied: false, area: "cargo" },
    
    // Storage area drop zones - 3 positions
    { id: 4, position: { x: 80, y: 60 }, occupied: false, area: "storage" },
    { id: 5, position: { x: 160, y: 60 }, occupied: false, area: "storage" },
    { id: 6, position: { x: 240, y: 60 }, occupied: false, area: "storage" },
    
    // Configure area - pallet visualization spots
    { id: 7, position: { x: 90, y: 70 }, occupied: true, area: "configure" },
    { id: 8, position: { x: 170, y: 70 }, occupied: true, area: "configure" },
    { id: 9, position: { x: 250, y: 70 }, occupied: true, area: "configure" },
  ]);
  
  const [draggedPallet, setDraggedPallet] = useState<number | null>(null);
  const [totalWeight, setTotalWeight] = useState(0);
  const cargoRef = useRef<HTMLDivElement>(null);
  const storageRef = useRef<HTMLDivElement>(null);
  const configureRef = useRef<HTMLDivElement>(null);
  
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
    
    // Set balance value (clamped between -100 and 100)
    setBalanceValue(Math.max(-100, Math.min(100, balance)));
    
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
  
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("text/plain", id.toString());
    setDraggedPallet(id);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // Maximum payload and pallet limits from aircraft configuration
  const MAX_PAYLOAD = currentAircraft.maxPayload;
  const MAX_PALLET_WEIGHT = currentAircraft.maxPalletWeight;
  
  // Alert dialog state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<'warning' | 'error'>('warning');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  
  // Update weight of a pallet with validation
  const handleWeightChange = (id: number, newWeight: string) => {
    // If input is empty, set weight to null
    if (newWeight.trim() === '') {
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
    
    // Check if pallet weight exceeds maximum pallet capacity (10,000 lbs)
    if (weightValue > MAX_PALLET_WEIGHT) {
      showAlert(
        'error',
        'Pallet Weight Limit Exceeded',
        `The weight exceeds the maximum pallet capacity of 10,000 lbs (${MAX_PALLET_WEIGHT} kg).`
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
    
    const id = parseInt(e.dataTransfer.getData("text/plain"));
    if (isNaN(id)) return;
    
    const draggedPallet = pallets.find(p => p.id === id);
    if (!draggedPallet) return;
    
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
    
    if (dropArea === "cargo" || dropArea === "storage") {
      // Calculate the cell size based on the 3-column grid
      const cellWidth = areaWidth / 3;
      const cellHeight = areaHeight;
      
      // Determine which cell the pallet was dropped in (0, 1, or 2)
      const cellColumn = Math.floor(dropX / cellWidth);
      
      // Calculate the position to center the pallet in that cell
      // Use 90% of the cell size for the pallet
      const palletWidth = cellWidth * 0.9;
      const palletHeight = cellHeight * 0.9;
      
      // Center in the cell
      newX = (cellColumn * cellWidth) + (cellWidth - palletWidth) / 2;
      newY = (cellHeight - palletHeight) / 2;
      
      // Update the pallet size to fit the grid cell
      draggedPallet.size = {
        width: palletWidth,
        height: palletHeight
      };
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
          size: dropArea === "configure" ? { width: 70, height: 50 } : draggedPallet.size,
          location: dropArea
        };
      }
      return pallet;
    }));
  };
  
  // Reset all pallets to initial state
  const handleReset = () => {
    setPallets(initialPallets);
    setBalanceValue(0);
    setBalanceStatus('safe');
  };
  
  // Show alert dialog
  const showAlert = (type: 'warning' | 'error', title: string, message: string) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };
  
  return (
    <>
      {/* Custom Alert Dialog */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="sm:max-w-md bg-background border-2 shadow-lg fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              {alertType === 'warning' ? (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <span className={alertType === 'warning' ? "text-orange-500" : "text-destructive"}>
                {alertTitle}
              </span>
            </DialogTitle>
            <button
              onClick={() => setAlertOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogHeader>
          <DialogDescription className="py-4 text-base">
            {alertMessage}
          </DialogDescription>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAlertOpen(false)}
              className={`font-medium ${
                alertType === 'warning' 
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300'
              }`}
            >
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Helmet>
        <title>{currentAircraft.name} Load Planning - LOADMdocs</title>
        <meta 
          name="description" 
          content={`${currentAircraft.name} cargo plane load planning tool for loadmasters.`}
        />
      </Helmet>

      <div className="container mx-auto px-4 py-6 mb-16">
        <div className="max-w-6xl mx-auto">
          {/* Header with Back Button */}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Load Summary Card */}
            <Card className="lg:col-span-3">
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
                    <p className="text-lg">{pallets.filter(p => p.location === "cargo").length} of 3</p>
                  </div>
                  <div className="bg-muted rounded-md p-3">
                    <p className="text-xs font-medium">Storage Positions</p>
                    <p className="text-lg">{pallets.filter(p => p.location === "storage").length} of 3</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cargo Area */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Cargo Area</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={cargoRef}
                  className="relative bg-green-900/20 border border-green-500/40 rounded-lg h-[160px] w-full"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "cargo")}
                >
                  {/* Grid lines */}
                  <div className="absolute inset-0 grid grid-cols-3 gap-0 pointer-events-none">
                    <div className="border-r border-white/20 h-full"></div>
                    <div className="border-r border-white/20 h-full"></div>
                  </div>
                  
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
                  Drag pallets in and out of the cargo area. Only pallets in this area count toward total weight.
                </div>
                
                {/* Balance Indicator */}
                <div className="mt-4">
                  <div className="flex items-center mb-1">
                    <Scale className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm font-medium">Weight Balance</span>
                    {balanceStatus === 'danger' && (
                      <div className="ml-auto flex items-center text-destructive">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="text-xs">Balance critical!</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative h-8 w-full bg-muted rounded-md overflow-hidden">
                    {/* Balance scale background with smooth color gradient */}
                    <div className="absolute inset-0" 
                      style={{ 
                        background: 'linear-gradient(to right, #f87171, #fbbf24, #4ade80, #fbbf24, #f87171)',
                        backgroundSize: '100% 100%'
                      }}>
                    </div>
                    
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
                <CardTitle>Configure Pallets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 relative" ref={configureRef} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "configure")}>
                  {pallets.map((pallet) => (
                    <div 
                      key={pallet.id} 
                      className="bg-card border border-border rounded-md p-2"
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
                           pallet.location === "storage" ? "In Storage" : "Not Placed"}
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
                      
                      {/* Draggable pallet representation */}
                      <div 
                        className={`mt-2 rounded p-2 flex items-center justify-center ${
                          pallet.location !== "configure" 
                            ? "bg-gray-500/30 border-2 border-gray-500/50 text-gray-400 cursor-not-allowed"
                            : "bg-orange-500/70 border-2 border-orange-500 cursor-move"
                        }`}
                        draggable={pallet.location === "configure"}
                        onDragStart={(e) => pallet.location === "configure" && handleDragStart(e, pallet.id)}
                      >
                        <Package2 className={`h-4 w-4 mr-1 ${pallet.location !== "configure" ? "text-gray-400" : ""}`} />
                        <span className="text-xs font-medium">
                          {pallet.location === "configure" 
                            ? (pallet.weight !== null 
                                ? `Drag Pallet ${pallet.id} (${pallet.weight} kg)` 
                                : `Drag Pallet ${pallet.id}`)
                            : `Pallet ${pallet.id} is ${pallet.location === "cargo" ? "in cargo" : "in storage"}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Storage Area */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle>Storage Area</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={storageRef}
                  className="relative bg-gray-800/30 border border-gray-500/30 rounded-lg h-[120px] w-full"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "storage")}
                >
                  {/* Grid lines */}
                  <div className="absolute inset-0 grid grid-cols-3 gap-0 pointer-events-none">
                    <div className="border-r border-white/10 h-full"></div>
                    <div className="border-r border-white/10 h-full"></div>
                  </div>
                  
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
            <Card className="lg:col-span-3">
              <CardContent className="pt-4">
                <p className="text-sm">
                  <strong>Instructions:</strong> Drag and drop pallets between the cargo area, storage area, and configuration section.
                  Edit pallet weights using the input fields.
                  Only pallets in the cargo area count toward the total weight.
                  Maximum payload is 10,000 kg.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}