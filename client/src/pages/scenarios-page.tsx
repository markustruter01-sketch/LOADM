import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Scenario } from "@shared/schema";
import { Loader2, ArrowLeft, Book, FileCheck } from "lucide-react";
import ScenarioCard from "@/components/ScenarioCard";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function ScenariosPage() {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("training");
  const { data: scenarios, isLoading } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
  });

  const handleBackClick = () => {
    navigate("/");
  };

  return (
    <>
      <Helmet>
        <title>Scenarios - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Access and complete loadmaster training scenarios." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
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
          
          {/* Header Section */}
          <section className="mb-10">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Scenarios
            </h2>
            <p className="text-muted-foreground mb-6">
              Access and complete loadmaster training scenarios
            </p>
          </section>

          {/* Tab navigation */}
          <div className="bg-muted mb-6 p-1 rounded-lg inline-flex">
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'training' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab("training")}
            >
              <Book className="h-4 w-4 mr-2 inline-block" />
              Training
            </button>
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'assessment' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab("assessment")}
            >
              <FileCheck className="h-4 w-4 mr-2 inline-block" />
              Assessment
            </button>
          </div>
          
          {/* Scenarios Grid */}
          <section>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {activeTab === "training" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {scenarios?.map((scenario) => (
                      <ScenarioCard key={`training-${scenario.id}`} scenario={scenario} />
                    ))}
                  </div>
                )}
                
                {activeTab === "assessment" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {scenarios?.map((scenario) => (
                      <ScenarioCard key={`assessment-${scenario.id}`} scenario={scenario} />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}