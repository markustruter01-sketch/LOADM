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
  // Check if we need to scroll to the form
  useEffect(() => {
    // Check for hash in URL to scroll to form
    if (window.location.hash === '#cargo-manifest-form') {
      const element = document.getElementById('cargo-manifest-form');
      if (element) {
        // Delay scrolling to make sure the page is fully loaded
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
      
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-6"
            onClick={handleBackClick}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
      
      {/* Document menu showing all available document forms */}
      <DocumentMenu />
      
      {/* The cargo manifest form (shown if specifically requested) */}
      {window.location.hash === '#cargo-manifest-form' && (
        <div className="container mx-auto pb-20">
          <CargoManifestForm />
        </div>
      )}
    </>
  );
}