import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useOnboardingTour } from "@/components/onboarding-tour";

export function TourTrigger() {
  const { startTour } = useOnboardingTour();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startTour}
      className="fixed bottom-4 right-4 z-50 shadow-lg"
    >
      <HelpCircle className="h-4 w-4 mr-2" />
      Take Tour
    </Button>
  );
}