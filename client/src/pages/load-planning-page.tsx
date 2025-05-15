import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function LoadPlanningPage() {
  const [_, navigate] = useLocation();

  const handleBackClick = () => {
    navigate("/");
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
          <div className="bg-card rounded-lg p-6 shadow-lg">
            <div className="relative w-full" style={{ maxWidth: "800px", margin: "0 auto" }}>
              {/* Aircraft Outline Container */}
              <div className="relative">
                {/* Aircraft Shape - Simplified C27J Spartan top-down view */}
                <svg 
                  viewBox="0 0 800 400" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full"
                >
                  {/* Fuselage outline */}
                  <path 
                    d="M200,200 L600,200 C650,200 700,180 750,150 L750,250 C700,220 650,200 600,200 L200,200 C150,200 100,220 50,250 L50,150 C100,180 150,200 200,200 Z" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="2"
                  />
                  
                  {/* Wings */}
                  <path 
                    d="M300,50 L300,350 M500,50 L500,350" 
                    stroke="white" 
                    strokeWidth="2"
                  />
                  
                  {/* Cargo area (filled with 20% opacity green) */}
                  <rect 
                    x="200" 
                    y="150" 
                    width="400" 
                    height="100" 
                    fill="rgba(0,255,0,0.2)" 
                    stroke="rgba(0,255,0,0.5)" 
                    strokeWidth="1"
                  />
                  
                  {/* Cockpit divider */}
                  <line 
                    x1="200" 
                    y1="150" 
                    x2="200" 
                    y2="250" 
                    stroke="white" 
                    strokeWidth="2"
                  />
                </svg>
                
                {/* Legend */}
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center mr-4">
                    <div className="w-4 h-4 bg-white rounded-sm mr-2"></div>
                    <span>Aircraft Outline</span>
                  </div>
                  <div className="inline-flex items-center">
                    <div className="w-4 h-4 bg-green-500 bg-opacity-20 border border-green-500 border-opacity-50 rounded-sm mr-2"></div>
                    <span>Cargo Area</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Load Planning Information</h3>
              <p className="mb-4">
                The C27J Spartan is a medium-sized military transport aircraft with a cargo capacity of 10,000 kg 
                and a cargo compartment measuring 2.60m high × A2.45m wide × 8.58m long.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-muted rounded-md p-3">
                  <p className="font-medium">Maximum Payload:</p>
                  <p className="text-xl">10,000 kg</p>
                </div>
                <div className="bg-muted rounded-md p-3">
                  <p className="font-medium">Cargo Compartment:</p>
                  <p>2.60m (H) × 2.45m (W) × 8.58m (L)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}