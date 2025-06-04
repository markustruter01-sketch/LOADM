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
    description: 'Your comprehensive military logistics and training management platform. Let me show you around the key features.',
    targetSelector: '',
    position: 'center'
  },
  {
    id: 'navigation',
    title: 'Navigation Menu',
    description: 'Use the bottom navigation bar to access different sections: Home, Load Planning, Documents, Tools, and Training.',
    targetSelector: '.bottom-nav, nav[role="navigation"]',
    position: 'top'
  },
  {
    id: 'load-planning',
    title: 'Load Planning',
    description: 'Create and manage aircraft load plans. Select different aircraft types and calculate center of gravity for safe operations.',
    targetSelector: '.load-planning',
    position: 'top',
    action: 'Click here to explore load planning'
  },
  {
    id: 'documents',
    title: 'Documents & Resources',
    description: 'Access PDF documents, forms, and the phone directory for airbase contacts. View documents in popup modals.',
    targetSelector: '.documents-section',
    position: 'top',
    action: 'Click here to view documents'
  },
  {
    id: 'training',
    title: 'Training Modules',
    description: 'Complete structured learning modules and track your progress through various training scenarios.',
    targetSelector: '.training-modules',
    position: 'top',
    action: 'Click here to start training'
  },
  {
    id: 'tools',
    title: 'Calculation Tools',
    description: 'Use specialized calculators for WAM, restraint calculations, fuel planning, and PSI calculations.',
    targetSelector: '.tools-section',
    position: 'top',
    action: 'Click here to access tools'
  },
  {
    id: 'complete',
    title: 'Tour Complete!',
    description: 'You\'re all set! Explore the platform and use the chat system if you need help. You can restart this tour anytime from your profile.',
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
      // Center position for welcome/complete steps
      setTooltipPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
      setOverlayStyle({});
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

      // Create accurate circular spotlight effect
      const spotlightRadius = Math.max(rect.width, rect.height) / 2 + 30;
      const spotlightX = rect.left + rect.width / 2;
      const spotlightY = rect.top + rect.height / 2;
      
      setOverlayStyle({
        clipPath: `circle(${spotlightRadius}px at ${spotlightX}px ${spotlightY}px)`,
        opacity: 0.85
      });
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
        console.log('✅ TOUR: Onboarding completed successfully');
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
        console.log('✅ TOUR: Onboarding skipped successfully');
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
      {/* Overlay with spotlight effect */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-60 transition-all duration-300"
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