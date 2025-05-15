import { CargoManifestForm } from "@/components/CargoManifestForm";
import DocumentMenu from "@/components/DocumentMenu";
import { Helmet } from "react-helmet";
import { useEffect } from "react";

export default function CargoManifestPage() {
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
        <title>Cargo Manifest - LOADMdocs</title>
        <meta name="description" content="Passenger/Crew and Cargo Manifest form for military cargo load planning" />
      </Helmet>
      
      {/* Document menu showing all available document forms */}
      <DocumentMenu />
      
      {/* The cargo manifest form */}
      <div className="container mx-auto pb-20">
        <CargoManifestForm />
      </div>
    </>
  );
}