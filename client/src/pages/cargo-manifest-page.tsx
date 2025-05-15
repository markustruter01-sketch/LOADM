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
        <style>
          {`
            input[type="text"] {
              color: white !important;
              font-weight: bold !important;
            }
          `}
        </style>
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
      
      {/* Passenger/Crew and Cargo Manifest Form */}
      <div id="cargo-manifest-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Passenger/Crew and Cargo Manifest</h2>
          <p className="text-muted-foreground mb-4">Generate and complete detailed cargo manifests for all shipments.</p>
          <CargoManifestForm />
        </div>
      </div>
      
      {/* Load Planning Form - C-17 Load Plan */}
      <div id="load-planning-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-5xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Load Planning Form</h2>
          <p className="text-muted-foreground mb-4">Complete detailed load planning documentation for cargo aircraft operations.</p>
          
          {/* C-17 Load Planning Form - Editable Version */}
          <div className="bg-white p-6 rounded-md border border-gray-300 text-black">
            
            {/* Header section with form fields */}
            <div className="grid grid-cols-6 gap-1 mb-4 border border-gray-800 text-sm">
              <div className="border-r border-gray-800 p-2 col-span-2">
                <div className="font-bold mb-1">1. UNIT BEING AIRLIFTED (Name or Number)</div>
                <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
              </div>
              <div className="border-r border-gray-800 p-2">
                <div className="font-bold mb-1">2. UNIT IDENTIFICATION CODE</div>
                <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
              </div>
              <div className="border-r border-gray-800 p-2">
                <div className="font-bold mb-1">3. TYPE MOVEMENT PLAN</div>
                <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
              </div>
              <div className="border-r border-gray-800 p-2">
                <div className="font-bold mb-1">4. MOVEMENT DATE</div>
                <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
              </div>
              <div className="p-2">
                <div className="font-bold mb-1">5. UNIT AIRCRAFT LOAD NO.</div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="col-span-1">
                    <div className="text-xs mb-1 text-center">OF</div>
                    <input type="text" className="w-full border-gray-300 rounded text-xs h-5" />
                  </div>
                  <div className="col-span-1 text-center">
                    <div className="text-xs mb-1">PAGE</div>
                    <input type="text" className="w-full border-gray-300 rounded text-xs h-5" />
                  </div>
                  <div className="col-span-1 text-center">
                    <div className="text-xs mb-1">PAGES</div>
                    <input type="text" className="w-full border-gray-300 rounded text-xs h-5" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Second row */}
            <div className="grid grid-cols-6 gap-1 mb-4 border border-gray-800 text-sm">
              <div className="border-r border-gray-800 p-2">
                <div className="font-bold mb-1">6. MISSION NUMBER</div>
                <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
              </div>
              <div className="border-r border-gray-800 p-2">
                <div className="font-bold mb-1">7. AIRCRAFT SERIAL NUMBER</div>
                <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
              </div>
              <div className="border-r border-gray-800 p-2">
                <div className="font-bold mb-1">8. CONFIGURATION</div>
                <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
              </div>
              <div className="border-r border-gray-800 p-2">
                <div className="font-bold mb-1">9. DEPARTURE AIRFIELD</div>
                <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
              </div>
              <div className="col-span-2 p-2">
                <div className="font-bold mb-1">10. DESTINATION AIRFIELD</div>
                <input type="text" className="w-full border-gray-300 rounded text-sm h-7" />
              </div>
            </div>
            
            {/* Aircraft layout image */}
            <div className="mb-4 relative">
              <img 
                src="/DD-Form-2130-13-C-17-load-plan-w-cargo-pallet-positions-39.png" 
                alt="C-17 Load Plan with Cargo Pallet Positions" 
                className="w-full object-contain border border-gray-800"
              />
            </div>
            
            {/* Cargo Table */}
            <div className="border border-gray-800 mb-4">
              <div className="grid grid-cols-12 gap-0 text-xs border-b border-gray-800">
                <div className="border-r border-gray-800 p-1 text-center font-bold col-span-1">LOAD SEQUENCE</div>
                <div className="border-r border-gray-800 p-1 text-center font-bold col-span-2">A. ITEM MODEL AND NOMENCLATURE/DESCRIPTION</div>
                <div className="border-r border-gray-800 p-1 text-center font-bold col-span-1">B. TRANSPORTATION CONTROL NO. VEHICLE PKG MKG SYMBOL NO. DOCUMENT NO.</div>
                <div className="border-r border-gray-800 p-1 text-center font-bold col-span-1">C. REMARKS</div>
                <div className="border-r border-gray-800 p-1 text-center font-bold col-span-1">D. DIMENSIONS/DATA LENGTH/WIDTH/HEIGHT</div>
                <div className="border-r border-gray-800 p-1 text-center font-bold col-span-1">E. PLANNED LOAD DATA TOTAL WEIGHT</div>
                <div className="border-r border-gray-800 p-1 text-center font-bold col-span-1">F. GROSS WEIGHT (Floor Attach)</div>
                <div className="border-r border-gray-800 p-1 text-center font-bold col-span-1">G. FUSELAGE STATION</div>
                <div className="border-r border-gray-800 p-1 text-center font-bold col-span-1">H. MOMENT (Floor Attach)</div>
                <div className="border-r border-gray-800 p-1 text-center font-bold col-span-1">I. GROSS WEIGHT (Tiedown Rings)</div>
                <div className="border-r border-gray-800 p-1 text-center font-bold col-span-1">J. FUSELAGE STATION</div>
                <div className="p-1 text-center font-bold col-span-1">K. MOMENT (Tiedown Rings)</div>
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-12 gap-0 text-xs border-b border-gray-800">
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-2">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
              </div>
              
              {/* Row 2 */}
              <div className="grid grid-cols-12 gap-0 text-xs border-b border-gray-800">
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-2">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
              </div>
              
              {/* Row 3 */}
              <div className="grid grid-cols-12 gap-0 text-xs border-b border-gray-800">
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-2">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
              </div>
              
              {/* Row 4 */}
              <div className="grid grid-cols-12 gap-0 text-xs border-b border-gray-800">
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-2">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="border-r border-gray-800 p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
                <div className="p-1 col-span-1">
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
                </div>
              </div>
            </div>
            
            {/* Bottom Section */}
            <div className="grid grid-cols-7 gap-0 text-xs border border-gray-800 mb-4">
              <div className="border-r border-gray-800 p-1 col-span-2">
                <div className="font-bold mb-1 text-center">11. PASSENGER DATA PLANNING DATA</div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="font-bold text-right pr-1">NUMBER SEATS</div>
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-5" />
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <div className="font-bold text-right pr-1">AVG. WEIGHT (Pounds Each)</div>
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-5" />
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <div className="font-bold text-right pr-1">TOTAL PLANNED WT.</div>
                  <input type="text" className="w-full border-gray-300 rounded text-xs h-5" />
                </div>
              </div>
              <div className="border-r border-gray-800 p-1">
                <div className="font-bold mb-1 text-center">12. TOTAL WEIGHT/MOMENT FROM BACK TOTALS</div>
                <input type="text" className="w-full border-gray-300 rounded text-xs h-16" />
              </div>
              <div className="border-r border-gray-800 p-1 col-span-2">
                <div className="font-bold mb-1 text-center">LOAD CG STATION</div>
                <input type="text" className="w-full border-gray-300 rounded text-xs h-16" />
              </div>
              <div className="p-1 col-span-2">
                <div className="font-bold mb-1 text-center">LOAD CG STATION</div>
                <input type="text" className="w-full border-gray-300 rounded text-xs h-16" />
              </div>
            </div>
            
            {/* Load Planner and Validator Section */}
            <div className="grid grid-cols-4 gap-0 text-xs">
              <div className="border border-gray-800 p-1">
                <div className="font-bold mb-1">13a. LOAD PLANNER</div>
                <input type="text" className="w-full border-gray-300 rounded text-xs h-5 mb-1" />
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <div className="text-xs mb-1">DATE CERTIFIED</div>
                    <input type="text" className="w-full border-gray-300 rounded text-xs h-5" />
                  </div>
                  <div>
                    <div className="text-xs mb-1">TYPED/PRINTED NAME, GRADE, ORGANIZATION OF LOAD PLANNER</div>
                    <input type="text" className="w-full border-gray-300 rounded text-xs h-5" />
                  </div>
                </div>
              </div>
              <div className="border-t border-b border-r border-gray-800 p-1">
                <div className="font-bold mb-1">SIGNATURE</div>
                <input type="text" className="w-full border-gray-300 rounded text-xs h-12" />
              </div>
              <div className="border-t border-b border-r border-gray-800 p-1 col-span-2">
                <div className="font-bold mb-1">REMARKS</div>
                <div className="h-full">
                  <div className="text-xs mb-1 font-bold">L. OFF CENTER OF GRAVITY (LEFT)</div>
                  <div className="text-xs mb-1 font-bold">1. CENTER LINE</div>
                  <div className="text-xs mb-1 font-bold">R. RUNNING LASHING (2 REQD PER 10,000 LB)</div>
                  <div className="text-xs mb-1 font-bold">2. 463L PALLET</div>
                  <div className="text-xs mb-1 font-bold">3. WHEEL OR AXLE BLOCKING</div>
                  <div className="text-xs mb-1 font-bold">4. SHORING</div>
                  <div className="text-xs mb-1 font-bold">5. SPECIAL INSTRUCTIONS</div>
                </div>
              </div>
              <div className="border border-gray-800 p-1 col-span-2">
                <div className="font-bold mb-1">13b. ACTUAL LOAD PLAN VALIDATOR</div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <div className="text-xs mb-1">DATE CERTIFIED</div>
                    <input type="text" className="w-full border-gray-300 rounded text-xs h-5" />
                  </div>
                  <div>
                    <div className="text-xs mb-1">TYPED/PRINTED NAME, GRADE, ORGANIZATION OF LOAD PLAN VALIDATOR</div>
                    <input type="text" className="w-full border-gray-300 rounded text-xs h-5" />
                  </div>
                </div>
              </div>
              <div className="border-b border-r border-l border-gray-800 p-1 col-span-2">
                <div className="font-bold mb-1">SIGNATURE</div>
                <input type="text" className="w-full border-gray-300 rounded text-xs h-8" />
              </div>
            </div>
            
            {/* Form Footer */}
            <div className="mt-4 grid grid-cols-2 text-xs">
              <div>DD FORM 2130-13, SEP 1998</div>
              <div className="text-right font-bold">C-17 LOAD PLAN</div>
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
      
      {/* Dangerous Goods Declaration */}
      <div id="dangerous-goods-declaration-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Dangerous Goods Declaration</h2>
          <p className="text-muted-foreground mb-4">Complete DG documentation for hazardous materials transportation.</p>
          
          {/* DG Acceptance Checklist */}
          <div className="bg-white p-4 rounded-md border border-gray-300 flex justify-center">
            <img 
              src="/D.G.-Acceptance-ChecklistDry-2018-729x1024.jpg" 
              alt="Dangerous Goods Acceptance Checklist" 
              className="w-full object-contain max-w-3xl"
            />
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
      
      {/* Weight & Balance Sheet - Airbus A330 Load and Trim Sheet */}
      <div id="weight-balance-sheet-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Weight & Balance Sheet</h2>
          <p className="text-muted-foreground mb-4">Calculate and document aircraft weight distribution and balance.</p>
          
          {/* Direct image embed of the A330 Load and Trim Sheet */}
          <div className="bg-white p-4 rounded-md border border-gray-300 flex justify-center">
            <img 
              src="/Load and Trimsheet A330_zoom.png" 
              alt="Airbus A330 Load and Trim Sheet" 
              className="w-full object-contain"
            />
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