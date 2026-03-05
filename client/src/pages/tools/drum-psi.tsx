import { useState } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cylinder } from "lucide-react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

export default function DrumPsiCalculatorPage() {
  const [_, navigate] = useLocation();
  
  // Input states
  const [weight, setWeight] = useState<string>("");
  const [outerDiameter, setOuterDiameter] = useState<string>("");
  const [innerDiameter, setInnerDiameter] = useState<string>("");
  const [drumType, setDrumType] = useState<"with-rim" | "without-rim">("with-rim");
  
  // Result state
  const [psiResult, setPsiResult] = useState<number | null>(null);
  const [contactArea, setContactArea] = useState<number | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleBackClick = () => {
    navigate("/tools");
  };

  // Calculate PSI for drums
  const calculatePsi = () => {
    setHasError(false);
    setErrorMessage("");
    
    const weightValue = parseFloat(weight);
    const outerDiameterValue = parseFloat(outerDiameter);
    let innerDiameterValue = parseFloat(innerDiameter);
    
    // Validate inputs
    if (isNaN(weightValue) || isNaN(outerDiameterValue)) {
      setHasError(true);
      setErrorMessage("Please enter valid numbers for all required fields");
      setPsiResult(null);
      setContactArea(null);
      return;
    }
    
    if (outerDiameterValue <= 0) {
      setHasError(true);
      setErrorMessage("Outer diameter must be greater than zero");
      setPsiResult(null);
      setContactArea(null);
      return;
    }
    
    // Calculate contact area based on drum type
    let area = 0;
    
    if (drumType === "with-rim") {
      // For drums with rim, we need inner diameter
      if (isNaN(innerDiameterValue) || innerDiameterValue <= 0) {
        setHasError(true);
        setErrorMessage("Inner diameter must be a valid positive number for drums with rim");
        setPsiResult(null);
        setContactArea(null);
        return;
      }
      
      if (innerDiameterValue >= outerDiameterValue) {
        setHasError(true);
        setErrorMessage("Inner diameter must be smaller than outer diameter");
        setPsiResult(null);
        setContactArea(null);
        return;
      }
      
      // Calculate area of ring: π(R² - r²) where R is outer radius and r is inner radius
      const outerRadius = outerDiameterValue / 2;
      const innerRadius = innerDiameterValue / 2;
      area = Math.PI * (Math.pow(outerRadius, 2) - Math.pow(innerRadius, 2));
    } else {
      // For drums without rim, contact area is π times the square of the radius
      const radius = outerDiameterValue / 2;
      area = Math.PI * Math.pow(radius, 2);
    }
    
    // Calculate PSI
    const result = weightValue / area;
    setPsiResult(result);
    setContactArea(area);
  };

  // Reset all fields
  const resetFields = () => {
    setWeight("");
    setOuterDiameter("");
    setInnerDiameter("");
    setPsiResult(null);
    setContactArea(null);
    setHasError(false);
    setErrorMessage("");
  };

  return (
    <>
      <Helmet>
        <title>Drum PSI Calculator - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Calculate Pounds per Square Inch (PSI) for drums with and without rims in aircraft cargo operations." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-6"
            onClick={handleBackClick}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tools
          </Button>
          
          {/* Header Section */}
          <section className="mb-10">
            <div className="flex items-center mb-4">
              <Cylinder className="h-6 w-6 mr-3 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">
                Drum PSI Calculator
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Calculate Pounds per Square Inch (PSI) for drums with and without rims
            </p>
          </section>

          {/* Calculator Card */}
          <Card className="mb-8">
            <CardHeader className="bg-primary/10">
              <CardTitle>Drum PSI Calculator</CardTitle>
              <CardDescription>
                Calculate PSI for both standard drums and drums with rims
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <RadioGroup 
                  value={drumType} 
                  onValueChange={(value) => setDrumType(value as "with-rim" | "without-rim")} 
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="with-rim" id="with-rim" />
                    <Label htmlFor="with-rim">Drum with Rim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="without-rim" id="without-rim" />
                    <Label htmlFor="without-rim">Drum without Rim</Label>
                  </div>
                </RadioGroup>
                
                <Separator />
                
                <div className="bg-slate-800 rounded-md p-3 text-center">
                  {drumType === "with-rim" ? (
                    <>
                      <p className="font-medium">Weight ÷ [π × (Outer radius² - Inner radius²)] = PSI</p>
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40">
                        <span className="text-primary/70">e.g.</span> 500 lbs ÷ [π × (9² − 7²)] = 500 ÷ 100.5 = <span className="text-primary font-semibold">4.97 PSI</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">Weight ÷ (π × radius²) = PSI</p>
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40">
                        <span className="text-primary/70">e.g.</span> 500 lbs ÷ (π × 9²) = 500 ÷ 254.5 = <span className="text-primary font-semibold">1.97 PSI</span>
                      </p>
                    </>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="weight">
                      Weight (lbs)
                    </Label>
                    <Input 
                      id="weight" 
                      type="number" 
                      step="1" 
                      placeholder="Enter drum weight" 
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The total weight of the drum and its contents
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="outer-diameter">
                      Outer Diameter (inches)
                    </Label>
                    <Input 
                      id="outer-diameter" 
                      type="number" 
                      step="0.1" 
                      placeholder="Enter outer diameter" 
                      value={outerDiameter}
                      onChange={(e) => setOuterDiameter(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The outer diameter of the drum
                    </p>
                  </div>
                  
                  {drumType === "with-rim" && (
                    <div className="space-y-2">
                      <Label htmlFor="inner-diameter">
                        Inner Diameter (inches)
                      </Label>
                      <Input 
                        id="inner-diameter" 
                        type="number" 
                        step="0.1" 
                        placeholder="Enter inner diameter" 
                        value={innerDiameter}
                        onChange={(e) => setInnerDiameter(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        The inner diameter of the rim (the hollow center)
                      </p>
                    </div>
                  )}
                </div>
                
                {hasError && (
                  <Alert variant="destructive" className="text-sm">
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={resetFields}>
                    Reset
                  </Button>
                  <Button onClick={calculatePsi}>
                    Calculate
                  </Button>
                </div>
                
                {psiResult !== null && (
                  <div className="mt-6 p-4 bg-muted rounded-md">
                    <div className="font-medium mb-2">Result:</div>
                    <div className="text-2xl font-bold text-primary">
                      {psiResult.toFixed(2)} PSI
                    </div>
                    {contactArea !== null && (
                      <p className="text-sm mt-2">
                        Contact Area: {contactArea.toFixed(2)} square inches
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Pounds per Square Inch on the contact surface
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>About Drum PSI Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>
                  Calculating PSI for drums is essential for proper cargo loading on aircraft. The calculation 
                  differs depending on whether the drum has a rim or sits flat on its entire base.
                </p>
                
                <div className="space-y-2">
                  <p className="font-medium">Calculation Methods:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <span className="font-medium">Drums with Rim</span> - Contact area is only the rim (outer circle minus inner circle).
                      The formula is: Weight ÷ [π × (Outer radius² - Inner radius²)]
                    </li>
                    <li>
                      <span className="font-medium">Drums without Rim</span> - Contact area is the entire base.
                      The formula is: Weight ÷ (π × radius²)
                    </li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 p-3 rounded-md">
                  <p className="font-medium mb-1">Important Note:</p>
                  <p>
                    A drum with a rim will have a significantly higher PSI than a drum with a flat base of the same weight, 
                    as the weight is distributed over a smaller contact area.
                  </p>
                </div>
                
                <p>
                  Always ensure calculated PSI values are within the aircraft floor loading limits. Exceeding these limits
                  could cause damage to the aircraft structure and compromise flight safety.
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 text-xs text-muted-foreground">
              <p>
                For accurate PSI calculations, ensure precise measurements of drum dimensions. 
                Aircraft loading manuals will specify the maximum allowable PSI for each aircraft type and floor section.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}