import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, Package2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";

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
}

export default function LoadPlanningPage() {
  const [_, navigate] = useLocation();
  const [pallets, setPallets] = useState<Pallet[]>([
    { id: 1, position: { x: 0, y: 0 }, placed: false, weight: 1200, size: { width: 80, height: 60 } },
    { id: 2, position: { x: 0, y: 0 }, placed: false, weight: 1500, size: { width: 80, height: 60 } },
    { id: 3, position: { x: 0, y: 0 }, placed: false, weight: 900, size: { width: 80, height: 60 } },
  ]);
  
  const [dropZones, setDropZones] = useState<DropZone[]>([
    { id: 1, position: { x: 200, y: 160 }, occupied: false },
    { id: 2, position: { x: 300, y: 160 }, occupied: false },
    { id: 3, position: { x: 400, y: 160 }, occupied: false },
    { id: 4, position: { x: 500, y: 160 }, occupied: false },
  ]);
  
  const [draggedPallet, setDraggedPallet] = useState<number | null>(null);
  const [totalWeight, setTotalWeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerBounds, setContainerBounds] = useState({ left: 0, top: 0 });
  
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerBounds({ left: rect.left, top: rect.top });
    }
    
    // Calculate total weight of placed pallets
    const weight = pallets.reduce((total, pallet) => {
      return pallet.placed ? total + pallet.weight : total;
    }, 0);
    setTotalWeight(weight);
  }, [pallets]);
  
  const handleBackClick = () => {
    navigate("/");
  };
  
  const handleDragStart = (id: number) => {
    setDraggedPallet(id);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent, zoneId?: number) => {
    e.preventDefault();
    
    if (draggedPallet === null) return;
    
    // If dropping on a specific zone
    if (zoneId !== undefined) {
      const zone = dropZones.find(z => z.id === zoneId);
      if (zone && !zone.occupied) {
        setPallets(prev => prev.map(pallet => {
          if (pallet.id === draggedPallet) {
            // Find the zone position and set pallet there
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
        
        // Mark the zone as occupied
        setDropZones(prev => prev.map(z => {
          if (z.id === zoneId) {
            return { ...z, occupied: true };
          }
          
          // If pallet was previously in another zone, free that zone
          if (z.occupied) {
            const palletInZone = pallets.find(p => 
              p.id === draggedPallet && 
              p.placed && 
              p.position.x === z.position.x && 
              p.position.y === z.position.y
            );
            
            if (palletInZone) {
              return { ...z, occupied: false };
            }
          }
          
          return z;
        }));
      }
    } else {
      // Dropping back to palette area (removing from cargo)
      const pallet = pallets.find(p => p.id === draggedPallet);
      if (pallet && pallet.placed) {
        // Find the zone this pallet was in and mark it as unoccupied
        setDropZones(prev => prev.map(zone => {
          if (
            zone.position.x === pallet.position.x &&
            zone.position.y === pallet.position.y
          ) {
            return { ...zone, occupied: false };
          }
          return zone;
        }));
        
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

          {/* Aircraft Diagram */}
          <div 
            className="bg-card rounded-lg p-6 shadow-lg" 
            ref={containerRef}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e)}
          >
            <div className="relative w-full" style={{ maxWidth: "800px", margin: "0 auto" }}>
              {/* Aircraft Outline Container */}
              <div className="relative">
                {/* Top-down view of C27J Spartan based on attached image */}
                <svg 
                  viewBox="0 0 800 400" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full"
                >
                  {/* Fuselage */}
                  <path 
                    d="M250,200 L550,200 C550,200 575,195 575,180 L600,150 L650,150 L650,250 L600,250 L575,220 C575,205 550,200 550,200 L250,200 C250,200 225,195 225,180 L200,150 L150,150 L150,250 L200,250 L225,220 C225,205 250,200 250,200 Z" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="2"
                  />
                  
                  {/* Wings */}
                  <path 
                    d="M300,100 L300,300 M500,100 L500,300" 
                    stroke="white" 
                    strokeWidth="2"
                  />
                  
                  {/* Tail fins */}
                  <path 
                    d="M650,150 L680,120 L680,150 M650,250 L680,280 L680,250" 
                    stroke="white" 
                    strokeWidth="2"
                    fill="none"
                  />
                  
                  {/* Cockpit */}
                  <path 
                    d="M150,150 L120,180 L120,220 L150,250" 
                    stroke="white" 
                    strokeWidth="2"
                    fill="none"
                  />
                  
                  {/* Cargo area (filled with 20% opacity green) */}
                  <rect 
                    x="180" 
                    y="160" 
                    width="440" 
                    height="80" 
                    fill="rgba(0,255,0,0.2)" 
                    stroke="rgba(0,255,0,0.5)" 
                    strokeWidth="1"
                  />
                  
                  {/* Grid lines within cargo area */}
                  <line x1="180" y1="200" x2="620" y2="200" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5,5" />
                  <line x1="280" y1="160" x2="280" y2="240" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5,5" />
                  <line x1="380" y1="160" x2="380" y2="240" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5,5" />
                  <line x1="480" y1="160" x2="480" y2="240" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5,5" />
                  <line x1="580" y1="160" x2="580" y2="240" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="5,5" />
                  
                  {/* Drop zones */}
                  {dropZones.map((zone) => (
                    <rect
                      key={zone.id}
                      x={zone.position.x}
                      y={zone.position.y}
                      width={80}
                      height={60}
                      fill={zone.occupied ? "rgba(0,0,0,0)" : "rgba(255,255,255,0.1)"}
                      stroke={zone.occupied ? "rgba(0,0,0,0)" : "rgba(255,255,255,0.5)"}
                      strokeWidth="2"
                      strokeDasharray={zone.occupied ? "0" : "5,5"}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, zone.id)}
                    />
                  ))}
                  
                  {/* Placed pallets */}
                  {pallets.map((pallet) => pallet.placed && (
                    <g
                      key={pallet.id}
                      transform={`translate(${pallet.position.x},${pallet.position.y})`}
                    >
                      <rect
                        width={pallet.size.width}
                        height={pallet.size.height}
                        fill="rgba(255,165,0,0.7)"
                        stroke="rgba(255,165,0,1)"
                        strokeWidth="2"
                        rx="2"
                        ry="2"
                      />
                      <text
                        x="40"
                        y="35"
                        textAnchor="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        {`${pallet.weight} kg`}
                      </text>
                    </g>
                  ))}
                </svg>
                
                {/* Legend */}
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center mr-4">
                    <div className="w-4 h-4 border border-white rounded-sm mr-2"></div>
                    <span>Aircraft Outline</span>
                  </div>
                  <div className="inline-flex items-center mr-4">
                    <div className="w-4 h-4 bg-green-500 bg-opacity-20 border border-green-500 border-opacity-50 rounded-sm mr-2"></div>
                    <span>Cargo Area</span>
                  </div>
                  <div className="inline-flex items-center">
                    <div className="w-4 h-4 bg-orange-500 bg-opacity-70 border border-orange-500 rounded-sm mr-2"></div>
                    <span>Pallets</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pallets section */}
            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-lg font-semibold mb-4">Available Pallets</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                {pallets.map((pallet) => !pallet.placed && (
                  <div
                    key={pallet.id}
                    className="bg-orange-500/70 border border-orange-500 rounded p-4 w-[120px] h-[90px] flex flex-col items-center justify-center cursor-move select-none"
                    draggable
                    onDragStart={() => handleDragStart(pallet.id)}
                  >
                    <Package2 className="h-8 w-8 mb-1" />
                    <span className="text-xs font-medium">{pallet.weight} kg</span>
                  </div>
                ))}
                
                {pallets.filter(p => !p.placed).length === 0 && (
                  <div className="text-muted-foreground italic">
                    All pallets are loaded. Drag pallets from the aircraft to remove them.
                  </div>
                )}
              </div>
            </div>
            
            {/* Load information */}
            <div className="mt-8">
              <div className="flex items-center mb-2">
                <Scale className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg font-semibold">Load Summary</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
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
                  <p>{4 - pallets.filter(p => p.placed).length} of 4 positions</p>
                </div>
                <div className="bg-muted rounded-md p-3">
                  <p className="font-medium">Cargo Compartment:</p>
                  <p>2.60m (H) × 2.45m (W) × 8.58m (L)</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-card border border-border rounded-md">
                <p className="text-sm">
                  <strong>Instructions:</strong> Drag and drop pallets into the cargo area of the C27J Spartan.
                  Pallets will snap to the available positions. To remove a pallet, drag it outside the aircraft.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}