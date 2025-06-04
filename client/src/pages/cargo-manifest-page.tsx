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
        <title>Documents - LOADMworkflow</title>
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

      {/* Special Handling Form */}
      <div id="special-handling-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Special Handling Form</h2>
          <p className="text-muted-foreground mb-4">Document special handling requirements for unusual cargo types or sensitive items.</p>
          
          {/* ADF Special Handling Requirements Form */}
          <div className="bg-white p-6 rounded-md border border-gray-300 text-black">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <div className="text-lg font-bold">ROYAL AUSTRALIAN AIR FORCE</div>
              <div className="text-lg font-bold">SPECIAL HANDLING REQUIREMENTS FORM</div>
              <div className="text-sm mt-2">RAAF FORM 86SQN-001</div>
            </div>
            
            {/* Aircraft and Mission Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">AIRCRAFT TYPE:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" placeholder="C-17A Globemaster / C-130J Hercules / KC-30A MRTT" />
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">AIRCRAFT SERIAL:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" placeholder="A41-XXX" />
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">MISSION NUMBER:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" />
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">DATE:</div>
                <input type="date" className="w-full border border-gray-300 p-2 text-sm" />
              </div>
            </div>
            
            {/* Special Handling Categories */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-3 bg-gray-200 p-2">SPECIAL HANDLING CATEGORY (Select all applicable):</div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Live Animals (AVI)</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Human Remains (HUM)</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Classified Material (SEC)</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Sensitive Equipment (SEN)</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Medical Supplies (MED)</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Ammunition (AMM)</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> High Value Cargo (HVC)</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Temperature Control Required (TCR)</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Fragile Equipment (FRA)</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Other (Specify in remarks)</label>
              </div>
            </div>
            
            {/* Detailed Requirements */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-2 bg-gray-200 p-2">DETAILED HANDLING REQUIREMENTS:</div>
              <textarea className="w-full border border-gray-300 p-3 text-sm h-24" placeholder="Detail specific handling, storage, or transportation requirements including temperature ranges, orientation restrictions, security protocols, etc."></textarea>
            </div>
            
            {/* Environmental Controls */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">TEMPERATURE RANGE:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" placeholder="°C Min/Max" />
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">HUMIDITY CONTROL:</div>
                <select className="w-full border border-gray-300 p-2 text-sm">
                  <option>Not Required</option>
                  <option>Controlled Environment</option>
                  <option>Low Humidity (&lt;50%)</option>
                  <option>Critical Control Required</option>
                </select>
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">ORIENTATION:</div>
                <select className="w-full border border-gray-300 p-2 text-sm">
                  <option>Any Orientation</option>
                  <option>This Side Up Only</option>
                  <option>Do Not Invert</option>
                  <option>Specific (See Remarks)</option>
                </select>
              </div>
            </div>
            
            {/* Approval Section */}
            <div className="border-t-2 border-black pt-4 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="font-bold text-sm mb-2">REQUESTED BY:</div>
                  <div className="mb-2">Name: ________________________________</div>
                  <div className="mb-2">Rank/Grade: __________________________</div>
                  <div className="mb-2">Unit: _________________________________</div>
                  <div className="mb-2">Service Number: ______________________</div>
                  <div className="mb-2">Signature: ____________________________</div>
                  <div>Date: _____________________________________</div>
                </div>
                <div>
                  <div className="font-bold text-sm mb-2">APPROVED BY LOADMASTER:</div>
                  <div className="mb-2">Name: ________________________________</div>
                  <div className="mb-2">Rank: ________________________________</div>
                  <div className="mb-2">Service Number: ______________________</div>
                  <div className="mb-2">Qualification: ________________________</div>
                  <div className="mb-2">Signature: ____________________________</div>
                  <div>Date: _____________________________________</div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-400 pt-2 mt-4 text-xs text-center">
              RAAF FORM 86SQN-001 (JAN 2025) - SPECIAL HANDLING REQUIREMENTS
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

      {/* Aircraft Tie-Down Diagram */}
      <div id="tie-down-diagram-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Aircraft Tie-Down Diagram</h2>
          <p className="text-muted-foreground mb-4">Detailed cargo restraint planning diagram with tie-down points and calculations.</p>
          
          {/* ADF Tie-Down Planning Form */}
          <div className="bg-white p-6 rounded-md border border-gray-300 text-black">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <div className="text-lg font-bold">ROYAL AUSTRALIAN AIR FORCE</div>
              <div className="text-lg font-bold">CARGO TIE-DOWN RESTRAINT PLAN</div>
              <div className="text-sm mt-2">RAAF FORM 86SQN-002</div>
            </div>
            
            {/* Aircraft and Load Details */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">AIRCRAFT TYPE:</div>
                <select className="w-full border border-gray-300 p-2 text-sm">
                  <option>C-17A Globemaster III</option>
                  <option>C-130J Hercules</option>
                  <option>KC-30A MRTT</option>
                </select>
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">CARGO TYPE:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" placeholder="Vehicle/Equipment/Container" />
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">TOTAL WEIGHT (kg):</div>
                <input type="number" className="w-full border border-gray-300 p-2 text-sm" />
              </div>
            </div>
            
            {/* Tie-Down Requirements */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-3 bg-gray-200 p-2">TIE-DOWN REQUIREMENTS:</div>
              <div className="grid grid-cols-4 gap-4">
                <div className="border border-gray-400 p-3">
                  <div className="font-bold text-xs mb-2">FORWARD TIE-DOWNS:</div>
                  <input type="number" className="w-full border border-gray-300 p-2 text-xs" placeholder="Qty" />
                </div>
                <div className="border border-gray-400 p-3">
                  <div className="font-bold text-xs mb-2">AFT TIE-DOWNS:</div>
                  <input type="number" className="w-full border border-gray-300 p-2 text-xs" placeholder="Qty" />
                </div>
                <div className="border border-gray-400 p-3">
                  <div className="font-bold text-xs mb-2">LATERAL TIE-DOWNS:</div>
                  <input type="number" className="w-full border border-gray-300 p-2 text-xs" placeholder="Qty" />
                </div>
                <div className="border border-gray-400 p-3">
                  <div className="font-bold text-xs mb-2">CHAINS/STRAPS:</div>
                  <input type="number" className="w-full border border-gray-300 p-2 text-xs" placeholder="Qty" />
                </div>
              </div>
            </div>
            
            {/* Restraint Diagram Area */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-2 bg-gray-200 p-2">RESTRAINT DIAGRAM:</div>
              <div className="border-2 border-gray-400 h-64 p-4 bg-gray-50">
                <div className="text-center text-gray-500 pt-20">
                  [Cargo restraint diagram to be sketched here]<br/>
                  Include tie-down point locations, strap angles, and load distribution
                </div>
              </div>
            </div>
            
            {/* Load Factors */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-xs mb-2">FORWARD G-FORCE:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-xs" placeholder="9.0g" />
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-xs mb-2">AFT G-FORCE:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-xs" placeholder="1.5g" />
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-xs mb-2">LATERAL G-FORCE:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-xs" placeholder="1.5g" />
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-xs mb-2">VERTICAL G-FORCE:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-xs" placeholder="2.0g" />
              </div>
            </div>
            
            {/* Approval Section */}
            <div className="border-t-2 border-black pt-4 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="font-bold text-sm mb-2">PREPARED BY LOADMASTER:</div>
                  <div className="mb-2">Name: ________________________________</div>
                  <div className="mb-2">Rank: ________________________________</div>
                  <div className="mb-2">Service Number: ______________________</div>
                  <div className="mb-2">Signature: ____________________________</div>
                  <div>Date: _____________________________________</div>
                </div>
                <div>
                  <div className="font-bold text-sm mb-2">APPROVED BY CAPTAIN:</div>
                  <div className="mb-2">Name: ________________________________</div>
                  <div className="mb-2">Rank: ________________________________</div>
                  <div className="mb-2">Service Number: ______________________</div>
                  <div className="mb-2">Signature: ____________________________</div>
                  <div>Date: _____________________________________</div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-400 pt-2 mt-4 text-xs text-center">
              RAAF FORM 86SQN-002 (JAN 2025) - CARGO TIE-DOWN RESTRAINT PLAN
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
      
      {/* Load Planning Form - C-17 Load Plan */}
      <div id="load-planning-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
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

      {/* Cargo Compatibility Checklist */}
      <div id="compatibility-checklist-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Cargo Compatibility Checklist</h2>
          <p className="text-muted-foreground mb-4">Verify compatibility between different cargo types for mixed loads.</p>
          
          {/* RAAF Cargo Compatibility Form */}
          <div className="bg-white p-6 rounded-md border border-gray-300 text-black">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <div className="text-lg font-bold">ROYAL AUSTRALIAN AIR FORCE</div>
              <div className="text-lg font-bold">CARGO COMPATIBILITY CHECKLIST</div>
              <div className="text-sm mt-2">RAAF FORM 86SQN-003</div>
            </div>
            
            {/* Mission Details */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">AIRCRAFT:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" placeholder="A41-XXX" />
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">MISSION:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" />
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">DATE:</div>
                <input type="date" className="w-full border border-gray-300 p-2 text-sm" />
              </div>
            </div>
            
            {/* Dangerous Goods Compatibility */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-3 bg-red-100 p-2 border border-red-300">DANGEROUS GOODS COMPATIBILITY:</div>
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> No dangerous goods on this load</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> All dangerous goods properly segregated per IATA DGR</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Explosive materials isolated from other cargo</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Flammable liquids secured away from ignition sources</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Corrosive materials separated from metals</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Radioactive materials properly shielded</label>
              </div>
            </div>
            
            {/* Environmental Compatibility */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-3 bg-blue-100 p-2 border border-blue-300">ENVIRONMENTAL COMPATIBILITY:</div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Temperature sensitive items isolated</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Humidity sensitive items protected</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Fragile items properly cushioned</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Electronics away from magnetic fields</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Live animals separated from cargo</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Food items protected from contamination</label>
              </div>
            </div>
            
            {/* Security Compatibility */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-3 bg-yellow-100 p-2 border border-yellow-300">SECURITY COMPATIBILITY:</div>
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Classified materials properly contained and escorted</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> High value cargo segregated and secured</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Weapons and ammunition properly stored</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Sensitive equipment access controlled</label>
              </div>
            </div>
            
            {/* Remarks */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-2 bg-gray-200 p-2">REMARKS / SPECIAL CONSIDERATIONS:</div>
              <textarea className="w-full border border-gray-300 p-3 text-sm h-20" placeholder="Note any special compatibility considerations or restrictions..."></textarea>
            </div>
            
            {/* Approval */}
            <div className="border-t-2 border-black pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="font-bold text-sm mb-2">CHECKED BY LOADMASTER:</div>
                  <div className="mb-2">Name: ________________________</div>
                  <div className="mb-2">Rank: ________________________</div>
                  <div className="mb-2">Signature: ___________________</div>
                  <div>Date: ___________________________</div>
                </div>
                <div>
                  <div className="font-bold text-sm mb-2">VERIFIED BY CAPTAIN:</div>
                  <div className="mb-2">Name: ________________________</div>
                  <div className="mb-2">Rank: ________________________</div>
                  <div className="mb-2">Signature: ___________________</div>
                  <div>Date: ___________________________</div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-400 pt-2 mt-4 text-xs text-center">
              RAAF FORM 86SQN-003 (JAN 2025) - CARGO COMPATIBILITY CHECKLIST
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

      {/* Shoring Requirements Worksheet */}
      <div id="shoring-worksheet-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Shoring Requirements Worksheet</h2>
          <p className="text-muted-foreground mb-4">Calculate and document shoring requirements for heavy or concentrated loads.</p>
          
          {/* RAAF Shoring Worksheet */}
          <div className="bg-white p-6 rounded-md border border-gray-300 text-black">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <div className="text-lg font-bold">ROYAL AUSTRALIAN AIR FORCE</div>
              <div className="text-lg font-bold">SHORING REQUIREMENTS WORKSHEET</div>
              <div className="text-sm mt-2">RAAF FORM 86SQN-004</div>
            </div>
            
            {/* Load Information */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">AIRCRAFT TYPE:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" placeholder="C-17A/C-130J" />
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">LOAD WEIGHT (kg):</div>
                <input type="number" className="w-full border border-gray-300 p-2 text-sm" />
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">CONTACT AREA (m²):</div>
                <input type="number" step="0.1" className="w-full border border-gray-300 p-2 text-sm" />
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">FLOOR RATING (kg/m²):</div>
                <input type="number" className="w-full border border-gray-300 p-2 text-sm" placeholder="1464" />
              </div>
            </div>
            
            {/* Calculations */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-3 bg-gray-200 p-2">LOAD CALCULATIONS:</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="border border-gray-400 p-3">
                  <div className="font-bold text-xs mb-2">ACTUAL LOAD (kg/m²):</div>
                  <div className="text-lg font-mono bg-gray-100 p-2 border">0</div>
                  <div className="text-xs text-gray-600 mt-1">Weight ÷ Contact Area</div>
                </div>
                <div className="border border-gray-400 p-3">
                  <div className="font-bold text-xs mb-2">EXCESS LOAD (kg/m²):</div>
                  <div className="text-lg font-mono bg-gray-100 p-2 border">0</div>
                  <div className="text-xs text-gray-600 mt-1">Actual - Floor Rating</div>
                </div>
                <div className="border border-gray-400 p-3">
                  <div className="font-bold text-xs mb-2">SHORING REQUIRED:</div>
                  <div className="text-lg font-mono bg-red-100 p-2 border">NO</div>
                  <div className="text-xs text-gray-600 mt-1">If Excess greater than 0</div>
                </div>
              </div>
            </div>
            
            {/* Shoring Plan */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-2 bg-gray-200 p-2">SHORING PLAN (If Required):</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="border border-gray-400 p-3 mb-3">
                    <div className="font-bold text-xs mb-2">SHORING TYPE:</div>
                    <select className="w-full border border-gray-300 p-2 text-sm">
                      <option>Not Required</option>
                      <option>4x4 Timber</option>
                      <option>Steel Beam</option>
                      <option>Plywood Platform</option>
                      <option>Combination</option>
                    </select>
                  </div>
                  <div className="border border-gray-400 p-3">
                    <div className="font-bold text-xs mb-2">SHORING AREA (m²):</div>
                    <input type="number" step="0.1" className="w-full border border-gray-300 p-2 text-sm" />
                  </div>
                </div>
                <div>
                  <div className="border border-gray-400 p-3 mb-3">
                    <div className="font-bold text-xs mb-2">NUMBER OF POINTS:</div>
                    <input type="number" className="w-full border border-gray-300 p-2 text-sm" />
                  </div>
                  <div className="border border-gray-400 p-3">
                    <div className="font-bold text-xs mb-2">DISTRIBUTION LOAD (kg/m²):</div>
                    <input type="number" className="w-full border border-gray-300 p-2 text-sm" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Diagram */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-2 bg-gray-200 p-2">SHORING DIAGRAM:</div>
              <div className="border-2 border-gray-400 h-48 p-4 bg-gray-50">
                <div className="text-center text-gray-500 pt-16">
                  [Sketch shoring placement and load distribution]
                </div>
              </div>
            </div>
            
            {/* Approval */}
            <div className="border-t-2 border-black pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="font-bold text-sm mb-2">CALCULATED BY:</div>
                  <div className="mb-2">Name: ________________________</div>
                  <div className="mb-2">Rank: ________________________</div>
                  <div className="mb-2">Signature: ___________________</div>
                  <div>Date: ___________________________</div>
                </div>
                <div>
                  <div className="font-bold text-sm mb-2">APPROVED BY:</div>
                  <div className="mb-2">Name: ________________________</div>
                  <div className="mb-2">Rank: ________________________</div>
                  <div className="mb-2">Signature: ___________________</div>
                  <div>Date: ___________________________</div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-400 pt-2 mt-4 text-xs text-center">
              RAAF FORM 86SQN-004 (JAN 2025) - SHORING REQUIREMENTS WORKSHEET
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

      {/* Hazard Certification Form */}
      <div id="hazard-certification-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Hazard Certification Form</h2>
          <p className="text-muted-foreground mb-4">Certification of hazardous materials for air transport compliance.</p>
          
          {/* RAAF Hazard Certification */}
          <div className="bg-white p-6 rounded-md border border-gray-300 text-black">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <div className="text-lg font-bold">ROYAL AUSTRALIAN AIR FORCE</div>
              <div className="text-lg font-bold">HAZARDOUS MATERIALS CERTIFICATION</div>
              <div className="text-sm mt-2">RAAF FORM 86SQN-005</div>
            </div>
            
            {/* Shipper Information */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">SHIPPER UNIT:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" />
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">CERTIFYING OFFICER:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" />
              </div>
            </div>
            
            {/* Hazardous Materials Table */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-2 bg-red-100 p-2 border border-red-300">HAZARDOUS MATERIALS DECLARATION:</div>
              <table className="w-full border border-gray-400 text-xs">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-400 p-2">UN Number</th>
                    <th className="border border-gray-400 p-2">Proper Shipping Name</th>
                    <th className="border border-gray-400 p-2">Class</th>
                    <th className="border border-gray-400 p-2">Quantity</th>
                    <th className="border border-gray-400 p-2">Packaging</th>
                  </tr>
                </thead>
                <tbody>
                  {[1,2,3,4,5].map(i => (
                    <tr key={i}>
                      <td className="border border-gray-400 p-2"><input type="text" className="w-full text-xs" /></td>
                      <td className="border border-gray-400 p-2"><input type="text" className="w-full text-xs" /></td>
                      <td className="border border-gray-400 p-2"><input type="text" className="w-full text-xs" /></td>
                      <td className="border border-gray-400 p-2"><input type="text" className="w-full text-xs" /></td>
                      <td className="border border-gray-400 p-2"><input type="text" className="w-full text-xs" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Certifications */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-3 bg-yellow-100 p-2 border border-yellow-300">CERTIFICATIONS:</div>
              <div className="space-y-2">
                <label className="flex items-start">
                  <input type="checkbox" className="mr-2 mt-1" />
                  <span className="text-sm">I certify that the contents of this consignment are fully and accurately described by proper shipping name and are classified, packed, marked, labeled, and in proper condition for air transport according to applicable regulations.</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" className="mr-2 mt-1" />
                  <span className="text-sm">All required documentation including Safety Data Sheets (SDS) are attached and current.</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" className="mr-2 mt-1" />
                  <span className="text-sm">Packaging meets IATA Dangerous Goods Regulations requirements.</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" className="mr-2 mt-1" />
                  <span className="text-sm">Personnel handling these materials have received appropriate training.</span>
                </label>
              </div>
            </div>
            
            {/* Signatures */}
            <div className="border-t-2 border-black pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="font-bold text-sm mb-2">SHIPPER CERTIFICATION:</div>
                  <div className="mb-2">Name: ________________________</div>
                  <div className="mb-2">Rank: ________________________</div>
                  <div className="mb-2">Unit: _________________________</div>
                  <div className="mb-2">Signature: ___________________</div>
                  <div>Date: ___________________________</div>
                </div>
                <div>
                  <div className="font-bold text-sm mb-2">LOADMASTER ACCEPTANCE:</div>
                  <div className="mb-2">Name: ________________________</div>
                  <div className="mb-2">Rank: ________________________</div>
                  <div className="mb-2">Qualification: ________________</div>
                  <div className="mb-2">Signature: ___________________</div>
                  <div>Date: ___________________________</div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-400 pt-2 mt-4 text-xs text-center">
              RAAF FORM 86SQN-005 (JAN 2025) - HAZARDOUS MATERIALS CERTIFICATION
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

      {/* Aircraft Loading Deviation Request */}
      <div id="loading-deviation-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Aircraft Loading Deviation Request</h2>
          <p className="text-muted-foreground mb-4">Request and document approval for non-standard loading configurations.</p>
          
          {/* RAAF Loading Deviation Form */}
          <div className="bg-white p-6 rounded-md border border-gray-300 text-black">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <div className="text-lg font-bold">ROYAL AUSTRALIAN AIR FORCE</div>
              <div className="text-lg font-bold">AIRCRAFT LOADING DEVIATION REQUEST</div>
              <div className="text-sm mt-2">RAAF FORM 86SQN-006</div>
            </div>
            
            {/* Request Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">AIRCRAFT TYPE/SERIAL:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" placeholder="C-17A A41-XXX" />
              </div>
              <div className="border border-gray-400 p-3">
                <div className="font-bold text-sm mb-2">MISSION NUMBER:</div>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" />
              </div>
            </div>
            
            {/* Deviation Type */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-3 bg-orange-100 p-2 border border-orange-300">TYPE OF DEVIATION REQUESTED:</div>
              <div className="space-y-2">
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Weight limit exception</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Center of gravity outside normal limits</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Non-standard loading configuration</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Equipment tie-down variation</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Floor loading exceed standard limits</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Other (specify below)</label>
              </div>
            </div>
            
            {/* Justification */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-2 bg-gray-200 p-2">JUSTIFICATION FOR DEVIATION:</div>
              <textarea className="w-full border border-gray-300 p-3 text-sm h-24" placeholder="Provide detailed justification for the requested deviation including operational necessity and risk mitigation measures..."></textarea>
            </div>
            
            {/* Safety Analysis */}
            <div className="mb-6">
              <div className="font-bold text-sm mb-2 bg-gray-200 p-2">SAFETY ANALYSIS AND RISK MITIGATION:</div>
              <textarea className="w-full border border-gray-300 p-3 text-sm h-20" placeholder="Document safety analysis performed and risk mitigation measures to be implemented..."></textarea>
            </div>
            
            {/* Approval Chain */}
            <div className="border-t-2 border-black pt-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="font-bold text-sm mb-2">REQUESTED BY LOADMASTER:</div>
                    <div className="mb-1 text-xs">Name: ___________________</div>
                    <div className="mb-1 text-xs">Rank: ___________________</div>
                    <div className="mb-1 text-xs">Signature: _______________</div>
                    <div className="text-xs">Date: ____________________</div>
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-2">AIRCRAFT CAPTAIN APPROVAL:</div>
                    <div className="mb-1 text-xs">Name: ___________________</div>
                    <div className="mb-1 text-xs">Rank: ___________________</div>
                    <div className="mb-1 text-xs">□ APPROVED □ DENIED</div>
                    <div className="mb-1 text-xs">Signature: _______________</div>
                    <div className="text-xs">Date: ____________________</div>
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-2">SQUADRON OPERATIONS APPROVAL:</div>
                    <div className="mb-1 text-xs">Name: ___________________</div>
                    <div className="mb-1 text-xs">Rank: ___________________</div>
                    <div className="mb-1 text-xs">□ APPROVED □ DENIED</div>
                    <div className="mb-1 text-xs">Signature: _______________</div>
                    <div className="text-xs">Date: ____________________</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-400 pt-2 mt-4 text-xs text-center">
              RAAF FORM 86SQN-006 (JAN 2025) - AIRCRAFT LOADING DEVIATION REQUEST
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

    </>
  );
}