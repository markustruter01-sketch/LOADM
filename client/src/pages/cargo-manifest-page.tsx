import { CargoManifestForm } from "@/components/CargoManifestForm";
import DocumentMenu from "@/components/DocumentMenu";
import { Helmet } from "react-helmet";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
      
      {/* Weight & Balance Sheet */}
      <div id="weight-balance-sheet-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Weight & Balance Sheet</h2>
          <p className="text-muted-foreground mb-4">Calculate and document aircraft weight distribution and balance.</p>
          <div className="bg-secondary/20 p-6 rounded-md text-center">
            <p>Weight & Balance Sheet form will be implemented here.</p>
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