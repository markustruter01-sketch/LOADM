import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, AlertCircle, MinusCircle, PlusCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

export default function C27JBasicsInteractive() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userSelections, setUserSelections] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, navigate] = useLocation();
  
  const totalSteps = 5;
  
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
      step1: "6",
      step2: "short",
      step3: "versatile",
      step4: "11300",
      step5: "dual"
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
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">C-27J Spartan Fundamentals</h3>
        <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      {currentStep === 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="font-medium mb-2">Question 1:</p>
                <p>How many standard 463L pallets can be carried in the C-27J Spartan?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step1 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="option1" />
                  <Label htmlFor="option1">3 pallets</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="6" id="option2" />
                  <Label htmlFor="option2">6 pallets</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="9" id="option3" />
                  <Label htmlFor="option3">9 pallets</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="12" id="option4" />
                  <Label htmlFor="option4">12 pallets</Label>
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
                          ? "The C-27J Spartan can carry up to 6 standard 463L pallets in its cargo compartment. These are typically arranged in a 2x3 configuration (two rows of three pallets each)." 
                          : "The correct answer is 6 pallets. The C-27J Spartan can accommodate 6 standard 463L pallets in its cargo compartment, arranged in a 2×3 configuration."}
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
                <p>What type of airfield operations is the C-27J Spartan specifically designed for?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step2 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="long" id="option1" />
                  <Label htmlFor="option1">Long-range international airfields</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="short" id="option2" />
                  <Label htmlFor="option2">Short, unimproved airfields</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="carrier" id="option3" />
                  <Label htmlFor="option3">Aircraft carrier operations</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="civilian" id="option4" />
                  <Label htmlFor="option4">Civilian airport operations only</Label>
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
                          ? "The C-27J Spartan is specifically designed for operations from short, unimproved airfields. This capability allows it to deliver cargo to forward operating locations that may not be accessible to larger transport aircraft." 
                          : "The correct answer is short, unimproved airfields. The C-27J was specifically designed to operate from austere airfields with minimal infrastructure, allowing it to reach remote locations that larger aircraft cannot access."}
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
                <p>What is the C-27J Spartan's primary advantage compared to larger transport aircraft?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step3 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="speed" id="option1" />
                  <Label htmlFor="option1">Superior speed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="capacity" id="option2" />
                  <Label htmlFor="option2">Greater cargo capacity</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="range" id="option3" />
                  <Label htmlFor="option3">Extended operational range</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="versatile" id="option4" />
                  <Label htmlFor="option4">Tactical versatility</Label>
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
                          ? "The C-27J's primary advantage is its tactical versatility. While it has less cargo capacity than larger aircraft, it can operate from austere airfields, perform multiple mission types (cargo, troop transport, medical evacuation, etc.), and reach locations that larger aircraft cannot access." 
                          : "The correct answer is tactical versatility. The C-27J bridges the gap between helicopters and larger transport aircraft, offering capabilities that make it ideal for a wide range of missions in challenging environments."}
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
                <p>What is the maximum cargo payload (in kg) of the C-27J Spartan?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step4 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="8500" id="option1" />
                  <Label htmlFor="option1">8,500 kg</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="11300" id="option2" />
                  <Label htmlFor="option2">11,300 kg</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="15000" id="option3" />
                  <Label htmlFor="option3">15,000 kg</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="18000" id="option4" />
                  <Label htmlFor="option4">18,000 kg</Label>
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
                          ? "The C-27J Spartan has a maximum cargo payload of approximately 11,300 kg (24,910 lbs). This capacity allows it to transport a significant amount of cargo while still maintaining the ability to operate from austere airfields." 
                          : "The correct answer is 11,300 kg. While this is less than larger transport aircraft, the C-27J's payload capacity is sufficient for its tactical airlift mission, particularly when operating in environments where larger aircraft cannot access."}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {currentStep === 5 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="font-medium mb-2">Question 5:</p>
                <p>What unique operational capability does the C-27J Spartan have regarding its cargo ramp?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step5 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vertical" id="option1" />
                  <Label htmlFor="option1">Vertical loading capability</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dual" id="option2" />
                  <Label htmlFor="option2">Dual cargo door/ramp operation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="airdrop" id="option3" />
                  <Label htmlFor="option3">Airdrop only with no ground loading</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="extended" id="option4" />
                  <Label htmlFor="option4">Extended floating dock capability</Label>
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
                          ? "The C-27J Spartan features a unique dual cargo door/ramp operation. The cargo ramp can be used in various configurations, including fully open for large cargo, partially open with the door up for airdrop operations, or with just the upper door open for paratroop operations. This flexibility enhances its versatility for different mission types." 
                          : "The correct answer is dual cargo door/ramp operation. The C-27J's rear cargo area can be configured in multiple ways, with the ability to operate the upper door and lower ramp independently for different mission requirements."}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
              
              {isCorrect && (
                <div className="mt-6 bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-3">C-27J Spartan Cargo Compartment Specifications</h4>
                  <ul className="space-y-2 ml-2">
                    <li className="flex items-start">
                      <MinusCircle className="h-4 w-4 mt-1 mr-2 text-orange-500" />
                      <span>Cargo Floor Length: 9.1 meters (29.8 feet)</span>
                    </li>
                    <li className="flex items-start">
                      <MinusCircle className="h-4 w-4 mt-1 mr-2 text-orange-500" />
                      <span>Cargo Floor Width: 2.45 meters (8 feet)</span>
                    </li>
                    <li className="flex items-start">
                      <MinusCircle className="h-4 w-4 mt-1 mr-2 text-orange-500" />
                      <span>Cargo Compartment Height: 2.6 meters (8.5 feet)</span>
                    </li>
                    <li className="flex items-start">
                      <MinusCircle className="h-4 w-4 mt-1 mr-2 text-orange-500" />
                      <span>Cargo Floor Area: 22.3 square meters (240 square feet)</span>
                    </li>
                    <li className="flex items-start">
                      <MinusCircle className="h-4 w-4 mt-1 mr-2 text-orange-500" />
                      <span>Cargo Volume: 58 cubic meters (2,050 cubic feet)</span>
                    </li>
                    <li className="flex items-start">
                      <PlusCircle className="h-4 w-4 mt-1 mr-2 text-green-500" />
                      <span>Can transport up to 60 troops or 46 paratroopers</span>
                    </li>
                    <li className="flex items-start">
                      <PlusCircle className="h-4 w-4 mt-1 mr-2 text-green-500" />
                      <span>Can be configured for medical evacuation with 36 litters</span>
                    </li>
                    <li className="flex items-start">
                      <PlusCircle className="h-4 w-4 mt-1 mr-2 text-green-500" />
                      <span>Quick-change configuration allows rapid conversion between roles</span>
                    </li>
                  </ul>
                </div>
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