import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useIsolatedAuth } from '../auth-isolated/auth-context';
import { apiRequest } from '@/lib/queryClient';

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to LOADMworkflow',
    description: 'Your comprehensive KC30A loadmaster training and logistics platform. Let me show you around the key features of your new training system.',
    targetSelector: '',
    position: 'center'
  },
  {
    id: 'navigation',
    title: 'Navigation Menu',
    description: 'Use the bottom navigation bar to access all sections: Scenarios, Airframe, Documents, Home (center), Profile, Tools, and Instructor Portal.',
    targetSelector: '',
    position: 'center'
  },
  {
    id: 'scenarios',
    title: 'Training Scenarios',
    description: 'Complete interactive training scenarios with real-world mission simulations. Submit your work and receive feedback from instructors.',
    targetSelector: '[data-testid="nav-scenarios"]',
    position: 'top',
    action: 'Access realistic training scenarios'
  },
  {
    id: 'airframe',
    title: 'Airframe & Load Planning',
    description: 'Access KC30A specifications, load planning tools, and training modules. Calculate center of gravity and manage aircraft configurations.',
    targetSelector: '[data-testid="nav-airframe"]',
    position: 'top',
    action: 'Explore load planning features'
  },
  {
    id: 'documents',
    title: 'Mission Documents',
    description: 'View and manage mission documents with our integrated PDF viewer. Access technical manuals, forms, and mission-critical documentation.',
    targetSelector: '[data-testid="nav-documents"]',
    position: 'top',
    action: 'Browse mission documents'
  },
  {
    id: 'profile',
    title: 'Your Profile & Records',
    description: 'Track your qualifications and currencies, view your activity history, and manage your flight records including hours, cargo, and missions.',
    targetSelector: '[data-testid="nav-profile"]',
    position: 'top',
    action: 'Manage your training profile'
  },
  {
    id: 'tools',
    title: 'Loadmaster Calculators',
    description: 'Access professional calculation tools: Weight & Balance (Restraint, WAM, Vehicle CGFA, Fuel), PSI Calculators (Box, Drum, Skidded, Tire), and Mission Complexity Analyzer.',
    targetSelector: '[data-testid="nav-tools"]',
    position: 'top',
    action: 'Use loadmaster calculators'
  },
  {
    id: 'instructor',
    title: 'Instructor Portal',
    description: 'For instructors: Review student submissions, manage quizzes and scenarios, track student progress, and access advanced analytics across squadrons.',
    targetSelector: '[data-testid="nav-instructor"]',
    position: 'top',
    action: 'Access instructor features'
  },
  {
    id: 'complete',
    title: 'Ready for Training!',
    description: 'You\'re all set to begin your loadmaster training journey. Explore the platform, complete scenarios, and track your progress. Need help? Use the chat system anytime.',
    targetSelector: '',
    position: 'center'
  }
];

