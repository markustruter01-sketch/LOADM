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
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                <rect width="16" height="16" x="4" y="4" rx="2"/>
                <rect width="6" height="6" x="9" y="9" rx="1"/>
                <path d="M15 4v16"/>
                <path d="M4 15h16"/>
              </svg>
            </div>
            <span className="text-xs font-medium">{scenario.numberOfQuestions} questions</span>
          </div>
          <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/20">
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
