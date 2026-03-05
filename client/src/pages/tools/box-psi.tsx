import { useState } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Box } from "lucide-react";
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

export default function BoxPsiCalculatorPage() {
  const [_, navigate] = useLocation();
  
  // Input states
  const [weight, setWeight] = useState<string>("");
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  
  // Result state
  const [psiResult, setPsiResult] = useState<number | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleBackClick = () => {
    navigate("/tools");
  };

  // Calculate PSI for square/rectangle box
  const calculatePsi = () => {
    setHasError(false);
    setErrorMessage("");
    
    const weightValue = parseFloat(weight);
    const lengthValue = parseFloat(length);
    const widthValue = parseFloat(width);
    
    if (isNaN(weightValue) || isNaN(lengthValue) || isNaN(widthValue)) {
      setHasError(true);
      setErrorMessage("Please enter valid numbers for all fields");
      setPsiResult(null);
      return;
    }
    
    if (lengthValue <= 0 || widthValue <= 0) {
      setHasError(true);
      setErrorMessage("Length and width must be greater than zero");
      setPsiResult(null);
      return;
    }
    
    // Calculate PSI (weight divided by surface area)
    const area = lengthValue * widthValue;
    const result = weightValue / area;
    setPsiResult(result);
  };

  // Reset all fields
  const resetFields = () => {
    setWeight("");
    setLength("");
    setWidth("");
    setPsiResult(null);
    setHasError(false);
    setErrorMessage("");
  };

  return (
    <>
      <Helmet>
        <title>Box PSI Calculator - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Calculate Pounds per Square Inch (PSI) for square and rectangular boxes in aircraft cargo operations." 
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
              <Box className="h-6 w-6 mr-3 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">
                Box PSI Calculator
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Calculate Pounds per Square Inch (PSI) for square and rectangular boxes
            </p>
          </section>

          {/* Calculator Card */}
          <Card className="mb-8">
            <CardHeader className="bg-primary/10">
              <CardTitle>Square/Rectangle Box PSI Calculator</CardTitle>
              <CardDescription>
                Calculate PSI by dividing weight by contact area (length × width)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="p-3 bg-slate-800 rounded-md text-center">
                  <p className="font-medium">Weight ÷ (Length × Width) = PSI</p>
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40">
                    <span className="text-primary/70">e.g.</span> 2,000 lbs ÷ (24 in × 20 in) = <span className="text-primary font-semibold">4.17 PSI</span>
                  </p>
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
                      placeholder="Enter box weight" 
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The total weight of the box and its contents
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="length">
                      Length (inches)
                    </Label>
                    <Input 
                      id="length" 
                      type="number" 
                      step="0.1" 
                      placeholder="Enter box length" 
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The length of the box's contact surface
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="width">
                      Width (inches)
                    </Label>
                    <Input 
                      id="width" 
                      type="number" 
                      step="0.1" 
                      placeholder="Enter box width" 
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The width of the box's contact surface
                    </p>
                  </div>
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
              <CardTitle>About Box PSI Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>
                  PSI (Pounds per Square Inch) calculations are essential for determining floor loading capabilities 
                  for cargo aircraft. This measures the pressure exerted by a box or container on the aircraft floor.
                </p>
                
                <div className="space-y-2">
                  <p className="font-medium">Key Considerations:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><span className="font-medium">Maximum PSI Limits</span> - Each aircraft has specific floor loading limits that must not be exceeded</li>
                    <li><span className="font-medium">Weight Distribution</span> - Spreading weight over a larger area reduces PSI</li>
                    <li><span className="font-medium">Contact Area</span> - Only the surface area in contact with the floor is considered in PSI calculations</li>
                  </ul>
                </div>
                
                <p>
                  Exceeding PSI limits can damage the aircraft floor structure and compromise flight safety. 
                  Always verify that your cargo PSI is within acceptable limits for the specific aircraft being loaded.
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 text-xs text-muted-foreground">
              <p>
                Ensure to check specific aircraft loading manuals for maximum allowable PSI values. 
                Different areas of the aircraft floor may have different PSI limitations.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}