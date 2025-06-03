import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";

export default function KC30ABasicsInteractive() {
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
      step1: "ld3",
      step2: "kg",
      step3: "14",
      step4: "pallet",
      step5: "45000"
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
        <h3 className="text-lg font-medium">KC30-A Cargo Systems</h3>
        <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      {currentStep === 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="font-medium mb-2">Question 1:</p>
                <p>What type of Unit Load Device (ULD) is primarily used in the KC30-A cargo system?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step1 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ld3" id="option1" />
                  <Label htmlFor="option1">LD3 Container</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ld7" id="option2" />
                  <Label htmlFor="option2">LD7 Container</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="463l" id="option3" />
                  <Label htmlFor="option3">463L Pallet</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="amc" id="option4" />
                  <Label htmlFor="option4">AMC Container</Label>
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
                          ? "The LD3 container is the primary ULD used in the KC30-A cargo system. These containers have a distinctive contoured shape that fits the curved lower deck of the aircraft, making efficient use of the available space." 
                          : "The correct answer is the LD3 Container. These specific ULDs are designed for the lower deck of wide-body aircraft like the KC30-A (Airbus A330 MRTT) and are specially contoured to match the curvature of the fuselage."}
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
                <p>What unit of measurement is used for weight calculations in the KC30-A?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step2 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lb" id="option1" />
                  <Label htmlFor="option1">Pounds (lbs)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="kg" id="option2" />
                  <Label htmlFor="option2">Kilograms (kg)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ton" id="option3" />
                  <Label htmlFor="option3">Metric Tons</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="st" id="option4" />
                  <Label htmlFor="option4">Short Tons</Label>
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
                          ? "The KC30-A uses kilograms (kg) as the standard unit of measurement for all weight calculations. This differs from some other military aircraft like the C-17 and C-130 which typically use pounds. This is an important distinction for loadmasters to remember when working with different aircraft types." 
                          : "The correct answer is Kilograms (kg). The KC30-A, as an Airbus platform, uses the metric system for all weight calculations, unlike some other military transport aircraft that use pounds."}
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
                <p>How many LD3 containers can be loaded in the standard KC30-A lower deck configuration?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step3 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="8" id="option1" />
                  <Label htmlFor="option1">8 containers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="12" id="option2" />
                  <Label htmlFor="option2">12 containers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="14" id="option3" />
                  <Label htmlFor="option3">14 containers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="18" id="option4" />
                  <Label htmlFor="option4">18 containers</Label>
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
                          ? "The KC30-A can accommodate 14 LD3 containers in its standard lower deck cargo configuration. These containers are typically arranged in a 2x7 layout (two rows of seven containers each)." 
                          : "The correct answer is 14 containers. The KC30-A's lower deck can accommodate 14 LD3 containers in its standard configuration, arranged in two rows of seven containers each."}
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
                <p>What simplified cargo layout is available for the KC30-A as an alternative to the LD3 container system?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step4 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bulk" id="option1" />
                  <Label htmlFor="option1">Bulk Loading (no ULDs)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pallet" id="option2" />
                  <Label htmlFor="option2">8-Position Pallet System</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hybrid" id="option3" />
                  <Label htmlFor="option3">Hybrid Container/Bulk System</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="option4" />
                  <Label htmlFor="option4">Custom Military Module System</Label>
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
                          ? "As an alternative to the standard LD3 layout, the KC30-A can use a simplified 8-position pallet system for cargo operations. This configuration allows for larger, non-containerized loads to be transported." 
                          : "The correct answer is the 8-Position Pallet System. This alternative configuration allows the KC30-A to transport larger items that would not fit in LD3 containers, providing flexibility for different mission requirements."}
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
                <p>What is the maximum cargo payload capacity (in kg) of the KC30-A?</p>
              </div>
              
              <RadioGroup
                value={userSelections.step5 || ""}
                onValueChange={handleSelection}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="32000" id="option1" />
                  <Label htmlFor="option1">32,000 kg</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="38000" id="option2" />
                  <Label htmlFor="option2">38,000 kg</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="45000" id="option3" />
                  <Label htmlFor="option3">45,000 kg</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="52000" id="option4" />
                  <Label htmlFor="option4">52,000 kg</Label>
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
                          ? "The KC30-A has a maximum cargo payload capacity of approximately 45,000 kg. This capacity must be balanced with the aircraft's fuel load, especially on missions that involve aerial refueling operations." 
                          : "The correct answer is 45,000 kg. The KC30-A Multi-Role Tanker Transport has a substantial cargo capacity, though the actual usable payload on any given mission will depend on the fuel load and range requirements."}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
              
              {isCorrect && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-4">KC30-A Container Weight Limits Reference Table</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Container Type</TableHead>
                        <TableHead>Max Gross Weight</TableHead>
                        <TableHead>Tare Weight</TableHead>
                        <TableHead>Max Net Load</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>LD3 Standard</TableCell>
                        <TableCell>1,588 kg</TableCell>
                        <TableCell>76 kg</TableCell>
                        <TableCell>1,512 kg</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>LD3-45 (45" Height)</TableCell>
                        <TableCell>1,588 kg</TableCell>
                        <TableCell>88 kg</TableCell>
                        <TableCell>1,500 kg</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>LD3-45W (45" Heavy)</TableCell>
                        <TableCell>2,000 kg</TableCell>
                        <TableCell>90 kg</TableCell>
                        <TableCell>1,910 kg</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Pallet Position</TableCell>
                        <TableCell>6,800 kg</TableCell>
                        <TableCell>136 kg</TableCell>
                        <TableCell>6,664 kg</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
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