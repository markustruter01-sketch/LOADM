import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, Package2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Pallet {
  id: number;
  position: { x: number; y: number };
  placed: boolean;
  weight: number;
  size: { width: number; height: number };
}

interface DropZone {
  id: number;
  position: { x: number; y: number };
  occupied: boolean;
  area: "cargo" | "storage";
}

export default function LoadPlanningPage() {
  const [_, navigate] = useLocation();
  const [pallets, setPallets] = useState<Pallet[]>([
    { id: 1, position: { x: 0, y: 0 }, placed: false, weight: 1200, size: { width: 80, height: 60 } },
    { id: 2, position: { x: 0, y: 0 }, placed: false, weight: 1500, size: { width: 80, height: 60 } },
    { id: 3, position: { x: 0, y: 0 }, placed: false, weight: 900, size: { width: 80, height: 60 } },
  ]);
  
  // Define cargo area drop zones and storage area drop zones
  const [dropZones, setDropZones] = useState<DropZone[]>([
    // Cargo area drop zones
    { id: 1, position: { x: 200, y: 160 }, occupied: false, area: "cargo" },
    { id: 2, position: { x: 300, y: 160 }, occupied: false, area: "cargo" },
    { id: 3, position: { x: 400, y: 160 }, occupied: false, area: "cargo" },
    
    // Storage area drop zones
    { id: 4, position: { x: 200, y: 300 }, occupied: false, area: "storage" },
    { id: 5, position: { x: 300, y: 300 }, occupied: false, area: "storage" },
    { id: 6, position: { x: 400, y: 300 }, occupied: false, area: "storage" },
  ]);
  
  const [draggedPallet, setDraggedPallet] = useState<number | null>(null);
  const [totalWeight, setTotalWeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Calculate total weight of placed pallets in cargo area only
    const weight = pallets.reduce((total, pallet) => {
      // Find if this pallet is in a cargo drop zone
      const palletZone = dropZones.find(z => 
        z.occupied && 
        z.area === "cargo" &&
        z.position.x === pallet.position.x && 
        z.position.y === pallet.position.y
      );
      
      return palletZone ? total + pallet.weight : total;
    }, 0);
    
    setTotalWeight(weight);
  }, [pallets, dropZones]);
  
  const handleBackClick = () => {
    navigate("/");
  };
  
  const handleDragStart = (id: number) => {
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
  
  const handleDrop = (e: React.DragEvent, zoneId?: number) => {
    e.preventDefault();
    
    if (draggedPallet === null) return;
    
    // If dropping on a specific zone
    if (zoneId !== undefined) {
      const zone = dropZones.find(z => z.id === zoneId);
      if (zone && !zone.occupied) {
        // Find which zone the pallet was in before
        let oldZone: DropZone | undefined;
        const draggedPalletObj = pallets.find(p => p.id === draggedPallet);
        
        if (draggedPalletObj?.placed) {
          oldZone = dropZones.find(z => 
            z.position.x === draggedPalletObj.position.x && 
            z.position.y === draggedPalletObj.position.y
          );
        }
        
        // Update pallet position and placed status
        setPallets(prev => prev.map(pallet => {
          if (pallet.id === draggedPallet) {
            return {
              ...pallet,
              position: { 
                x: zone.position.x, 
                y: zone.position.y 
              },
              placed: true
            };
          }
          return pallet;
        }));
        
        // Update drop zones - mark new zone as occupied and old zone as free
        setDropZones(prev => prev.map(z => {
          if (z.id === zoneId) {
            return { ...z, occupied: true };
          }
          if (oldZone && z.id === oldZone.id) {
            return { ...z, occupied: false };
          }
          return z;
        }));
      }
    } else {
      // Dropping outside a zone - if it's a placed pallet, unplace it
      const pallet = pallets.find(p => p.id === draggedPallet);
      if (pallet && pallet.placed) {
        // Find the zone this pallet was in and mark it as unoccupied
        const oldZone = dropZones.find(z => 
          z.position.x === pallet.position.x && 
          z.position.y === pallet.position.y
        );
        
        if (oldZone) {
          setDropZones(prev => prev.map(z => {
            if (z.id === oldZone.id) {
              return { ...z, occupied: false };
            }
            return z;
          }));
        }
        
        // Reset pallet position
        setPallets(prev => prev.map(p => {
          if (p.id === draggedPallet) {
            return { ...p, position: { x: 0, y: 0 }, placed: false };
          }
          return p;
        }));
      }
    }
    
    setDraggedPallet(null);
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

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="max-w-5xl mx-auto">
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

          {/* Load Planning Area */}
          <div 
            className="bg-card rounded-lg p-6 shadow-lg" 
            ref={containerRef}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e)}
          >
            <div className="relative w-full" style={{ maxWidth: "800px", margin: "0 auto" }}>
              <div className="relative">
                {/* SVG Container */}
                <div className="relative mb-6">
                  <svg 
                    viewBox="0 0 800 400" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full"
                  >
                    {/* Background cargo floor diagram */}
                    <image 
                      href="/attached_assets/{D0501969-2858-4ED7-8B7B-5C07DCF79F7F}_1747281870002.png"
                      x="100" 
                      y="70" 
                      width="600" 
                      height="180"
                      opacity="0.4"
                    />
                    
                    {/* Cargo area */}
                    <rect 
                      x="180" 
                      y="120" 
                      width="440" 
                      height="120" 
                      fill="rgba(0,255,0,0.2)" 
                      stroke="rgba(0,255,0,0.5)" 
                      strokeWidth="2"
                      rx="5"
                      ry="5"
                    />
                    
                    {/* Label for cargo area */}
                    <text 
                      x="400" 
                      y="110" 
                      textAnchor="middle" 
                      fill="white" 
                      fontSize="16"
                      fontWeight="bold"
                    >
                      Cargo Area
                    </text>
                    
                    {/* Grid lines within cargo area */}
                    <line x1="280" y1="120" x2="280" y2="240" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5,5" />
                    <line x1="380" y1="120" x2="380" y2="240" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5,5" />
                    <line x1="480" y1="120" x2="480" y2="240" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5,5" />
                    <line x1="180" y1="180" x2="620" y2="180" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5,5" />
                    
                    {/* Storage area */}
                    <rect 
                      x="180" 
                      y="280" 
                      width="440" 
                      height="80" 
                      fill="rgba(100,100,100,0.2)" 
                      stroke="rgba(100,100,100,0.5)" 
                      strokeWidth="2"
                      rx="5"
                      ry="5"
                    />
                    
                    {/* Label for storage area */}
                    <text 
                      x="400" 
                      y="270" 
                      textAnchor="middle" 
                      fill="white" 
                      fontSize="16"
                      fontWeight="bold"
                    >
                      Storage Area
                    </text>
                    
                    {/* Grid lines within storage area */}
                    <line x1="280" y1="280" x2="280" y2="360" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5,5" />
                    <line x1="380" y1="280" x2="380" y2="360" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5,5" />
                    <line x1="480" y1="280" x2="480" y2="360" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5,5" />
                    
                    {/* Drop zones - both cargo and storage */}
                    {dropZones.map((zone) => (
                      <rect
                        key={zone.id}
                        x={zone.position.x}
                        y={zone.position.y}
                        width={80}
                        height={60}
                        fill={zone.occupied ? "rgba(0,0,0,0)" : (
                          zone.area === "cargo" ? "rgba(0,255,0,0.1)" : "rgba(255,255,255,0.1)"
                        )}
                        stroke={zone.occupied ? "rgba(0,0,0,0)" : (
                          zone.area === "cargo" ? "rgba(0,255,0,0.3)" : "rgba(255,255,255,0.3)"
                        )}
                        strokeWidth="2"
                        strokeDasharray={zone.occupied ? "0" : "5,5"}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, zone.id)}
                      />
                    ))}
                  </svg>
                </div>
                
                {/* Pallets Container (outside SVG) */}
                <div className="relative" style={{ height: "400px" }}>
                  {pallets.filter(pallet => pallet.placed).map((pallet) => (
                    <div
                      key={pallet.id}
                      draggable
                      onDragStart={() => handleDragStart(pallet.id)}
                      className="absolute cursor-move flex items-center justify-center font-bold text-white"
                      style={{
                        left: `${pallet.position.x}px`,
                        top: `${pallet.position.y}px`,
                        width: `${pallet.size.width}px`,
                        height: `${pallet.size.height}px`,
                        backgroundColor: 'rgba(255,165,0,0.7)',
                        border: '2px solid rgba(255,165,0,1)',
                        borderRadius: '4px',
                        userSelect: 'none',
                      }}
                    >
                      {`${pallet.weight} kg`}
                    </div>
                  ))}
                </div>
                
                {/* Legend */}
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center mr-4">
                    <div className="w-4 h-4 bg-green-500 bg-opacity-20 border border-green-500 border-opacity-50 rounded-sm mr-2"></div>
                    <span>Cargo Area</span>
                  </div>
                  <div className="inline-flex items-center mr-4">
                    <div className="w-4 h-4 bg-gray-500 bg-opacity-20 border border-gray-500 border-opacity-50 rounded-sm mr-2"></div>
                    <span>Storage Area</span>
                  </div>
                  <div className="inline-flex items-center">
                    <div className="w-4 h-4 bg-orange-500 bg-opacity-70 border border-orange-500 rounded-sm mr-2"></div>
                    <span>Pallets</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pallets weight edit section */}
            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-lg font-semibold mb-4">Configure Pallets</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {pallets.map((pallet) => (
                  <div
                    key={pallet.id}
                    className="bg-card border border-border rounded-md p-4"
                  >
                    <div className="flex items-center mb-3">
                      <Package2 className="h-5 w-5 mr-2 text-primary" />
                      <h4 className="font-medium">Pallet {pallet.id}</h4>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`weight-${pallet.id}`}>Weight (kg)</Label>
                      <div className="flex items-center">
                        <Input
                          id={`weight-${pallet.id}`}
                          type="number"
                          min="0"
                          max="5000"
                          value={pallet.weight}
                          onChange={(e) => handleWeightChange(pallet.id, e.target.value)}
                          className="w-full"
                        />
                      </div>
                      
                      <div className={`mt-2 text-xs ${!pallet.placed ? 'text-yellow-500' : (
                        dropZones.find(z => 
                          z.position.x === pallet.position.x && 
                          z.position.y === pallet.position.y && 
                          z.area === "cargo"
                        ) ? 'text-green-500' : 'text-gray-400'
                      )}`}>
                        {!pallet.placed ? 'Not placed' : (
                          dropZones.find(z => 
                            z.position.x === pallet.position.x && 
                            z.position.y === pallet.position.y && 
                            z.area === "cargo"
                          ) ? 'Loaded in cargo' : 'In storage'
                        )}
                      </div>
                    </div>
                    
                    {!pallet.placed && (
                      <div 
                        className="mt-3 bg-orange-500/70 border border-orange-500 rounded p-3 flex flex-col items-center justify-center cursor-move select-none"
                        draggable
                        onDragStart={() => handleDragStart(pallet.id)}
                      >
                        <Package2 className="h-6 w-6 mb-1" />
                        <span className="text-xs font-medium">Drag to place</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Load information */}
            <div className="mt-8">
              <div className="flex items-center mb-2">
                <Scale className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg font-semibold">Load Summary</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-muted rounded-md p-3">
                  <p className="font-medium">Current Load:</p>
                  <p className="text-xl">{totalWeight.toLocaleString()} kg</p>
                </div>
                <div className="bg-muted rounded-md p-3">
                  <p className="font-medium">Maximum Payload:</p>
                  <p className="text-xl">10,000 kg</p>
                </div>
                <div className="bg-muted rounded-md p-3">
                  <p className="font-medium">Available Space:</p>
                  <p>{3 - dropZones.filter(z => z.area === "cargo" && z.occupied).length} of 3 positions</p>
                </div>
                <div className="bg-muted rounded-md p-3">
                  <p className="font-medium">Cargo Compartment:</p>
                  <p>2.60m (H) × 2.45m (W) × 8.58m (L)</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-card border border-border rounded-md">
                <p className="text-sm">
                  <strong>Instructions:</strong> Drag and drop pallets into the cargo area or storage area.
                  Edit the weight of each pallet using the input fields.
                  Pallets in the cargo area count toward the total load weight.
                  Pallets can be moved between cargo and storage areas as needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}