interface OnboardingTourProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ isVisible, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [overlayStyle, setOverlayStyle] = useState({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { user } = useIsolatedAuth();

  const currentTourStep = tourSteps[currentStep];

  const calculatePosition = () => {
    if (!currentTourStep.targetSelector) {
      // Center position for welcome/complete steps with light overlay
      setTooltipPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
      setOverlayStyle({
        opacity: 0.3,
        background: 'rgba(0, 0, 0, 1)'
      });
      return;
    }

    // Try multiple selectors to find the target element
    const selectors = currentTourStep.targetSelector.split(', ');
    let targetElement = null;
    
    for (const selector of selectors) {
      targetElement = document.querySelector(selector.trim());
      if (targetElement) break;
    }

    if (!targetElement) {
      // Fallback to center if element not found
      setTooltipPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
      setOverlayStyle({});
      return;
    }

    // Scroll element into view first
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Wait for scroll to complete before calculating positions
    setTimeout(() => {
      const rect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();
      
      let top = 0;
      let left = 0;

      switch (currentTourStep.position) {
        case 'top':
          top = rect.top - (tooltipRect?.height || 200) - 20;
          left = rect.left + rect.width / 2 - (tooltipRect?.width || 300) / 2;
          break;
        case 'bottom':
          top = rect.bottom + 20;
          left = rect.left + rect.width / 2 - (tooltipRect?.width || 300) / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - (tooltipRect?.height || 200) / 2;
          left = rect.left - (tooltipRect?.width || 300) - 20;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - (tooltipRect?.height || 200) / 2;
          left = rect.right + 20;
          break;
        default:
          top = window.innerHeight / 2 - (tooltipRect?.height || 200) / 2;
          left = window.innerWidth / 2 - (tooltipRect?.width || 300) / 2;
      }

      // Ensure tooltip stays within viewport
      top = Math.max(20, Math.min(top, window.innerHeight - (tooltipRect?.height || 200) - 20));
      left = Math.max(20, Math.min(left, window.innerWidth - (tooltipRect?.width || 300) - 20));

      setTooltipPosition({ top, left });

      // Determine if this is a navigation button (circular) or other element (rounded rectangle)
      const isNavButton = currentTourStep.targetSelector.includes('nav-');
      
      if (isNavButton) {
        // Create circular spotlight effect for navigation buttons
        const padding = 15;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const radius = Math.max(rect.width, rect.height) / 2 + padding;
        
        setOverlayStyle({
          opacity: 0.75,
          background: `radial-gradient(circle at ${centerX}px ${centerY}px, transparent ${radius}px, rgba(0, 0, 0, 1) ${radius}px)`
        });
      } else {
        // Create rounded rectangle spotlight effect for other elements
        const padding = 20;
        const spotlightLeft = rect.left - padding;
        const spotlightTop = rect.top - padding;
        const spotlightWidth = rect.width + padding * 2;
        const spotlightHeight = rect.height + padding * 2;
        const borderRadius = 12;
        
        setOverlayStyle({
          opacity: 0.75,
          clipPath: `polygon(0% 0%, 0% 100%, ${spotlightLeft}px 100%, ${spotlightLeft}px ${spotlightTop + borderRadius}px, ${spotlightLeft + borderRadius}px ${spotlightTop}px, ${spotlightLeft + spotlightWidth - borderRadius}px ${spotlightTop}px, ${spotlightLeft + spotlightWidth}px ${spotlightTop + borderRadius}px, ${spotlightLeft + spotlightWidth}px ${spotlightTop + spotlightHeight - borderRadius}px, ${spotlightLeft + spotlightWidth - borderRadius}px ${spotlightTop + spotlightHeight}px, ${spotlightLeft + borderRadius}px ${spotlightTop + spotlightHeight}px, ${spotlightLeft}px ${spotlightTop + spotlightHeight - borderRadius}px, ${spotlightLeft}px 100%, 100% 100%, 100% 0%)`
        });
      }
    }, 300);
  };

  useEffect(() => {
    if (isVisible) {
      // Add a delay to ensure DOM elements are ready
      const timer = setTimeout(() => {
        calculatePosition();
      }, 100);
      
      window.addEventListener('resize', calculatePosition);
      return () => {
        window.removeEventListener('resize', calculatePosition);
        clearTimeout(timer);
      };
    }
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Use isolated auth endpoint instead of regular API
      const response = await fetch('/auth-isolated/complete-onboarding', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {

        onComplete();
      } else {
        console.error('❌ TOUR: Failed to complete onboarding');
        onComplete(); // Complete anyway to avoid endless loop
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      onComplete(); // Complete anyway to avoid endless loop
    }
  };

  const handleSkip = async () => {
    try {
      // Use isolated auth endpoint instead of regular API
      const response = await fetch('/auth-isolated/complete-onboarding', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {

        onSkip();
      } else {
        console.error('❌ TOUR: Failed to skip onboarding');
        onSkip(); // Skip anyway to avoid endless loop
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      onSkip(); // Skip anyway to avoid endless loop
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay with inverted spotlight effect */}
      <div 
        className="absolute inset-0 bg-black transition-all duration-300"
        style={overlayStyle}
      />
      
      {/* Tooltip */}
      <Card 
        ref={tooltipRef}
        className="absolute z-60 w-80 shadow-2xl border-2 border-orange-500"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          position: 'fixed'
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-orange-600">{currentTourStep.title}</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {currentTourStep.description}
          </p>
          
          {currentTourStep.action && (
            <p className="text-xs text-orange-600 font-medium mb-4">
              💡 {currentTourStep.action}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {tourSteps.length}
              </span>
              <div className="flex gap-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index <= currentStep ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              
              <Button size="sm" onClick={handleNext} className="bg-orange-500 hover:bg-orange-600">
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {currentStep === 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkip}
              className="w-full mt-3 text-muted-foreground"
            >
              Skip Tour
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OnboardingTour;