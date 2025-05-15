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
      
      {/* The cargo manifest form (shown if specifically requested) */}
      {window.location.hash === '#cargo-manifest-form' && (
        <div className="container mx-auto pb-20">
          <CargoManifestForm />
        </div>
      )}
    </>
  );
}