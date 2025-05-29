import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, ChevronLeft, ChevronRight, Play, Target, Users, Settings, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: "top" | "bottom" | "left" | "right";
  icon: React.ComponentType<{ className?: string }>;
  category: "navigation" | "features" | "tools" | "management";
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to LOADMworkflow",
    description: "Let's take a quick tour of the platform's key features to get you started.",
    target: "#app-header",
    position: "bottom",
    icon: Play,
    category: "navigation"
  },
  {
    id: "load-planning",
    title: "Load Planning",
    description: "Plan and visualize cargo loads for different aircraft types with drag-and-drop functionality.",
    target: "[data-tour='load-planning']",
    position: "bottom",
    icon: Target,
    category: "features"
  },
  {
    id: "training-modules",
    title: "Training Modules",
    description: "Access comprehensive training materials, exercises, and educational content for each aircraft type.",
    target: "[data-tour='training']",
    position: "bottom",
    icon: BookOpen,
    category: "features"
  },
  {
    id: "tools",
    title: "Loadmaster Tools",
    description: "Use specialized tools like the Mission Complexity Analyzer and cargo calculators.",
    target: "[data-tour='tools']",
    position: "bottom",
    icon: Settings,
    category: "tools"
  },
  {
    id: "instructor-portal",
    title: "Instructor Portal",
    description: "For instructors: Review submissions, track student progress, and create quizzes.",
    target: "[data-tour='instructor-portal']",
    position: "bottom",
    icon: Users,
    category: "management"
  },
  {
    id: "profile",
    title: "User Profile",
    description: "Manage your account settings, view statistics, and track your progress.",
    target: "[data-tour='profile']",
    position: "left",
    icon: Settings,
    category: "management"
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingTour({ isOpen, onClose, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightElement, setHighlightElement] = useState<Element | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const step = tourSteps[currentStep];
    const element = document.querySelector(step.target);
    setHighlightElement(element);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentStep, isOpen]);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    onClose();
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={skipTour} />
      
      {/* Highlight overlay */}
      {highlightElement && (
        <motion.div
          className="fixed z-[9999] pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            top: highlightElement.getBoundingClientRect().top - 8,
            left: highlightElement.getBoundingClientRect().left - 8,
            width: highlightElement.getBoundingClientRect().width + 16,
            height: highlightElement.getBoundingClientRect().height + 16,
          }}
        >
          <div className="w-full h-full rounded-lg border-2 border-primary shadow-lg shadow-primary/50 bg-primary/10" />
        </motion.div>
      )}

      {/* Tour tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="fixed z-[10000] max-w-sm"
          style={{
            top: highlightElement 
              ? step.position === "bottom" 
                ? highlightElement.getBoundingClientRect().bottom + 16
                : step.position === "top"
                ? highlightElement.getBoundingClientRect().top - 300
                : highlightElement.getBoundingClientRect().top
              : "50%",
            left: highlightElement
              ? step.position === "right"
                ? highlightElement.getBoundingClientRect().right + 16
                : step.position === "left"
                ? highlightElement.getBoundingClientRect().left - 400
                : highlightElement.getBoundingClientRect().left
              : "50%",
            transform: !highlightElement ? "translate(-50%, -50%)" : undefined,
          }}
        >
          <Card className="shadow-xl border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{step.title}</CardTitle>
                    <CardDescription className="text-xs">
                      Step {currentStep + 1} of {tourSteps.length}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={skipTour}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2">
                <Progress value={progress} className="h-1" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                {step.description}
              </p>
              
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {step.category}
                </Badge>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Back
                  </Button>
                  <Button size="sm" onClick={nextStep}>
                    {currentStep === tourSteps.length - 1 ? "Finish" : "Next"}
                    {currentStep !== tourSteps.length - 1 && (
                      <ChevronRight className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// Hook to manage tour state
export function useOnboardingTour() {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenOnboardingTour");
    if (!hasSeenTour) {
      setIsFirstVisit(true);
      // Delay showing tour to let page load
      setTimeout(() => setShowTour(true), 1000);
    }
  }, []);

  const startTour = () => {
    setShowTour(true);
  };

  const closeTour = () => {
    setShowTour(false);
  };

  const completeTour = () => {
    setShowTour(false);
    localStorage.setItem("hasSeenOnboardingTour", "true");
    setIsFirstVisit(false);
  };

  return {
    isFirstVisit,
    showTour,
    startTour,
    closeTour,
    completeTour,
  };
}