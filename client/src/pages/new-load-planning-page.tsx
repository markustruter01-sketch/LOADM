import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  RefreshCw, 
  ArrowLeft, 
  MessageSquareText,
  AlertTriangle
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const params = useParams<{ aircraftId: string }>();
  const [, navigate] = useLocation();
  const [match] = useLocation('/load-planning/:aircraftId');
  
  // Aircraft configuration
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
  
  // Current aircraft settings
  const currentAircraftId = match ? params.aircraftId : 'c27j';
  const currentAircraft = aircraftConfigs[currentAircraftId] || aircraftConfigs.c27j;
  
  // State
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [selectedPalletId, setSelectedPalletId] = useState<number | null>(null);
  const [configMode, setConfigMode] = useState<"weight" | "type" | null>(null);
  const [tempWeight, setTempWeight] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  
  // Refs
  const cargoAreaRef = useRef<HTMLDivElement>(null);
  const configAreaRef = useRef<HTMLDivElement>(null);
  const chatSectionRef = useRef<HTMLDivElement>(null);
  
  // Derived state
  const selectedPallet = pallets.find(p => p.id === selectedPalletId);
  const palletCountInCargo = pallets.filter(p => p.location === "cargo").length;
  const totalWeight = pallets
    .filter(p => p.location === "cargo" && p.weight !== null)
    .reduce((sum, pallet) => sum + (pallet.weight || 0), 0);
  
  // Dynamic balance scale parameters
  const balanceMinValue = 18; // minimum Center of Gravity value
  const balanceMaxValue = 88; // maximum Center of Gravity value
  const balanceScaleWidth = 300; // width of the scale in pixels
  
  // Determine balance value based on cargo configuration
  const getBalanceValue = () => {
    const cargoInPositions = pallets.filter(p => p.location === "cargo" && p.positionLabel);
    
    if (cargoInPositions.length === 0) {
      return (balanceMaxValue - balanceMinValue) / 2 + balanceMinValue; // Center point
    }
    
    let momentSum = 0;
    let weightSum = 0;
    
    cargoInPositions.forEach(pallet => {
      if (pallet.weight && pallet.positionLabel) {
        const positionNumber = parseInt(pallet.positionLabel.substring(1));
        let normalizedPosition = 0;
        
        // Different position calculations for different aircraft types
        if (currentAircraftId === 'c27j' || currentAircraftId === 'kc30a') {
          // For 3-position aircraft: -0.66 (left/P1), 0 (center/P2), 0.66 (right/P3)
          normalizedPosition = (positionNumber - 1) * 0.66; // -0.66, 0, 0.66
        } else if (currentAircraftId === 'c17') {
          // For C-17, have 18 positions (9 rows × 2 columns)
          const row = Math.ceil(positionNumber / 2); // 1-9
          const column = positionNumber % 2 === 0 ? 2 : 1; // 1 or 2
          normalizedPosition = ((row - 5) * 0.22) + ((column - 1.5) * 0.4); // Center at row 5, slight offset for columns
        } else if (currentAircraftId === 'c130') {
          // For C-130, have 8 positions (4 rows × 2 columns)
          const row = Math.ceil(positionNumber / 2); // 1-4
          const column = positionNumber % 2 === 0 ? 2 : 1; // 1 or 2
          normalizedPosition = ((row - 2.5) * 0.4) + ((column - 1.5) * 0.4); // Center at row 2.5
        }
        
        const momentContribution = pallet.weight * normalizedPosition;
        momentSum += momentContribution;
        weightSum += pallet.weight;
      }
    });
    
    if (weightSum === 0) {
      return (balanceMaxValue - balanceMinValue) / 2 + balanceMinValue; // Center point if no weights
    }
    
    // Normalized moment gives us a value between -1 and 1
    const normalizedMoment = momentSum / weightSum;
    
    // Map the -1 to 1 range to our balance scale range
    const balanceRange = balanceMaxValue - balanceMinValue;
    const mappedValue = normalizedMoment * (balanceRange * 0.4) + ((balanceRange / 2) + balanceMinValue);
    
    // Ensure we stay within bounds
    return Math.min(Math.max(mappedValue, balanceMinValue), balanceMaxValue);
  };
  
  const balanceValue = getBalanceValue().toFixed(1);

  function getAircraftGridConfig(aircraftType = currentAircraftId) {
    switch (aircraftType) {
      case 'c17':
        return {
          rows: 9,
          cols: 2,
          cellWidth: 140,
          cellHeight: 100,
          cellPadding: 10,
          palletWidth: 126, // 90% of cell width
          palletHeight: 90  // 90% of cell height
        };
      case 'c130':
        return {
          rows: 4,
          cols: 2,
          cellWidth: 140,
          cellHeight: 100,
          cellPadding: 10,
          palletWidth: 126,
          palletHeight: 90
        };
      case 'kc30a':
        return {
          rows: 30,
          cols: 1,
          cellWidth: 45,
          cellHeight: 75,
          cellPadding: 5,
          palletWidth: 40,
          palletHeight: 68
        };
      default: // c27j
        return {
          rows: 1,
          cols: 3,
          cellWidth: 140,
          cellHeight: 100,
          cellPadding: 10,
          palletWidth: 126,
          palletHeight: 90
        };
    }
  }

  useEffect(() => {
    let newPallets: Pallet[] = [];
    let newDropZones: DropZone[] = [];
    
    // Create default configuration with pallets
    const defaultPalletCount = currentAircraftId === 'c17' 
      ? 18 
      : currentAircraftId === 'c130'
        ? 8
        : currentAircraftId === 'kc30a'
          ? 30 
          : 3;
          
    // Create configure area pallets
    for (let i = 0; i < defaultPalletCount; i++) {
      newPallets.push({
        id: i + 1,
        position: { 
          x: 50 + (i % 5) * 60, 
          y: 30 + Math.floor(i / 5) * 60 
        },
        location: "configure",
        weight: null,
        size: { width: 50, height: 50 },
      });
      
      newDropZones.push({
        id: i + 1,
        position: { 
          x: 50 + (i % 5) * 60, 
          y: 30 + Math.floor(i / 5) * 60 
        },
        occupied: true,
        area: "configure"
      });
    }
    
    // Create cargo area drop zones
    // Number of positions depends on the aircraft
    const cargoPositions = currentAircraftId === 'c17' 
      ? 18 
      : currentAircraftId === 'c130'
        ? 8
        : currentAircraftId === 'kc30a'
          ? 30
          : 3;
          
    for (let i = 0; i < cargoPositions; i++) {
      // For Spartan, spread across horizontally
      // For larger aircraft, create grid-based layout
      
      // Different layouts for different aircraft
      let xPosition, yPosition;
      
      if (currentAircraftId === 'c17') {
        // 9×2 layout
        const col = i % 2; 
        const row = Math.floor(i / 2);
        xPosition = 50 + col * 160;
        yPosition = 30 + row * 120;
      } else if (currentAircraftId === 'c130') {
        // 4×2 layout
        const col = i % 2; 
        const row = Math.floor(i / 2);
        xPosition = 50 + col * 160;
        yPosition = 30 + row * 120;
      } else if (currentAircraftId === 'kc30a') {
        // Special layout for KC30-A with 30 positions
        // First 14 positions are in the aft section, next 16 in the forward section
        if (i < 14) {
          // Aft section (first 14 positions)
          xPosition = 30 + (i % 14) * 47;
          yPosition = 30;
        } else {
          // Forward section (next 16 positions)
          xPosition = 30 + ((i - 14) % 16) * 42;
          yPosition = 135;
        }
      } else {
        // Default (Spartan C-27J)
        xPosition = 50 + i * 160;
        yPosition = 50;
      }
      
      newDropZones.push({
        id: 1000 + i, // offset to avoid collision with configure area IDs
        position: { x: xPosition, y: yPosition },
        occupied: false,
        area: "cargo"
      });
    }
    
    setPallets(newPallets);
    setDropZones(newDropZones);
  }, [currentAircraftId]);
  
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("text/plain", id.toString());
    setIsDragging(true);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent, area: "cargo" | "configure") => {
    e.preventDefault();
    
    const palletId = parseInt(e.dataTransfer.getData("text/plain"));
    const rect = (area === "cargo" ? cargoAreaRef.current : configAreaRef.current)?.getBoundingClientRect();
    
    if (!rect) return;
    
    // Get mouse position relative to the drop area
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find the nearest drop zone
    let nearestZone: DropZone | null = null;
    let minDistance = Infinity;
    
    dropZones.forEach(zone => {
      if (zone.area === area && !zone.occupied) {
        const distance = Math.sqrt(
          Math.pow(zone.position.x - x, 2) + 
          Math.pow(zone.position.y - y, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestZone = zone;
        }
      }
    });
    
    if (nearestZone) {
      // Update pallet position
      setPallets(prev => prev.map(pallet => {
        if (pallet.id === palletId) {
          // Get position label for the cargo area
          let positionLabel;
          if (area === "cargo") {
            const zoneId = nearestZone!.id;
            const positionNumber = zoneId - 999; // 1000 + i => i + 1
            positionLabel = `P${positionNumber}`;
          } else {
            positionLabel = undefined;
          }
          
          return {
            ...pallet,
            position: { ...nearestZone!.position },
            location: area,
            positionLabel
          };
        }
        return pallet;
      }));
      
      // Update drop zones
      setDropZones(prev => prev.map(zone => {
        // The zone where the pallet is dropped becomes occupied
        if (zone.id === nearestZone!.id) {
          return { ...zone, occupied: true };
        }
        
        // The zone where the pallet was previously located becomes unoccupied
        const palletToMove = pallets.find(p => p.id === palletId);
        const previousZones = prev.filter(z => 
          z.area === palletToMove?.location && 
          z.position.x === palletToMove?.position.x && 
          z.position.y === palletToMove?.position.y
        );
        
        if (previousZones.length > 0 && previousZones[0].id === zone.id) {
          return { ...zone, occupied: false };
        }
        
        return zone;
      }));
    }
    
    setIsDragging(false);
  };
  
  const handlePalletCellClick = (event: React.MouseEvent, pallet: Pallet, posLabel: string) => {
    event.stopPropagation(); // Prevent click from propagating
    setSelectedPalletId(pallet.id);
    setConfigMode("weight");
    
    // Set initial weight value in the form
    if (pallet.weight !== null) {
      setTempWeight(pallet.weight.toString());
    } else {
      setTempWeight("");
    }
  };
  
  const handleWeightSubmit = () => {
    // Validate weight is a number and non-negative
    const weight = parseFloat(tempWeight);
    
    if (isNaN(weight)) {
      setWarningMessage("Please enter a valid number for weight.");
      setShowWarningDialog(true);
      return;
    }
    
    if (weight < 0) {
      setWarningMessage("Weight must be a non-negative value.");
      setShowWarningDialog(true);
      return;
    }
    
    if (weight > currentAircraft.maxPalletWeight) {
      setWarningMessage(`Weight exceeds maximum pallet weight for this aircraft (${currentAircraft.maxPalletWeight} kg).`);
      setShowWarningDialog(true);
      return;
    }
    
    // Check if total weight would exceed aircraft's max payload
    const otherPalletsWeight = pallets
      .filter(p => p.location === "cargo" && p.id !== selectedPalletId && p.weight !== null)
      .reduce((sum, pallet) => sum + (pallet.weight || 0), 0);
      
    if (otherPalletsWeight + weight > currentAircraft.maxPayload) {
      setWarningMessage(`Total weight would exceed aircraft's maximum payload (${currentAircraft.maxPayload} kg).`);
      setShowWarningDialog(true);
      return;
    }
    
    // Update pallet weight
    setPallets(prev => prev.map(pallet => 
      pallet.id === selectedPalletId 
        ? { ...pallet, weight: weight } 
        : pallet
    ));
    
    // Close configuration mode
    setConfigMode(null);
  };
  
  const handleCargoTypeSelect = (type: "C" | "DG") => {
    setPallets(prev => prev.map(pallet => 
      pallet.id === selectedPalletId 
        ? { ...pallet, cargoType: type } 
        : pallet
    ));
  };
  
  const handleCargoCategorySelect = (category: string) => {
    setPallets(prev => prev.map(pallet => 
      pallet.id === selectedPalletId 
        ? { ...pallet, cargoCategory: category } 
        : pallet
    ));
  };
  
  const handleDGClassSelect = (dgClass: string) => {
    setPallets(prev => prev.map(pallet => 
      pallet.id === selectedPalletId 
        ? { ...pallet, dgClass } 
        : pallet
    ));
  };
  
  const handleReset = () => {
    // Reset all pallets to configuration area
    setPallets(prev => prev.map((pallet, index) => ({
      ...pallet,
      position: { 
        x: 50 + (index % 5) * 60, 
        y: 30 + Math.floor(index / 5) * 60 
      },
      location: "configure",
      weight: null,
      cargoType: undefined,
      cargoCategory: undefined,
      dgClass: undefined,
      positionLabel: undefined
    })));
    
    // Reset drop zones
    setDropZones(prev => prev.map(zone => ({
      ...zone,
      occupied: zone.area === "configure" // All configure zones are occupied, all cargo zones are empty
    })));
    
    // Clear selection
    setSelectedPalletId(null);
    setConfigMode(null);
  };
  
  // Function to scroll to the chat section
  const scrollToChat = () => {
    chatSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Validate weight input to only allow numbers
  const handleWeightInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setTempWeight(value);
    } else {
      setWarningMessage("Please enter numbers only for weight.");
      setShowWarningDialog(true);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>{currentAircraft.name} - Load Planning - LOADMworkflow</title>
        <meta 
          name="description" 
          content={`Load planning simulator for ${currentAircraft.name}`} 
        />
      </Helmet>
      
      <div className="container mx-auto px-4 py-6 mb-16">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/load-planning')}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Aircraft Selection
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          <div className="lg:col-span-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{currentAircraft.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <strong>Max Payload:</strong> {currentAircraft.maxPayload.toLocaleString()} kg
                    </div>
                    <div>
                      <strong>Max Pallet Weight:</strong> {currentAircraft.maxPalletWeight.toLocaleString()} kg
                    </div>
                    <div>
                      <strong>Current Load:</strong> {totalWeight.toLocaleString()} kg
                    </div>
                    <div>
                      <strong>Pallets Loaded:</strong> {palletCountInCargo} / {
                        currentAircraftId === 'c17' 
                          ? '18' 
                          : currentAircraftId === 'c130'
                            ? '8'
                            : currentAircraftId === 'kc30a'
                              ? '30'
                              : '3'
                      }
                    </div>
                  </div>
                </div>
                
                <div 
                  ref={configAreaRef}
                  className="relative bg-gray-200 dark:bg-gray-800 rounded-md p-4 mb-4 overflow-hidden"
                  style={{ 
                    height: "300px",
                    userSelect: "none"
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "configure")}
                >
                  <div className="text-xs text-muted-foreground mb-2">
                    Configuration Area - Drag pallets here to remove from cargo
                  </div>
                  
                  {pallets.filter(p => p.location === "configure").map(pallet => (
                    <div 
                      key={pallet.id}
                      style={{
                        position: "absolute",
                        left: `${pallet.position.x}px`,
                        top: `${pallet.position.y}px`,
                        width: `${pallet.size.width}px`,
                        height: `${pallet.size.height}px`,
                        backgroundColor: "#f97316",
                        opacity: 0.8,
                        border: "2px solid #ea580c",
                        borderRadius: "4px",
                        cursor: isDragging ? "default" : "grab",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "12px",
                        zIndex: 10
                      }}
                      draggable={!isDragging}
                      onDragStart={(e) => handleDragStart(e, pallet.id)}
                      onClick={() => {
                        setSelectedPalletId(pallet.id);
                        setConfigMode("weight");
                        setTempWeight(pallet.weight?.toString() || "");
                      }}
                    >
                      {pallet.weight ? `${pallet.weight} kg` : `Pallet ${pallet.id}`}
                      
                      {pallet.cargoType && (
                        <Badge 
                          variant={pallet.cargoType === "C" ? "outline" : "destructive"}
                          className="absolute top-1 right-1 text-xs px-1"
                        >
                          {pallet.cargoType}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                
                {selectedPalletId && configMode === "weight" && (
                  <div className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                    <div className="mb-2 font-medium">Configure Pallet Weight</div>
                    <div className="flex flex-row gap-2">
                      <Input
                        type="text"
                        placeholder="Enter weight in kg"
                        value={tempWeight}
                        onChange={handleWeightInputChange}
                        className="text-white font-bold"
                      />
                      <Button onClick={handleWeightSubmit}>Save</Button>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setConfigMode("type")}
                        className="flex-1 text-xs"
                      >
                        Set Cargo Type
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setConfigMode(null)}
                        className="flex-1 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                {selectedPalletId && configMode === "type" && (
                  <div className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                    <div className="mb-2 font-medium">Configure Cargo Type</div>
                    
                    <div className="flex gap-2 mb-3">
                      <Button 
                        variant={selectedPallet?.cargoType === "C" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCargoTypeSelect("C")}
                      >
                        Normal Cargo
                      </Button>
                      <Button 
                        variant={selectedPallet?.cargoType === "DG" ? "destructive" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCargoTypeSelect("DG")}
                      >
                        Dangerous Goods
                      </Button>
                    </div>
                    
                    <div className="mb-3">
                      <Select
                        value={selectedPallet?.cargoCategory || ""}
                        onValueChange={handleCargoCategorySelect}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select cargo category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pax_bags">Passenger Bags</SelectItem>
                          <SelectItem value="mechanical">Mechanical Equipment</SelectItem>
                          <SelectItem value="medical">Medical Equipment</SelectItem>
                          <SelectItem value="perishable">Perishable Goods</SelectItem>
                          <SelectItem value="vehicles">Vehicles</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="military">Military Equipment</SelectItem>
                          <SelectItem value="humanitarian">Humanitarian Aid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="mb-3">
                      <Select
                        value={selectedPallet?.dgClass || ""}
                        onValueChange={handleDGClassSelect}
                        disabled={selectedPallet?.cargoType !== "DG"}
                      >
                        <SelectTrigger className={selectedPallet?.cargoType !== "DG" ? "opacity-50" : ""}>
                          <SelectValue placeholder="Dangerous Goods Class" />
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
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setConfigMode("weight")}
                        className="flex-1 text-xs"
                      >
                        Back to Weight
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setConfigMode(null)}
                        className="flex-1 text-xs"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-7">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Cargo Layout</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="layout" className="mb-4">
                  <TabsList className="mb-2">
                    <TabsTrigger value="layout">Aircraft Layout</TabsTrigger>
                    <TabsTrigger value="balance">Balance & CG</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="layout">
                    <div 
                      ref={cargoAreaRef}
                      className="relative bg-gray-900 rounded-md p-4 overflow-hidden mb-3"
                      style={{ 
                        height: currentAircraftId === 'c17' 
                          ? 'h-[950px]' 
                          : currentAircraftId === 'c130'
                            ? 'h-[540px]'
                            : currentAircraftId === 'kc30a'
                              ? 'h-[230px]'
                              : 'h-[150px]',
                        userSelect: "none",
                        minHeight: "150px" // Minimum height for smaller aircraft
                      }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, "cargo")}
                    >
                      {currentAircraftId === 'c17' ? (
                        <div className="absolute inset-0">
                          {/* Grid for C-17 with 18 positions (9 rows x 2 columns) */}
                          {(() => {
                            // Get configuration for C-17
                            const config = getAircraftGridConfig('c17');
                            const cellSpacing = config.cellWidth + config.cellPadding;
                            
                            return (
                              <>
                                {[...Array(config.rows)].map((_, row) => {
                                  return [...Array(config.cols)].map((_, col) => {
                                    // Calculate position number for this grid cell
                                    const positionNumber = row * config.cols + col + 1;
                                    const positionLabel = `P${positionNumber}`;
                                    
                                    // Find if a pallet is assigned to this position
                                    const assignedPallet = pallets.find(p => 
                                      p.location === "cargo" && 
                                      p.positionLabel === positionLabel
                                    );
                                    
                                    return (
                                      <div 
                                        key={`${row}-${col}`} 
                                        className="absolute" 
                                        style={{
                                          width: `${config.cellWidth}px`,
                                          height: `${config.cellHeight}px`,
                                          left: `${col * cellSpacing}px`,
                                          top: `${row * (config.cellHeight + config.cellPadding)}px`,
                                          borderRadius: '4px',
                                          border: '1px solid rgba(255, 255, 255, 0.1)',
                                          background: assignedPallet ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 255, 255, 0.03)'
                                        }}
                                      >
                                        <div 
                                          className={`absolute ${assignedPallet ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                          style={{
                                            width: `${config.palletWidth}px`,
                                            height: `${config.palletHeight}px`,
                                            left: `${(config.cellWidth - config.palletWidth) / 2}px`,
                                            top: `${(config.cellHeight - config.palletHeight) / 2}px`,
                                            borderRadius: '4px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            background: assignedPallet ? 'rgba(249, 115, 22, 0.3)' : 'transparent',
                                            zIndex: assignedPallet ? 10 : 1
                                          }}
                                          draggable={assignedPallet ? true : false}
                                          onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
                                          onClick={(e) => {
                                            if (assignedPallet) {
                                              handlePalletCellClick(e, assignedPallet, positionLabel);
                                            }
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
                                      </div>
                                    );
                                  });
                                })}
                              </>
                            );
                          })()}
                        </div>
                      ) : currentAircraftId === 'c130' ? (
                        <div className="absolute inset-0">
                          {/* Grid for C-130 with 8 positions (4 rows x 2 columns) */}
                          {(() => {
                            // Get configuration for C-130
                            const config = getAircraftGridConfig('c130');
                            const cellSpacing = config.cellWidth + config.cellPadding;
                            
                            return (
                              <>
                                {[...Array(config.rows)].map((_, row) => {
                                  return [...Array(config.cols)].map((_, col) => {
                                    // Calculate position number for this grid cell
                                    const positionNumber = row * config.cols + col + 1;
                                    const positionLabel = `P${positionNumber}`;
                                    
                                    // Find if a pallet is assigned to this position
                                    const assignedPallet = pallets.find(p => 
                                      p.location === "cargo" && 
                                      p.positionLabel === positionLabel
                                    );
                                    
                                    return (
                                      <div 
                                        key={`${row}-${col}`} 
                                        className="absolute" 
                                        style={{
                                          width: `${config.cellWidth}px`,
                                          height: `${config.cellHeight}px`,
                                          left: `${col * cellSpacing}px`,
                                          top: `${row * (config.cellHeight + config.cellPadding)}px`,
                                          borderRadius: '4px',
                                          border: '1px solid rgba(255, 255, 255, 0.1)',
                                          background: assignedPallet ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 255, 255, 0.03)'
                                        }}
                                      >
                                        <div 
                                          className={`absolute ${assignedPallet ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                          style={{
                                            width: `${config.palletWidth}px`,
                                            height: `${config.palletHeight}px`,
                                            left: `${(config.cellWidth - config.palletWidth) / 2}px`,
                                            top: `${(config.cellHeight - config.palletHeight) / 2}px`,
                                            borderRadius: '4px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            background: assignedPallet ? 'rgba(249, 115, 22, 0.3)' : 'transparent',
                                            zIndex: assignedPallet ? 10 : 1
                                          }}
                                          draggable={assignedPallet ? true : false}
                                          onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
                                          onClick={(e) => {
                                            if (assignedPallet) {
                                              handlePalletCellClick(e, assignedPallet, positionLabel);
                                            }
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
                                      </div>
                                    );
                                  });
                                })}
                              </>
                            );
                          })()}
                        </div>
                      ) : currentAircraftId === 'kc30a' ? (
                        <div className="absolute inset-0 flex flex-col">
                          {/* KC30-A with 30 pallets (14 aft + 16 forward) */}
                          
                          {/* White dividing line between sections */}
                          <div 
                            className="absolute w-full h-0.5 bg-white opacity-70"
                            style={{ top: '110px', zIndex: 5 }}
                          ></div>
                          
                          {/* Section labels */}
                          <div className="absolute text-white/70 text-xs font-medium" style={{top: '10px', left: '10px', zIndex: 5}}>
                            AFT SECTION (14 positions)
                          </div>
                          
                          <div className="absolute text-white/70 text-xs font-medium" style={{top: '115px', left: '10px', zIndex: 5}}>
                            FORWARD SECTION (16 positions)
                          </div>
                          
                          {/* Aft Section - 14 positions */}
                          {[...Array(14)].map((_, i) => {
                            const positionLabel = `P${i + 1}`;
                            const assignedPallet = pallets.find(p => 
                              p.location === "cargo" && 
                              p.positionLabel === positionLabel
                            );
                            
                            return (
                              <div 
                                key={`aft-${i}`}
                                className="absolute border border-white/10 rounded-sm"
                                style={{
                                  left: `${i * 47}px`,
                                  top: '30px',
                                  width: '45px',
                                  height: '75px',
                                  backgroundColor: assignedPallet ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                }}
                              >
                                {!assignedPallet ? (
                                  <div className="flex h-full items-center justify-center">
                                    <span className="text-white/50 text-sm font-medium">{positionLabel}</span>
                                  </div>
                                ) : (
                                  <div 
                                    className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing" 
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, assignedPallet.id)}
                                    onClick={(e) => handlePalletCellClick(e, assignedPallet, positionLabel)}
                                  >
                                    <div className="text-center">
                                      <div className="text-white text-xs font-medium">
                                        {assignedPallet.weight !== null ? `${assignedPallet.weight} kg` : "No weight"}
                                      </div>
                                      
                                      {assignedPallet.cargoType && (
                                        <div className="absolute top-1 right-1">
                                          <Badge variant={assignedPallet.cargoType === "C" ? "outline" : "destructive"} className="text-xs px-1">
                                            {assignedPallet.cargoType}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* Forward Section - 16 positions */}
                          {[...Array(16)].map((_, i) => {
                            const positionNumber = i + 15;
                            const positionLabel = `P${positionNumber}`;
                            const assignedPallet = pallets.find(p => 
                              p.location === "cargo" && 
                              p.positionLabel === positionLabel
                            );
                            
                            return (
                              <div 
                                key={`fwd-${i}`}
                                className="absolute border border-white/10 rounded-sm"
                                style={{
                                  left: `${i * 42}px`,
                                  top: '135px',
                                  width: '40px',
                                  height: '75px',
                                  backgroundColor: assignedPallet ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                }}
                              >
                                {!assignedPallet ? (
                                  <div className="flex h-full items-center justify-center">
                                    <span className="text-white/50 text-sm font-medium">{positionLabel}</span>
                                  </div>
                                ) : (
                                  <div 
                                    className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing" 
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, assignedPallet.id)}
                                    onClick={(e) => handlePalletCellClick(e, assignedPallet, positionLabel)}
                                  >
                                    <div className="text-center">
                                      <div className="text-white text-xs font-medium">
                                        {assignedPallet.weight !== null ? `${assignedPallet.weight} kg` : "No weight"}
                                      </div>
                                      
                                      {assignedPallet.cargoType && (
                                        <div className="absolute top-1 right-1">
                                          <Badge variant={assignedPallet.cargoType === "C" ? "outline" : "destructive"} className="text-xs px-1">
                                            {assignedPallet.cargoType}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="absolute inset-0">
                          {/* Grid cells for Spartan C-27J (3 positions) */}
                          {[...Array(3)].map((_, i) => {
                            // Calculate position label for this grid cell
                            const positionLabel = `P${i + 1}`;
                            
                            // Find if a pallet is assigned to this position
                            const assignedPallet = pallets.find(p => 
                              p.location === "cargo" && 
                              p.positionLabel === positionLabel
                            );
                            
                            return (
                              <div 
                                key={i} 
                                className="absolute" 
                                style={{
                                  width: "140px",
                                  height: "100px",
                                  left: `${i * 150}px`,
                                  top: 0,
                                  borderRadius: '4px',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  background: assignedPallet ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 255, 255, 0.03)'
                                }}
                              >
                                <div 
                                  className={`absolute ${assignedPallet ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                  style={{
                                    width: "126px",
                                    height: "90px",
                                    left: "7px",
                                    top: "5px",
                                    borderRadius: '4px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: assignedPallet ? 'rgba(249, 115, 22, 0.3)' : 'transparent',
                                    zIndex: assignedPallet ? 10 : 1
                                  }}
                                  draggable={assignedPallet ? true : false}
                                  onDragStart={assignedPallet ? (e) => handleDragStart(e, assignedPallet.id) : undefined}
                                  onClick={(e) => {
                                    if (assignedPallet) {
                                      handlePalletCellClick(e, assignedPallet, positionLabel);
                                    }
                                  }}
                                >
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
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
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Drag pallets here to position them in the cargo area.
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
                    
                    {/* Cargo Balance Assistant Button - scrolls to chat */}
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-primary text-primary" 
                        onClick={scrollToChat}
                      >
                        <MessageSquareText className="h-4 w-4 mr-2" />
                        Cargo Balance Assistant
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="balance">
                    <div className="bg-gray-900 p-4 rounded-md">
                      <div className="text-center mb-4 text-white font-medium">
                        Center of Gravity Balance 
                        <span className="text-muted-foreground ml-2 text-sm">
                          (Acceptable Range: {balanceMinValue}° - {balanceMaxValue}°)
                        </span>
                      </div>
                      
                      {/* Gradient balance scale with larger text */}
                      <div 
                        className="relative mb-6 mx-auto rounded"
                        style={{ 
                          width: `${balanceScaleWidth}px`, 
                          height: "30px",
                          background: `linear-gradient(to right, #f97316, #facc15, #84cc16, #facc15, #f97316)`,
                        }}
                      >
                        {/* Dynamic needle with no center line */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-md"
                          style={{ 
                            left: `${((parseFloat(balanceValue) - balanceMinValue) / (balanceMaxValue - balanceMinValue)) * balanceScaleWidth}px`,
                            height: "60px", // Extends above and below scale
                            transform: "translateY(-15px)", // Center vertically
                            zIndex: 10
                          }}
                        ></div>
                        
                        {/* Scale value */}
                        <div 
                          className="absolute -top-10 transform -translate-x-1/2 font-bold text-2xl"
                          style={{ 
                            left: `${((parseFloat(balanceValue) - balanceMinValue) / (balanceMaxValue - balanceMinValue)) * balanceScaleWidth}px`,
                            color: parseFloat(balanceValue) < 35 || parseFloat(balanceValue) > 75 
                              ? "#f97316" // Orange when outside ideal range
                              : "#84cc16" // Green when within ideal range
                          }}
                        >
                          {balanceValue}°
                        </div>
                        
                        {/* Scale labels */}
                        <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
                          {balanceMinValue}°
                        </div>
                        <div className="absolute -bottom-6 right-0 text-xs text-muted-foreground">
                          {balanceMaxValue}°
                        </div>
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground">
                          Optimal Range
                        </div>
                      </div>
                      
                      <div className="mt-8 text-sm text-muted-foreground">
                        <p className="mb-2">
                          <strong>How to read:</strong> The Center of Gravity (CG) indicator shows the balance point of your cargo. Keep it within the green area (35° - 75°) for optimal flight performance.
                        </p>
                        <p>
                          <strong>Tip:</strong> Distribute heavier items evenly throughout the aircraft to maintain proper balance.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* AI Chat Assistant Section */}
        <div ref={chatSectionRef}>
          <LoadBalanceChat 
            aircraftType={currentAircraftId}
            cargoData={pallets.filter(p => p.location === "cargo" && p.weight !== null)}
            balanceData={{
              balanceValue: parseFloat(balanceValue) - 53, // Normalize to center at 0
              balanceCG: parseFloat(balanceValue)
            }}
          />
        </div>
      </div>
      
      {/* Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Warning
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-white">
            {warningMessage}
          </DialogDescription>
          <div className="flex justify-end">
            <Button onClick={() => setShowWarningDialog(false)}>
              Understood
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}