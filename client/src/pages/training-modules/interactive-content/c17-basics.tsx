import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";

export default function C17BasicsInteractive() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userSelections, setUserSelections] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, navigate] = useLocation();
  
  const totalSteps = 4;
  
  useEffect(() => {
    setProgress((currentStep / totalSteps) * 100);
  }, [currentStep]);
  
  const handleSelection = (value: string) => {
    setUserSelections({
      ...userSelections,
      [`step${currentStep}`]: value
    });
    setShowFeedback(false);
  };
  
  const checkAnswer = () => {
    const correctAnswers: Record<string, string> = {
      step1: "463L",
      step2: "18",
      step3: "centerline",
      step4: "164000"
    };
    
    const currentAnswer = userSelections[`step${currentStep}`];
    const isAnswerCorrect = currentAnswer === correctAnswers[`step${currentStep}`];
    
    setIsCorrect(isAnswerCorrect);
    setShowFeedback(true);
  };
  
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setShowFeedback(false);
    } else {
      // If on the last step and clicked "Complete", navigate back to modules
      navigate("/training-modules");
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setShowFeedback(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">C-17 Pallet Position Identification</h3>
        <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      {currentStep === 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="font-medium mb-2">Question 1:</p>
                <p>What type of pallet system is used in the C-17 Globemaster III?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step1 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ULD" id="option1" />
                  <Label htmlFor="option1">Standard ULD Container System</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="463L" id="option2" />
                  <Label htmlFor="option2">463L Pallet System</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CRAF" id="option3" />
                  <Label htmlFor="option3">CRAF Civilian System</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="option4" />
                  <Label htmlFor="option4">Custom Military Design</Label>
                </div>
              </RadioGroup>
              
              {showFeedback && (
                <Alert variant={isCorrect ? "default" : "destructive"} className="mt-4">
                  <div className="flex items-start">
                    {isCorrect ? (
                      <CheckCircle className="h-4 w-4 mt-0.5 mr-2 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mt-0.5 mr-2" />
                    )}
                    <div>
                      <AlertTitle>
                        {isCorrect ? "Correct!" : "Not quite right"}
                      </AlertTitle>
                      <AlertDescription className="mt-1">
                        {isCorrect 
                          ? "The 463L pallet system is the standard cargo handling system used by the C-17 Globemaster III. These pallets measure 108\" × 88\" and are designed for maximum interoperability between military aircraft." 
                          : "The correct answer is 463L pallet system. These standardized pallets form the backbone of military air transport logistics and are designed specifically for aircraft like the C-17."}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {currentStep === 2 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="font-medium mb-2">Question 2:</p>
                <p>How many standard 463L pallet positions are in a C-17 Globemaster III?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step2 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="12" id="option1" />
                  <Label htmlFor="option1">12 positions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="15" id="option2" />
                  <Label htmlFor="option2">15 positions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="18" id="option3" />
                  <Label htmlFor="option3">18 positions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="24" id="option4" />
                  <Label htmlFor="option4">24 positions</Label>
                </div>
              </RadioGroup>
              
              {showFeedback && (
                <Alert variant={isCorrect ? "default" : "destructive"} className="mt-4">
                  <div className="flex items-start">
                    {isCorrect ? (
                      <CheckCircle className="h-4 w-4 mt-0.5 mr-2 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mt-0.5 mr-2" />
                    )}
                    <div>
                      <AlertTitle>
                        {isCorrect ? "Correct!" : "Not quite right"}
                      </AlertTitle>
                      <AlertDescription className="mt-1">
                        {isCorrect 
                          ? "The C-17 has 18 pallet positions when using the standard 463L pallets in its primary cargo configuration. These are typically arranged in two rows of 9 pallets each." 
                          : "The correct answer is 18 positions. The C-17 can accommodate 18 standard 463L pallets in its standard configuration, arranged in a 2 x 9 grid."}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {currentStep === 3 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="font-medium mb-2">Question 3:</p>
                <p>What is the reference line used for pallet position identification in the C-17?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step3 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sidewall" id="option1" />
                  <Label htmlFor="option1">Sidewall Markers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="centerline" id="option2" />
                  <Label htmlFor="option2">Aircraft Centerline</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fuselage" id="option3" />
                  <Label htmlFor="option3">Fuselage Stations</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="door" id="option4" />
                  <Label htmlFor="option4">Cargo Door Reference</Label>
                </div>
              </RadioGroup>
              
              {showFeedback && (
                <Alert variant={isCorrect ? "default" : "destructive"} className="mt-4">
                  <div className="flex items-start">
                    {isCorrect ? (
                      <CheckCircle className="h-4 w-4 mt-0.5 mr-2 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mt-0.5 mr-2" />
                    )}
                    <div>
                      <AlertTitle>
                        {isCorrect ? "Correct!" : "Not quite right"}
                      </AlertTitle>
                      <AlertDescription className="mt-1">
                        {isCorrect 
                          ? "The aircraft centerline is used as the primary reference for pallet positioning in the C-17. Pallets are identified based on their position relative to this centerline, with designations like 'left' and 'right' of centerline." 
                          : "The correct answer is the Aircraft Centerline. Pallet positions in the C-17 are identified based on their location relative to the aircraft centerline, which serves as the primary reference line for cargo organization."}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {currentStep === 4 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="font-medium mb-2">Question 4:</p>
                <p>What is the maximum payload capacity (in pounds) of the C-17 Globemaster III?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step4 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="125000" id="option1" />
                  <Label htmlFor="option1">125,000 lbs</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="145000" id="option2" />
                  <Label htmlFor="option2">145,000 lbs</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="164000" id="option3" />
                  <Label htmlFor="option3">164,000 lbs</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="189000" id="option4" />
                  <Label htmlFor="option4">189,000 lbs</Label>
                </div>
              </RadioGroup>
              
              {showFeedback && (
                <Alert variant={isCorrect ? "default" : "destructive"} className="mt-4">
                  <div className="flex items-start">
                    {isCorrect ? (
                      <CheckCircle className="h-4 w-4 mt-0.5 mr-2 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mt-0.5 mr-2" />
                    )}
                    <div>
                      <AlertTitle>
                        {isCorrect ? "Correct!" : "Not quite right"}
                      </AlertTitle>
                      <AlertDescription className="mt-1">
                        {isCorrect 
                          ? "The C-17 Globemaster III has a maximum payload capacity of 164,900 pounds (approximately 74,800 kg). This substantial capacity allows it to transport heavy equipment, vehicles, and large numbers of palletized cargo." 
                          : "The correct answer is 164,000 lbs (actually 164,900 lbs). This substantial payload capacity makes the C-17 an exceptional strategic airlifter capable of transporting heavy equipment including vehicles, containerized cargo, and troops."}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        <div className="space-x-2">
          {!showFeedback && (
            <Button 
              onClick={checkAnswer}
              disabled={!userSelections[`step${currentStep}`]}
            >
              Check Answer
            </Button>
          )}
          
          {showFeedback && (
            <Button 
              onClick={handleNext}
              disabled={currentStep !== totalSteps && !isCorrect}
              variant={isCorrect ? "default" : "outline"}
            >
              {currentStep === totalSteps ? "Complete" : "Next"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}