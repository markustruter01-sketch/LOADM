import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";

// Import the existing pages with their hideHeader prop support
import LoadPlanningSelectionPage from "@/pages/load-planning-selection-page";
import TrainingModulesPage from "@/pages/training-modules";

export default function AirframeIntegratedPage() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("load-planning");

  // Check if we should open training modules tab based on URL hash or query
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    // Check for training modules in URL parameters or hash
    if (urlParams.get('tab') === 'training-modules' || hash === '#training-modules') {
      setActiveTab("training-modules");
    }
  }, [location]);

  // These components are rendered differently for wouter routing
  const LoadPlanningContent = () => <LoadPlanningSelectionPage />;
  const TrainingModulesContent = () => <TrainingModulesPage />;

  return (
    <>
      <Helmet>
        <title>Airframe - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Access airframe load planning and training modules in an integrated interface." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-6 mb-16">
        <div className="max-w-6xl mx-auto">
          {/* Header with Back Button */}
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="p-2 -ml-2"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Home
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Airframe</h1>
          <p className="text-muted-foreground mb-6">
            Access load planning simulations and training modules for various aircraft
          </p>

          {/* Tab toggle between Load Planning and Training Modules */}
          <Tabs
            defaultValue="load-planning"
            value={activeTab}
            onValueChange={setActiveTab}
            className="mb-6"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="load-planning">Load Planning</TabsTrigger>
              <TabsTrigger value="training-modules">Training Modules</TabsTrigger>
            </TabsList>

            <TabsContent value="load-planning" className="mt-6">
              {/* Reuse the content from the existing load planning page */}
              <div className="pt-2">
                <LoadPlanningContent />
              </div>
            </TabsContent>

            <TabsContent value="training-modules" className="mt-6">
              {/* Reuse the content from the existing training modules page */}
              <div className="pt-2">
                <TrainingModulesContent />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}