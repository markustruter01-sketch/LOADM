import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Scenario } from "@shared/schema";
import { Loader2 } from "lucide-react";
import ScenarioCard from "@/components/ScenarioCard";

export default function ScenariosPage() {
  const { data: scenarios, isLoading } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
  });

  return (
    <>
      <Helmet>
        <title>Scenarios - LOADMdocs</title>
        <meta 
          name="description" 
          content="Access and complete loadmaster training scenarios." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <section className="mb-10">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Scenarios
            </h2>
            <p className="text-muted-foreground mb-6">
              Access and complete loadmaster training scenarios
            </p>
          </section>

          {/* Scenarios Grid */}
          <section>
            {isLoading ? (
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