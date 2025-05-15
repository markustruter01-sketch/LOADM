import { CargoManifestForm } from "@/components/CargoManifestForm";
import DocumentMenu from "@/components/DocumentMenu";
import { Helmet } from "react-helmet";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useLocation } from "wouter";

export default function DocumentsPage() {
  const [_, navigate] = useLocation();
  
  const handleBackClick = () => {
    navigate("/");
  };

  // Check if we need to scroll to a form based on hash or sessionStorage
  useEffect(() => {
    // First check URL hash
    const hash = window.location.hash;
    if (hash) {
      const elementId = hash.substring(1); // Remove the # character
      const element = document.getElementById(elementId);
      
      if (element) {
        // Delay scrolling to make sure the page is fully loaded
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
      return; // Skip the rest if hash exists
    }
    
    // Check sessionStorage for scrollToFormId
    const scrollToFormId = sessionStorage.getItem('scrollToFormId');
    if (scrollToFormId) {
      // Clear the value immediately to prevent unwanted scrolls on future page loads
      sessionStorage.removeItem('scrollToFormId');
      
      // Try to find the element - if it exists, scroll to it
      const element = document.getElementById(scrollToFormId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>Documents - LOADMdocs</title>
        <meta name="description" content="Document forms for military cargo load planning" />
      </Helmet>
      
      {/* Back button and document menu */}
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-2">
          {/* Back Button - Aligned with Documents title */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-0 mr-4"
            onClick={handleBackClick}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
        
        {/* Document menu showing all available document forms */}
        <DocumentMenu />
      </div>
      
      {/* Document forms */}
      
      {/* Cargo Manifest Form */}
      {window.location.hash === '#cargo-manifest-form' && (
        <div className="container mx-auto pb-20">
          <CargoManifestForm />
        </div>
      )}
      
      {/* Load Planning Form */}
      <div id="load-planning-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Load Planning Form</h2>
          <p className="text-muted-foreground mb-4">Complete detailed load planning documentation for cargo aircraft operations.</p>
          <div className="bg-secondary/20 p-6 rounded-md text-center">
            <p>Load Planning Form will be implemented here.</p>
          </div>
        </div>
      </div>
      
      {/* Dangerous Goods Declaration */}
      <div id="dangerous-goods-declaration-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Dangerous Goods Declaration</h2>
          <p className="text-muted-foreground mb-4">Complete DG documentation for hazardous materials transportation.</p>
          <div className="bg-secondary/20 p-6 rounded-md text-center">
            <p>Dangerous Goods Declaration form will be implemented here.</p>
          </div>
        </div>
      </div>
      
      {/* Weight & Balance Sheet - Airbus A330 Load and Trim Sheet */}
      <div id="weight-balance-sheet-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-5xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Weight & Balance Sheet</h2>
          <p className="text-muted-foreground mb-4">Calculate and document aircraft weight distribution and balance.</p>
          
          {/* Airbus A330 Load and Trim Sheet Form */}
          <div className="bg-white p-6 rounded-md border border-gray-300 text-black">
            {/* Header */}
            <div className="grid grid-cols-3 gap-1 mb-4 border border-gray-600">
              <div className="border-r border-gray-600 p-2 flex items-center">
                <span className="font-bold text-lg">
                  <svg viewBox="0 0 200 40" className="h-8 w-20">
                    <path d="M35,20 a15,15 0 1,0 30,0 a15,15 0 1,0 -30,0" fill="none" stroke="black" strokeWidth="2" />
                    <text x="60" y="25" fontFamily="Arial" fontSize="22" fontWeight="bold">AIRBUS</text>
                  </svg>
                </span>
              </div>
              <div className="border-r border-gray-600 p-2 flex items-center justify-center">
                <span className="font-bold text-center text-xl">LOAD and TRIM SHEET</span>
              </div>
              <div className="p-2 text-center">
                <div className="font-bold">A330-243</div>
                <div className="text-sm">VERSION : 18 BC-264 YC</div>
              </div>
            </div>
            
            {/* Three-column section */}
            <div className="grid grid-cols-3 gap-1 mb-4">
              {/* Left column - Dry Operating Weight Conditions */}
              <div className="space-y-1">
                <div className="border border-gray-600 p-1">
                  <div className="text-center text-sm font-bold border-b border-gray-300 pb-1">DRY OPERATING WEIGHT CONDITIONS</div>
                  <div className="grid grid-cols-2 gap-0">
                    <div className="border-r border-gray-300 p-1">
                      <div className="text-xs">WEIGHT (kg)</div>
                      <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
                    </div>
                    <div className="p-1">
                      <div className="text-xs">H-ARM (m)</div>
                      <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
                    </div>
                  </div>
                </div>
                <div className="border border-gray-600 p-1">
                  <div className="text-xs text-center font-bold mb-1">LIMITATION MASS / IX</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="text-right">MTOW</div>
                    <div className="text-left">= 230000</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="text-right">MZFW</div>
                    <div className="text-left">= 170000</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="text-right">MLW</div>
                    <div className="text-left">= 180000</div>
                  </div>
                  <div className="text-xs text-center font-bold mt-2 mb-1">DRY OPERATING WEIGHT INDEX</div>
                  <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
                </div>
              </div>
              
              {/* Middle column - Aircraft Register & Flight Details */}
              <div className="border border-gray-600 p-1">
                <div className="text-center text-sm font-bold border-b border-gray-300 pb-1">AIRCRAFT REGISTER:</div>
                <div className="grid grid-cols-2 gap-0">
                  <div className="border-r border-gray-300 p-1">
                    <div className="text-xs">DATE:</div>
                    <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
                    <div className="text-xs mt-2">FLT NBR:</div>
                    <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
                    <div className="text-xs mt-2">FROM:</div>
                    <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
                  </div>
                  <div className="p-1">
                    <div className="text-xs">PREPARED BY:</div>
                    <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
                    <div className="text-xs mt-2">CAPT. SIGNATURE:</div>
                    <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
                    <div className="text-xs mt-2">TO:</div>
                    <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
                  </div>
                </div>
              </div>
              
              {/* Right column - Weight calculations */}
              <div className="border border-gray-600 p-1">
                <div className="text-center text-sm font-bold border-b border-gray-300 pb-1">DRY OPERATING WEIGHT</div>
                <div className="flex justify-between items-center text-xs p-1">
                  <span>WEIGHT DEVIATION (PANTRY):</span>
                  <input type="text" className="w-16 border-gray-300 rounded text-sm h-7" />
                </div>
                <div className="flex justify-between items-center text-xs p-1">
                  <span>CORRECTED DRY OPERATING WEIGHT:</span>
                  <input type="text" className="w-16 border-gray-300 rounded text-sm h-7" />
                </div>
                <div className="flex justify-between items-center text-xs p-1">
                  <span>CARGO:</span>
                  <input type="text" className="w-16 border-gray-300 rounded text-sm h-7" />
                </div>
                <div className="flex justify-between items-center text-xs p-1">
                  <span>PASSENGERS:</span>
                  <div className="grid grid-cols-3 gap-1 items-center">
                    <input type="text" className="w-8 border-gray-300 rounded text-sm h-7" />
                    <span>x</span>
                    <input type="text" className="w-8 border-gray-300 rounded text-sm h-7" />
                    <span>=</span>
                    <input type="text" className="w-12 border-gray-300 rounded text-sm h-7" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs p-1">
                  <span>ZERO FUEL WEIGHT:</span>
                  <input type="text" className="w-16 border-gray-300 rounded text-sm h-7" />
                </div>
                <div className="flex justify-between items-center text-xs p-1">
                  <span>TOTAL FUEL ONBOARD:</span>
                  <input type="text" className="w-16 border-gray-300 rounded text-sm h-7" />
                </div>
                <div className="flex justify-between items-center text-xs p-1">
                  <span>TAKEOFF WEIGHT:</span>
                  <input type="text" className="w-16 border-gray-300 rounded text-sm h-7" />
                </div>
              </div>
            </div>
            
            {/* Index Correction Zones */}
            <div className="mb-4">
              <div className="text-center text-sm font-bold mb-2">INDEX CORRECTION ZONES</div>
              <div className="flex">
                <div className="w-24">
                  <div className="grid grid-cols-5 gap-0 text-center border border-gray-600">
                    <div className="p-1 border-r border-gray-600 text-xs">ZONES</div>
                    <div className="p-1 border-r border-gray-600 text-xs">E</div>
                    <div className="p-1 border-r border-gray-600 text-xs">F</div>
                    <div className="p-1 border-r border-gray-600 text-xs">G</div>
                    <div className="p-1 text-xs">H</div>
                  </div>
                  <div className="grid grid-cols-5 gap-0 text-center border border-t-0 border-gray-600">
                    <div className="p-1 border-r border-gray-600 text-xs">WEIGHT DEVIATION</div>
                    <div className="p-1 border-r border-gray-600"></div>
                    <div className="p-1 border-r border-gray-600"></div>
                    <div className="p-1 border-r border-gray-600"></div>
                    <div className="p-1 bg-gray-200"></div>
                  </div>
                </div>
                <div className="flex-grow ml-4">
                  <div className="relative bg-gray-100 border border-gray-600 p-1 h-24">
                    {/* Aircraft seat layout representation */}
                    <div className="relative h-full">
                      <div className="absolute inset-x-0 top-4 w-full h-6 bg-white border border-gray-400 rounded-full"></div>
                      <div className="absolute inset-x-0 top-2 w-3/4 mx-auto h-10 bg-gray-100 flex justify-between">
                        <div className="text-xs">E</div>
                        <div className="text-xs">F</div>
                        <div className="text-xs">G</div>
                        <div className="text-xs">H</div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 w-11/12 mx-auto">
                        <div className="flex justify-between text-xs">
                          <div>PAX</div>
                          <div>CARGO</div>
                        </div>
                      </div>
                      
                      {/* Yellow seat markers */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex gap-1">
                          <div className="bg-yellow-300 h-3 w-3 rounded-full"></div>
                          <div className="bg-yellow-300 h-3 w-3 rounded-full"></div>
                          <div className="bg-yellow-300 h-3 w-3 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Basic Index Correction */}
            <div className="mb-4">
              <div className="border border-gray-600">
                <div className="text-center text-sm font-bold p-1 border-b border-gray-300">BASIC INDEX CORRECTION</div>
                <div className="grid grid-cols-6 gap-0 text-center border-b border-gray-300">
                  <div className="p-1 border-r border-gray-600 text-xs col-span-2">DRY OPERAT. WEIGHT DEVIATION</div>
                  <div className="p-1 border-r border-gray-600 text-center text-xs">E</div>
                  <div className="p-1 border-r border-gray-600 text-center text-xs">F</div>
                  <div className="p-1 border-r border-gray-600 text-center text-xs">G</div>
                  <div className="p-1 text-center text-xs">H</div>
                </div>
                <div className="grid grid-cols-6 gap-0 text-center border-b border-gray-300">
                  <div className="p-1 border-r border-gray-600 text-xs col-span-2">+350 kg</div>
                  <div className="p-1 border-r border-gray-600 text-center text-xs">-1.30</div>
                  <div className="p-1 border-r border-gray-600 text-center text-xs">-0.92</div>
                  <div className="p-1 border-r border-gray-600 text-center text-xs">+1.22</div>
                  <div className="p-1 text-center text-xs">+2.50</div>
                </div>
                <div className="grid grid-cols-6 gap-0 text-center">
                  <div className="p-1 border-r border-gray-600 text-xs col-span-2">+350 kg</div>
                  <div className="p-1 border-r border-gray-600 text-center text-xs">-1.30</div>
                  <div className="p-1 border-r border-gray-600 text-center text-xs">-0.92</div>
                  <div className="p-1 border-r border-gray-600 text-center text-xs">+1.22</div>
                  <div className="p-1 text-center text-xs">+2.50</div>
                </div>
              </div>
            </div>
            
            {/* Index Scale & Corrections */}
            <div className="mb-4 flex gap-4">
              <div className="border border-gray-600 w-1/4 p-2">
                <div className="text-xs font-bold">INDEX CORRECTION</div>
                <div className="grid grid-cols-3 gap-0 text-center border-t border-gray-300 mt-1">
                  <div className="p-1 border-r border-gray-300 text-xs">ZONES</div>
                  <div className="p-1 border-r border-gray-300 text-xs">Nbr</div>
                  <div className="p-1 text-xs">WEIGHT(kg)</div>
                </div>
                <div className="min-h-24 py-2"></div>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="w-12 h-12 flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 40 40">
                    <polygon points="0,20 40,20 20,40" fill="black"/>
                  </svg>
                </div>
              </div>
              
              <div className="border border-gray-600 w-1/3 p-2 flex items-center justify-center">
                <div>
                  <div className="text-center text-sm font-bold">CORRECTED INDEX</div>
                  <input type="text" className="w-full border-gray-300 rounded text-sm h-10 mt-2" />
                </div>
              </div>
            </div>
            
            {/* Weight Chart */}
            <div className="mb-4">
              <div className="flex justify-end mb-1">
                <div className="text-xs font-bold">ALL WEIGHTS IN KILOGRAMS</div>
              </div>
              <div className="h-44 relative overflow-hidden border border-gray-600">
                <div className="relative h-full">
                  {/* Index Scale */}
                  <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-1 text-xs">
                    <span>70</span>
                    <span>80</span>
                    <span>90</span>
                    <span>100</span>
                    <span>110</span>
                    <span>120</span>
                    <span>130</span>
                    <span>140</span>
                    <span>INDEX</span>
                  </div>
                  
                  {/* Weight Bars */}
                  <div className="absolute top-8 left-0 right-0 bottom-0">
                    <div className="relative h-full">
                      {/* Diagonal lines as background pattern */}
                      <div className="absolute inset-0 bg-white" style={{ 
                        backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)' 
                      }}></div>
                      
                      {/* Weight Bars Rows */}
                      <div className="absolute inset-0 grid grid-rows-9 h-full">
                        <div className="border-b border-gray-300 text-xs p-1 flex justify-between">
                          <span>CARGO 1</span>
                          <span className="pr-12">600 kg</span>
                        </div>
                        <div className="border-b border-gray-300 text-xs p-1 flex justify-between">
                          <span>CARGO 2</span>
                          <span className="pr-12">600 kg</span>
                        </div>
                        <div className="border-b border-gray-300 text-xs p-1 flex justify-between">
                          <span>CARGO 3</span>
                          <span className="pr-12">600 kg</span>
                        </div>
                        <div className="border-b border-gray-300 text-xs p-1 flex justify-between">
                          <span>CARGO 4</span>
                          <span className="pr-12">750 kg</span>
                        </div>
                        <div className="border-b border-gray-300 text-xs p-1 flex justify-between">
                          <span>CARGO 5</span>
                          <span className="pr-12">350 kg</span>
                        </div>
                        <div className="border-b border-gray-300 text-xs p-1 flex justify-between">
                          <span>CABIN OB</span>
                          <span className="pr-12">50 PAX</span>
                        </div>
                        <div className="border-b border-gray-300 text-xs p-1 flex justify-between">
                          <span>CABIN OC</span>
                          <span className="pr-12">80 PAX</span>
                        </div>
                        <div className="border-b border-gray-300 text-xs p-1 flex justify-between">
                          <span>FUEL INDEX</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Envelope Chart */}
            <div className="mb-4 grid grid-cols-6 gap-1">
              <div className="border border-gray-600 p-1">
                <div className="text-center text-xs font-bold mb-1">NOTES</div>
                <textarea className="w-full h-16 border-gray-300 rounded text-xs"></textarea>
              </div>
              <div className="col-span-5 border border-gray-600 p-1">
                <div className="h-48 bg-gray-100 relative">
                  {/* Envelope Graph - Simplified Representation */}
                  <div className="absolute inset-0">
                    {/* X axis labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs px-2">
                      <span>80</span>
                      <span>90</span>
                      <span>100</span>
                      <span>110</span>
                      <span>120</span>
                      <span>130</span>
                      <span>140</span>
                    </div>
                    <div className="absolute bottom-4 right-4 text-xs">
                      <span>INDEX %</span>
                    </div>
                    
                    {/* Y axis labels */}
                    <div className="absolute top-0 left-0 bottom-8 flex flex-col justify-between text-xs">
                      <span>230</span>
                      <span>210</span>
                      <span>190</span>
                      <span>170</span>
                      <span>150</span>
                      <span>130</span>
                      <span>110</span>
                    </div>
                    
                    {/* Grid Lines */}
                    <div className="absolute inset-0 m-8 border border-gray-400"></div>
                    
                    {/* Envelope shape */}
                    <div className="absolute inset-0 m-8">
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M10,10 L90,20 L90,80 L10,90 Z" fill="none" stroke="gray" strokeWidth="1" strokeDasharray="5,5" />
                      </svg>
                    </div>
                    
                    {/* Limits Labels */}
                    <div className="absolute bottom-12 right-8 text-xs">
                      <div>OPERATIONAL LIMITS</div>
                      <div>― TAKEOFF</div>
                      <div>---- ZFW</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Sections */}
            <div className="grid grid-cols-6 gap-1">
              <div className="border border-gray-600 p-1 text-center">
                <div className="text-xs font-bold">TAKEOFF</div>
                <div className="text-xs">
                  <div>CG % MAC</div>
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-6" />
                </div>
              </div>
              <div className="border border-gray-600 p-1 text-center col-span-2">
                <div className="text-xs font-bold">ZFW CG INPUT</div>
                <div className="grid grid-cols-5 gap-1 text-xs">
                  <div className="text-xs">WEIGHT (kg x 1000)</div>
                  <div className="text-xs">AIRCRAFT CG % MAC</div>
                  <div className="col-span-3"></div>
                </div>
                <div className="grid grid-cols-5 gap-1 mt-1">
                  <input type="text" className="border-gray-300 rounded text-xs h-6" />
                  <input type="text" className="border-gray-300 rounded text-xs h-6" />
                  <div className="col-span-3 flex justify-around items-center text-xs">
                    <span>19</span>
                    <span>20</span>
                    <span>21</span>
                    <span>22</span>
                    <span>23</span>
                    <span>24</span>
                    <span>25</span>
                    <span>26</span>
                    <span>27</span>
                    <span>28</span>
                  </div>
                </div>
              </div>
              <div className="col-span-3"></div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="mt-6 flex justify-end space-x-4">
            <Button variant="outline">Reset</Button>
            <Button className="bg-primary text-white hover:bg-primary/90">Save</Button>
            <Button className="bg-primary text-white hover:bg-primary/90">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>
      
      {/* Cargo Floor Loading Plan */}
      <div id="cargo-floor-loading-plan-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Cargo Floor Loading Plan</h2>
          <p className="text-muted-foreground mb-4">Detailed diagram and specifications for floor-loaded cargo.</p>
          <div className="bg-secondary/20 p-6 rounded-md text-center">
            <p>Cargo Floor Loading Plan form will be implemented here.</p>
          </div>
        </div>
      </div>
      
      {/* Pallet Build-Up Form */}
      <div id="pallet-build-up-form-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Pallet Build-Up Form</h2>
          <p className="text-muted-foreground mb-4">Documentation for the configuration and build-up of air cargo pallets.</p>
          <div className="bg-secondary/20 p-6 rounded-md text-center">
            <p>Pallet Build-Up Form will be implemented here.</p>
          </div>
        </div>
      </div>
    </>
  );
}