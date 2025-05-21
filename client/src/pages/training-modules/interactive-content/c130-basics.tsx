import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, AlertCircle, PlaneTakeoff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function C130BasicsInteractive() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userSelections, setUserSelections] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeContent, setActiveContent] = useState("securement");
  
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
      step1: "standard",
      step2: "8",
      step3: "combat",
      step4: "20000"
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
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setShowFeedback(false);
    }
  };
  
  const SecurementContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">C-130 Pallet Securement Techniques</h3>
        <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      {currentStep === 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="font-medium mb-2">Question 1:</p>
                <p>Which locking rail system is used on the C-130 Hercules for securing 463L pallets?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step1 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vertical" id="option1" />
                  <Label htmlFor="option1">Vertical Restraint System</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="option2" />
                  <Label htmlFor="option2">Standard Dual Rail Lock System</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="option3" />
                  <Label htmlFor="option3">Single Point Lock System</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tactical" id="option4" />
                  <Label htmlFor="option4">Tactical Rapid Lock System</Label>
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
                          ? "The C-130 Hercules uses the Standard Dual Rail Lock System for securing 463L pallets. This system features two parallel locking rails that run the length of the cargo compartment, with detents positioned at regular intervals for securing pallets." 
                          : "The correct answer is the Standard Dual Rail Lock System. This system is used throughout the C-130 cargo compartment to secure 463L pallets in position during flight operations."}
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
                <p>How many standard 463L pallet positions are available in the C-130 Hercules?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step2 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="6" id="option1" />
                  <Label htmlFor="option1">6 positions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="8" id="option2" />
                  <Label htmlFor="option2">8 positions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10" id="option3" />
                  <Label htmlFor="option3">10 positions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="12" id="option4" />
                  <Label htmlFor="option4">12 positions</Label>
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
                          ? "The C-130 Hercules has 8 standard pallet positions for 463L pallets. These are typically arranged in a 2x4 configuration (two rows of four pallets each) in the cargo compartment." 
                          : "The correct answer is 8 positions. The C-130 can accommodate 8 standard 463L pallets in its cargo compartment, typically arranged in a 2x4 configuration (two rows of four)."}
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
                <p>Which cargo offload method is unique to the C-130 and allows for rapid unloading without a forklift?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step3 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ramped" id="option1" />
                  <Label htmlFor="option1">Ramped Gravity Offload</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rolling" id="option2" />
                  <Label htmlFor="option2">Rolling Stock Method</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="combat" id="option3" />
                  <Label htmlFor="option3">Combat Offload</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tactical" id="option4" />
                  <Label htmlFor="option4">Tactical Jettison</Label>
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
                          ? "Combat Offload is a specialized technique unique to the C-130 where cargo is rapidly unloaded by applying aircraft brakes while allowing pallets to roll out the rear cargo ramp. This method is used in situations where a forklift or other material handling equipment is not available or when rapid offload is required for tactical reasons." 
                          : "The correct answer is Combat Offload. This technique allows the C-130 to rapidly offload cargo without ground equipment by applying aircraft brakes while allowing pallets to exit the rear cargo ramp under controlled conditions."}
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
                <p>What is the maximum cargo payload (in pounds) of the standard C-130H Hercules?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step4 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="15000" id="option1" />
                  <Label htmlFor="option1">15,000 lbs</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="20000" id="option2" />
                  <Label htmlFor="option2">20,000 lbs</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="25000" id="option3" />
                  <Label htmlFor="option3">25,000 lbs</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30000" id="option4" />
                  <Label htmlFor="option4">30,000 lbs</Label>
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
                          ? "The C-130H Hercules has a maximum cargo payload of approximately 20,000 lbs (9,000 kg). This capacity makes it a versatile medium-lift transport capable of operating from austere or unprepared runways." 
                          : "The correct answer is 20,000 lbs. The C-130H has a payload capacity of approximately 20,000 pounds, though exact capacity varies by mission profile, range requirements, and environmental conditions."}
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
  
  const GuideContent = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">C-130 Hercules Cargo Compartment Reference Guide</h3>
      
      <div className="bg-muted rounded-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <PlaneTakeoff className="h-5 w-5 text-orange-500" />
          <h4 className="font-medium">C-130 Hercules Cargo Compartment Dimensions</h4>
        </div>
        
        <div className="space-y-3 ml-7">
          <p><strong>Length:</strong> 40 feet (12.19 meters)</p>
          <p><strong>Width:</strong> 10 feet, 3 inches (3.12 meters)</p>
          <p><strong>Height:</strong> 9 feet, 1 inch (2.77 meters)</p>
          <p><strong>Usable Volume:</strong> Approximately 4,500 cubic feet (127.4 cubic meters)</p>
          <p><strong>Cargo Floor Area:</strong> Approximately 420 square feet (39 square meters)</p>
        </div>
      </div>
      
      <div className="bg-muted rounded-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <PlaneTakeoff className="h-5 w-5 text-orange-500" />
          <h4 className="font-medium">Cargo Loading Guidelines</h4>
        </div>
        
        <div className="space-y-3 ml-7">
          <p><strong>Standard Pallet Size:</strong> 463L (108" × 88")</p>
          <p><strong>Maximum Pallet Height:</strong> 96 inches (8 feet)</p>
          <p><strong>Maximum Individual Pallet Weight:</strong> 10,000 lbs</p>
          <p><strong>Maximum Rolling Stock Weight:</strong> 25,000 lbs</p>
          <p><strong>Maximum Floor Loading:</strong> 50 pounds per square inch (PSI)</p>
          <p><strong>Ramp Capacity:</strong> 4,000 lbs when in flight; 10,000 lbs for ground operations</p>
        </div>
      </div>
      
      <div className="bg-muted rounded-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <PlaneTakeoff className="h-5 w-5 text-orange-500" />
          <h4 className="font-medium">Cargo Restraint Requirements</h4>
        </div>
        
        <div className="space-y-3 ml-7">
          <p><strong>Forward Restraint:</strong> 3G (three times the cargo weight)</p>
          <p><strong>Aft Restraint:</strong> 1.5G (one and half times the cargo weight)</p>
          <p><strong>Lateral Restraint:</strong> 1.5G (one and half times the cargo weight)</p>
          <p><strong>Vertical Restraint:</strong> 2G (two times the cargo weight)</p>
          <p><strong>Tie-down Rings:</strong> 25,000 lbs capacity (floor rings), 10,000 lbs capacity (sidewall rings)</p>
          <p><strong>Minimum Tie-downs Required:</strong> For standard pallets, 4 per pallet (one at each corner)</p>
        </div>
      </div>
      
      <Alert className="mt-4">
        <AlertTitle className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          Important Safety Note
        </AlertTitle>
        <AlertDescription className="mt-1">
          Always consult the aircraft technical manual and loading guidance from qualified personnel before planning cargo loads for the C-130. Proper weight distribution and cargo securement are critical for flight safety.
        </AlertDescription>
      </Alert>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="securement" value={activeContent} onValueChange={setActiveContent}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="securement">Interactive Training</TabsTrigger>
          <TabsTrigger value="guide">Reference Guide</TabsTrigger>
        </TabsList>
        
        <TabsContent value="securement" className="pt-6">
          <SecurementContent />
        </TabsContent>
        
        <TabsContent value="guide" className="pt-6">
          <GuideContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}