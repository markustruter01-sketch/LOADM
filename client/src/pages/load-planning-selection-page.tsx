import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import c130Image from "@assets/P0019-12 copy_1760056529560.png";
import c17Image from "@assets/P0031_C-17_1000px copy_1760056529561.png";
import c27jImage from "@assets/C-27J-Black-Frame copy_1760056207717.png";
import kc30aImage from "@assets/P0028-KC-30A_1760056207717.png";

interface Aircraft {
  id: string;
  name: string;
  description: string;
  maxPayload: string;
  positions: number;
  image?: string;
}

const aircraftList: Aircraft[] = [
  {
    id: "c130",
    name: "C-130 Hercules",
    description: "Medium tactical transport aircraft",
    maxPayload: "42,000 lbs",
    positions: 8,
    image: c130Image
  },
  {
    id: "c17",
    name: "C-17 Globemaster",
    description: "Strategic heavy-lift transport",
    maxPayload: "170,900 lbs", 
    positions: 18,
    image: c17Image
  },
  {
    id: "c27j",
    name: "C-27J Spartan",
    description: "Light tactical transport aircraft",
    maxPayload: "25,000 lbs",
    positions: 3,
    image: c27jImage
  },
  {
    id: "kc30a",
    name: "KC30-A Airbus",
    description: "Multi-role tanker transport",
    maxPayload: "75,000 lbs",
    positions: 26,
    image: kc30aImage
  }
];

export default function LoadPlanningSelectionPage() {
  const [, navigate] = useLocation();

  const handleAircraftSelect = (aircraftId: string) => {
    navigate(`/load-planning/${aircraftId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Aircraft Selection - Load Planning | LOADMworkflow</title>
        <meta name="description" content="Select aircraft for load planning operations" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Plane className="h-8 w-8 text-orange-400" />
            <h1 className="text-4xl font-bold text-white">Load Planning</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select an aircraft to begin load planning operations. Each aircraft has unique 
            cargo configurations and balance requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {aircraftList.map((aircraft) => (
            <Card 
              key={aircraft.id}
              className="bg-card hover:bg-card/90 transition-all duration-300 cursor-pointer group"
              onClick={() => handleAircraftSelect(aircraft.id)}
            >
              <CardHeader className="text-center">
                {aircraft.image ? (
                  <div className="mx-auto mb-4 h-24 flex items-center justify-center">
                    <img 
                      src={aircraft.image} 
                      alt={aircraft.name}
                      className="max-h-24 max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="mx-auto mb-4 p-4 bg-primary/20 rounded-full w-16 h-16 flex items-center justify-center">
                    <Plane className="h-8 w-8 text-primary group-hover:text-primary/80 transition-colors" />
                  </div>
                )}
                <CardTitle className="text-card-foreground text-xl">{aircraft.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm text-center">
                  {aircraft.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Max Payload:</span>
                    <span className="text-green-400 font-medium">{aircraft.maxPayload}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Cargo Positions:</span>
                    <span className="text-primary font-medium">{aircraft.positions}</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAircraftSelect(aircraft.id);
                  }}
                >
                  Select Aircraft
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-orange-400"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}