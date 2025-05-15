import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, Package2, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Pallet {
  id: number;
  position: { x: number; y: number };
  location: "cargo" | "storage" | "configure";
  weight: number;
  size: { width: number; height: number };
}

interface DropZone {
  id: number;
  position: { x: number; y: number };
  occupied: boolean;
  area: "cargo" | "storage" | "configure";
}

export default function LoadPlanningPage() {
  const [_, navigate] = useLocation();
  const [pallets, setPallets] = useState<Pallet[]>([
    { id: 1, position: { x: 90, y: 70 }, location: "configure", weight: 1200, size: { width: 70, height: 50 } },
    { id: 2, position: { x: 170, y: 70 }, location: "configure", weight: 1500, size: { width: 70, height: 50 } },
    { id: 3, position: { x: 250, y: 70 }, location: "configure", weight: 900, size: { width: 70, height: 50 } },
  ]);
  
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
      return pallet.location === "cargo" ? total + pallet.weight : total;
    }, 0);
    
    setTotalWeight(weight);
  }, [pallets]);
  
  const handleBackClick = () => {
    navigate("/");
  };
  
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("text/plain", id.toString());
    setDraggedPallet(id);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // Update weight of a pallet
  const handleWeightChange = (id: number, newWeight: string) => {
    const weightValue = parseInt(newWeight) || 0;
    
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
    
    if (dropArea === "cargo" && cargoRef.current) {
      rect = cargoRef.current.getBoundingClientRect();
      offsetX = rect.left;
      offsetY = rect.top;
    } else if (dropArea === "storage" && storageRef.current) {
      rect = storageRef.current.getBoundingClientRect();
      offsetX = rect.left;
      offsetY = rect.top;
    } else if (dropArea === "configure" && configureRef.current) {
      rect = configureRef.current.getBoundingClientRect();
      offsetX = rect.left;
      offsetY = rect.top;
    } else {
      return;
    }
    
    // Calculate drop position relative to the container
    let newX = e.clientX - offsetX - (draggedPallet.size.width / 2);
    let newY = e.clientY - offsetY - (draggedPallet.size.height / 2);
    
    // Keep within bounds
    if (rect) {
      newX = Math.max(0, Math.min(newX, rect.width - draggedPallet.size.width));
      newY = Math.max(0, Math.min(newY, rect.height - draggedPallet.size.height));
    }
    
    // Update the pallet's position and area
    setPallets(prev => prev.map(pallet => {
      if (pallet.id === id) {
        return {
          ...pallet,
          position: { x: newX, y: newY },
          location: dropArea
        };
      }
      return pallet;
    }));
  };
  
  return (
    <>
      <Helmet>
        <title>Load Planning - LOADMdocs</title>
        <meta 
          name="description" 
          content="C27J Spartan cargo plane load planning tool for loadmasters." 
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
            <h2 className="text-2xl font-bold">C27J Spartan Load Planning</h2>
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
                  <Badge variant={totalWeight > 9000 ? "destructive" : "default"}>
                    {totalWeight.toLocaleString()} / 10,000 kg
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
                    <p className="text-lg">10,000 kg</p>
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
                      {pallet.weight} kg
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Drag pallets in and out of the cargo area. Only pallets in this area count toward total weight.
                </div>
              </CardContent>
            </Card>

            {/* Configure Pallets */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Configure Pallets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pallets.map((pallet) => (
                    <div key={pallet.id} className="bg-card border border-border rounded-md p-2">
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
                              max="5000"
                              value={pallet.weight}
                              onChange={(e) => handleWeightChange(pallet.id, e.target.value)}
                              className="h-7 text-sm"
                            />
                          </div>
                          <div className="ml-1 text-xs text-muted-foreground">kg</div>
                        </div>
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
                      {pallet.weight} kg
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