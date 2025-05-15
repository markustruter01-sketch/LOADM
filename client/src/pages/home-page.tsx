import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Document, Scenario } from "@shared/schema";
import { ToggleButton } from "@/components/ui/toggle-button";
import DocumentCard from "@/components/DocumentCard";
import ScenarioCard from "@/components/ScenarioCard";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [showScenarios, setShowScenarios] = useState(false);

  const { data: documents, isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: scenarios, isLoading: isLoadingScenarios } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
  });

  return (
    <>
      <Helmet>
        <title>LOADMdocs - Professional Loadmaster Documentation App</title>
        <meta 
          name="description" 
          content="Professional documentation and scenario tools for loadmasters. Access required documentation and training scenarios in one central location." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <section className="mb-10 text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Welcome to <span className="text-primary">LOADMdocs</span>
            </h2>
            <p className="text-muted-foreground mb-6">
              Professional documentation and scenario tools for loadmasters
            </p>

            {/* Toggle Switch for Document/Scenario Selection */}
            <div className="flex justify-center mb-10">
              <ToggleButton
                leftOption="Documents"
                rightOption="Scenario"
                onToggle={setShowScenarios}
                defaultChecked={showScenarios}
              />
            </div>

            {/* Featured Section Banner */}
            <div className="relative rounded-xl overflow-hidden shadow-xl mb-10 h-64">
              <img
                src="https://pixabay.com/get/gf072876aa3b430280d49278783214995ecc68ab38621f3d55b9bc7463c63b94edc78cd06c528f4d416da65fc74c979a893ac56dfcf7b58b8707fdee6a90a83e0_1280.jpg"
                alt="Aircraft cargo loading"
                className="w-full h-full object-cover"
              />
              <div className="gradient-overlay flex items-end">
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Streamline Your Loadmaster Documentation
                  </h3>
                  <p className="text-muted-foreground max-w-xl">
                    Access all required documentation and training scenarios in one central location.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Documents Section */}
          <section className={`${!showScenarios ? "block" : "hidden"}`}>
            {isLoadingDocuments ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documents?.map((document) => (
                  <DocumentCard key={document.id} document={document} />
                ))}
              </div>
            )}
          </section>

          {/* Scenarios Section */}
          <section className={`${showScenarios ? "block" : "hidden"}`}>
            {isLoadingScenarios ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {scenarios?.map((scenario) => (
                  <ScenarioCard key={scenario.id} scenario={scenario} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
