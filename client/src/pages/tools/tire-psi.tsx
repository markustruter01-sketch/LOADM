import { useState } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Circle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function TirePsiCalculatorPage() {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("single-tire");
  
  // Input states for single tire
  const [weight, setWeight] = useState<string>("");
  const [contactWidth, setContactWidth] = useState<string>("");
  const [contactLength, setContactLength] = useState<string>("");
  
  // Input states for multiple tires
  const [totalWeight, setTotalWeight] = useState<string>("");
  const [tireCount, setTireCount] = useState<string>("");
  const [singleTireWidth, setSingleTireWidth] = useState<string>("");
  const [singleTireLength, setSingleTireLength] = useState<string>("");
  
  // Result states
  const [singleTirePsi, setSingleTirePsi] = useState<number | null>(null);
  const [multiTirePsi, setMultiTirePsi] = useState<number | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleBackClick = () => {
    navigate("/tools");
  };

  // Calculate PSI for a single tire
  const calculateSingleTirePsi = () => {
    setHasError(false);
    setErrorMessage("");
    
    const weightValue = parseFloat(weight);
    const widthValue = parseFloat(contactWidth);
    const lengthValue = parseFloat(contactLength);
    
    if (isNaN(weightValue) || isNaN(widthValue) || isNaN(lengthValue)) {
      setHasError(true);
      setErrorMessage("Please enter valid numbers for all fields");
      setSingleTirePsi(null);
      return;
    }
    
    if (weightValue <= 0 || widthValue <= 0 || lengthValue <= 0) {
      setHasError(true);
      setErrorMessage("All values must be greater than zero");
      setSingleTirePsi(null);
      return;
    }
    
    // Calculate contact area and PSI
    const contactArea = widthValue * lengthValue;
    const result = weightValue / contactArea;
    setSingleTirePsi(result);
  };

  // Calculate PSI for multiple tires
  const calculateMultipleTirePsi = () => {
    setHasError(false);
    setErrorMessage("");
    
    const totalWeightValue = parseFloat(totalWeight);
    const tireCountValue = parseInt(tireCount);
    const widthValue = parseFloat(singleTireWidth);
    const lengthValue = parseFloat(singleTireLength);
    
    if (isNaN(totalWeightValue) || isNaN(tireCountValue) || isNaN(widthValue) || isNaN(lengthValue)) {
      setHasError(true);
      setErrorMessage("Please enter valid numbers for all fields");
      setMultiTirePsi(null);
      return;
    }
    
    if (totalWeightValue <= 0 || tireCountValue <= 0 || widthValue <= 0 || lengthValue <= 0) {
      setHasError(true);
      setErrorMessage("All values must be greater than zero");
      setMultiTirePsi(null);
      return;
    }
    
    // Calculate contact area per tire and total PSI
    const singleTireContactArea = widthValue * lengthValue;
    const totalContactArea = singleTireContactArea * tireCountValue;
    const weightPerTire = totalWeightValue / tireCountValue;
    const result = weightPerTire / singleTireContactArea;
    
    setMultiTirePsi(result);
  };

  // Reset all fields
  const resetFields = () => {
    if (activeTab === "single-tire") {
      setWeight("");
      setContactWidth("");
      setContactLength("");
      setSingleTirePsi(null);
    } else {
      setTotalWeight("");
      setTireCount("");
      setSingleTireWidth("");
      setSingleTireLength("");
      setMultiTirePsi(null);
    }
    
    setHasError(false);
    setErrorMessage("");
  };

  return (
    <>
      <Helmet>
        <title>Pneumatic Tire PSI Calculator - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Calculate Pounds per Square Inch (PSI) for pneumatic tires in aircraft cargo operations." 
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
              <Circle className="h-6 w-6 mr-3 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">
                Pneumatic Tire PSI Calculator
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Calculate Pounds per Square Inch (PSI) for vehicle tires and wheeled equipment
            </p>
          </section>

          {/* Calculator Card */}
          <Card className="mb-8">
            <CardHeader className="bg-primary/10">
              <CardTitle>Tire PSI Calculator</CardTitle>
              <CardDescription>
                Calculate floor loading pressure for pneumatic tires
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="single-tire">Single Tire</TabsTrigger>
                  <TabsTrigger value="multiple-tires">Multiple Tires</TabsTrigger>
                </TabsList>

                {/* Single Tire Tab */}
                <TabsContent value="single-tire" className="mt-6 space-y-6">
                  <div className="p-3 bg-slate-800 rounded-md text-center">
                    <p className="font-medium">Weight ÷ (Contact Width × Contact Length) = PSI</p>
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40">
                      <span className="text-primary/70">e.g.</span> 3,000 lbs ÷ (8 in × 10 in) = <span className="text-primary font-semibold">37.5 PSI</span>
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="weight">
                        Weight on Tire (lbs)
                      </Label>
                      <Input 
                        id="weight" 
                        type="number" 
                        step="1" 
                        placeholder="Enter weight on single tire" 
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        The weight supported by this single tire
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact-width">
                        Contact Width (inches)
                      </Label>
                      <Input 
                        id="contact-width" 
                        type="number" 
                        step="0.1" 
                        placeholder="Enter tire contact width" 
                        value={contactWidth}
                        onChange={(e) => setContactWidth(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        The width of the tire's contact patch with the ground
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact-length">
                        Contact Length (inches)
                      </Label>
                      <Input 
                        id="contact-length" 
                        type="number" 
                        step="0.1" 
                        placeholder="Enter tire contact length" 
                        value={contactLength}
                        onChange={(e) => setContactLength(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        The length of the tire's contact patch with the ground
                      </p>
                    </div>
                  </div>
                  
                  {hasError && activeTab === "single-tire" && (
                    <Alert variant="destructive" className="text-sm">
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="outline" onClick={resetFields}>
                      Reset
                    </Button>
                    <Button onClick={calculateSingleTirePsi}>
                      Calculate
                    </Button>
                  </div>
                  
                  {singleTirePsi !== null && (
                    <div className="mt-6 p-4 bg-muted rounded-md">
                      <div className="font-medium mb-2">Result:</div>
                      <div className="text-2xl font-bold text-primary">
                        {singleTirePsi.toFixed(2)} PSI
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Pounds per Square Inch on the contact surface
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Multiple Tires Tab */}
                <TabsContent value="multiple-tires" className="mt-6 space-y-6">
                  <div className="p-3 bg-slate-800 rounded-md text-center">
                    <p className="font-medium">(Total Weight ÷ # of Tires) ÷ (Contact Width × Contact Length) = PSI per Tire</p>
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40">
                      <span className="text-primary/70">e.g.</span> (12,000 lbs ÷ 4 tires) ÷ (8 in × 10 in) = <span className="text-primary font-semibold">37.5 PSI per tire</span>
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="total-weight">
                        Total Vehicle/Equipment Weight (lbs)
                      </Label>
                      <Input 
                        id="total-weight" 
                        type="number" 
                        step="1" 
                        placeholder="Enter total weight" 
                        value={totalWeight}
                        onChange={(e) => setTotalWeight(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        The total weight of the vehicle or equipment
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tire-count">
                        Number of Tires
                      </Label>
                      <Input 
                        id="tire-count" 
                        type="number" 
                        step="1" 
                        placeholder="Enter number of tires" 
                        value={tireCount}
                        onChange={(e) => setTireCount(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        The total number of tires supporting the weight
                      </p>
                    </div>
                    
                    <Separator />
                    <p className="text-sm font-medium">Per Tire Contact Area</p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="single-tire-width">
                        Contact Width per Tire (inches)
                      </Label>
                      <Input 
                        id="single-tire-width" 
                        type="number" 
                        step="0.1" 
                        placeholder="Enter tire contact width" 
                        value={singleTireWidth}
                        onChange={(e) => setSingleTireWidth(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        The width of each tire's contact patch with the ground
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="single-tire-length">
                        Contact Length per Tire (inches)
                      </Label>
                      <Input 
                        id="single-tire-length" 
                        type="number" 
                        step="0.1" 
                        placeholder="Enter tire contact length" 
                        value={singleTireLength}
                        onChange={(e) => setSingleTireLength(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        The length of each tire's contact patch with the ground
                      </p>
                    </div>
                  </div>
                  
                  {hasError && activeTab === "multiple-tires" && (
                    <Alert variant="destructive" className="text-sm">
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="outline" onClick={resetFields}>
                      Reset
                    </Button>
                    <Button onClick={calculateMultipleTirePsi}>
                      Calculate
                    </Button>
                  </div>
                  
                  {multiTirePsi !== null && (
                    <div className="mt-6 p-4 bg-muted rounded-md">
                      <div className="font-medium mb-2">Result:</div>
                      <div className="text-2xl font-bold text-primary">
                        {multiTirePsi.toFixed(2)} PSI per tire
                      </div>
                      <p className="text-sm mt-2">
                        Weight per tire: {parseFloat(totalWeight) / parseInt(tireCount)} lbs
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pounds per Square Inch on each tire's contact surface
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>About Pneumatic Tire PSI Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>
                  Pneumatic tire PSI calculations are vital for loading wheeled vehicles and equipment onto aircraft.
                  The floor loading pressure is a key factor in ensuring safe cargo operations.
                </p>
                
                <div className="space-y-2">
                  <p className="font-medium">Key Information:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><span className="font-medium">Contact Patch</span> - The area where the tire meets the ground, which may be smaller than the tire dimensions</li>
                    <li><span className="font-medium">Weight Distribution</span> - Vehicle weight is usually not evenly distributed across all tires</li>
                    <li><span className="font-medium">Tire Inflation</span> - Properly inflated tires distribute weight as designed</li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 p-3 rounded-md">
                  <p className="font-medium mb-1">Important Note:</p>
                  <p>
                    For uneven weight distribution (e.g., more weight on rear axle), calculate PSI separately for each axle.
                    Use weight per tire rather than assuming equal distribution for accurate results.
                  </p>
                </div>
                
                <p>
                  For accurate contact patch measurements, vehicle manufacturers may provide specific data.
                  Alternatively, you can measure the contact patch by:
                </p>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Placing paper under the tire on a hard, level surface</li>
                  <li>Moving the vehicle slightly to mark the contact area</li>
                  <li>Measuring the length and width of the marked area</li>
                </ol>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 text-xs text-muted-foreground">
              <p>
                The calculated PSI must be compared against the aircraft's floor loading limits
                to ensure safe loading operations. Always verify your calculations with appropriate
                technical documentation for the specific aircraft type.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}