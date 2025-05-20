import { Scenario } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface ScenarioCardProps {
  scenario: Scenario;
}

export default function ScenarioCard({ scenario }: ScenarioCardProps) {
  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* Banner */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-r from-slate-900 to-blue-900">
        <div className="absolute top-0 right-0 p-3">
          <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/20">
            Scenario
          </Badge>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-card-foreground mb-3">
          {scenario.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          {scenario.description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {scenario.numberOfQuestions} questions
          </span>
          <Link href={`/scenarios/${scenario.id}`}>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
              Start
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
