import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlaneIcon, ArrowLeft } from "lucide-react";

export default function LoadPlanningSelectionPage() {
  const [, navigate] = useLocation();
  
  const aircraftOptions = [
    {
      id: 'kc30a',
      name: 'Airbus KC30-A',
      description: 'Multi-role tanker transport with a maximum payload of 45,000 kg',
      path: '/load-planning/kc30a'
    }
  ];
  
  return (
    <>
      <Helmet>
        <title>Load Planning - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Select an aircraft for load planning simulation." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-6 mb-16">
        <div className="max-w-4xl mx-auto">
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
          
          <h1 className="text-3xl font-bold mb-2">Load Planning</h1>
          <p className="text-muted-foreground mb-8">
            Select an aircraft type to begin load planning simulation
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aircraftOptions.map((aircraft) => (
              <Card 
                key={aircraft.id} 
                className="hover:border-primary transition-colors cursor-pointer"
                onClick={() => navigate(aircraft.path)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <PlaneIcon className="h-5 w-5 mr-2 text-primary" />
                    {aircraft.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {aircraft.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    Select
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}