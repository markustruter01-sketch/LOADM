import { useState } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
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

export default function SkiddedBoxPsiCalculatorPage() {
  const [_, navigate] = useLocation();
  
  // Input states
  const [grossWeight, setGrossWeight] = useState<string>("");
  const [skidLength, setSkidLength] = useState<string>("");
  const [skidWidth, setSkidWidth] = useState<string>("");
  const [skidCount, setSkidCount] = useState<string>("");
  
  // Result state
  const [psiResult, setPsiResult] = useState<number | null>(null);
  const [contactArea, setContactArea] = useState<number | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleBackClick = () => {
    navigate("/tools");
  };

  // Calculate PSI for skidded boxes
  const calculatePsi = () => {
    setHasError(false);
    setErrorMessage("");
    
    // Parse input values
    const gwValue = parseFloat(grossWeight);
    const lengthValue = parseFloat(skidLength);
    const widthValue = parseFloat(skidWidth);
    const countValue = parseInt(skidCount);
    
    // Validate inputs
    if (isNaN(gwValue) || isNaN(lengthValue) || isNaN(widthValue) || isNaN(countValue)) {
      setHasError(true);
      setErrorMessage("Please enter valid numbers for all fields");
      setPsiResult(null);
      setContactArea(null);
      return;
    }
    
    if (gwValue <= 0 || lengthValue <= 0 || widthValue <= 0 || countValue <= 0) {
      setHasError(true);
      setErrorMessage("All values must be greater than zero");
      setPsiResult(null);
      setContactArea(null);
      return;
    }
    
    // Calculate the total contact area
    const singleSkidArea = lengthValue * widthValue;
    const totalContactArea = singleSkidArea * countValue;
    
    // Calculate PSI
    const result = gwValue / totalContactArea;
    setPsiResult(result);
    setContactArea(totalContactArea);
  };

  // Reset all fields
  const resetFields = () => {
    setGrossWeight("");
    setSkidLength("");
    setSkidWidth("");
    setSkidCount("");
    setPsiResult(null);
    setContactArea(null);
    setHasError(false);
    setErrorMessage("");
  };

  return (
    <>
      <Helmet>
        <title>Skidded Box PSI Calculator - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Calculate Pounds per Square Inch (PSI) for skidded boxes in aircraft cargo operations." 
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
              <Package className="h-6 w-6 mr-3 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">
                Skidded Box PSI Calculator
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Calculate Pounds per Square Inch (PSI) for boxes mounted on skids or runners
            </p>
          </section>

          {/* Calculator Card */}
          <Card className="mb-8">
            <CardHeader className="bg-primary/10">
              <CardTitle>Skidded Box PSI Calculator</CardTitle>
              <CardDescription>
                Calculate PSI by dividing gross weight by the total contact area of all skids
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="p-3 bg-slate-800 rounded-md text-center">
                  <p className="font-medium">GW ÷ (L of skid × W of skid × # of skids) = PSI</p>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="gross-weight">
                      GW - Gross Weight (lbs)
                    </Label>
                    <Input 
                      id="gross-weight" 
                      type="number" 
                      step="1" 
                      placeholder="Enter gross weight" 
                      value={grossWeight}
                      onChange={(e) => setGrossWeight(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The total weight of the cargo including the skids
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="skid-length">
                      L - Skid Length (inches)
                    </Label>
                    <Input 
                      id="skid-length" 
                      type="number" 
                      step="0.1" 
                      placeholder="Enter skid length" 
                      value={skidLength}
                      onChange={(e) => setSkidLength(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The length of each skid's contact surface
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="skid-width">
                      W - Skid Width (inches)
                    </Label>
                    <Input 
                      id="skid-width" 
                      type="number" 
                      step="0.1" 
                      placeholder="Enter skid width" 
                      value={skidWidth}
                      onChange={(e) => setSkidWidth(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The width of each skid's contact surface
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="skid-count">
                      # - Number of Skids
                    </Label>
                    <Input 
                      id="skid-count" 
                      type="number" 
                      step="1" 
                      placeholder="Enter number of skids" 
                      value={skidCount}
                      onChange={(e) => setSkidCount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The total number of skids supporting the cargo
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
                    {contactArea !== null && (
                      <p className="text-sm mt-2">
                        Total Contact Area: {contactArea.toFixed(2)} square inches
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
              <CardTitle>About Skidded Box PSI Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>
                  Skidded boxes or crates are frequently used in military and commercial cargo operations. 
                  The skids (also called runners or cleats) are what make contact with the floor, so PSI 
                  calculation must account for their dimensions instead of the entire box.
                </p>
                
                <div className="space-y-2">
                  <p className="font-medium">Why This Matters:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><span className="font-medium">Concentrated Weight</span> - Skids concentrate the cargo weight onto smaller contact areas</li>
                    <li><span className="font-medium">Higher PSI</span> - Skidded cargo typically has higher PSI than flat-bottom cargo of the same weight</li>
                    <li><span className="font-medium">Aircraft Limits</span> - Each aircraft has maximum PSI limitations that must be observed</li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 p-3 rounded-md">
                  <p className="font-medium mb-1">Common Skid Configurations:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Two parallel skids (most common)</li>
                    <li>Four corner skids</li>
                    <li>Perimeter skid frame</li>
                    <li>Multi-point skid arrays for heavy cargo</li>
                  </ul>
                </div>
                
                <p>
                  When loading skidded cargo, always verify that the calculated PSI is within the 
                  aircraft's maximum allowable limits. If PSI exceeds limits, consider options such as 
                  adding additional skids to increase the contact area, or using shoring material to 
                  distribute the load more effectively.
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 text-xs text-muted-foreground">
              <p>
                Always verify skid dimensions and weight distribution before loading operations.
                Different areas of the aircraft floor may have different PSI limitations.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}