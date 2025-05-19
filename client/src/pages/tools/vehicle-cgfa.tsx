import { useState } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function VehicleCgfaPage() {
  const [_, navigate] = useLocation();
  
  // Input states
  const [rearAxleWeight, setRearAxleWeight] = useState<string>("");
  const [wheelbase, setWheelbase] = useState<string>("");
  const [grossWeight, setGrossWeight] = useState<string>("");
  
  // Result state
  const [cgfaResult, setCgfaResult] = useState<number | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleBackClick = () => {
    navigate("/tools");
  };

  // Calculate CGFA
  const calculateCgfa = () => {
    setHasError(false);
    setErrorMessage("");
    
    const rawValue = parseFloat(rearAxleWeight);
    const wbValue = parseFloat(wheelbase);
    const gwValue = parseFloat(grossWeight);
    
    if (isNaN(rawValue) || isNaN(wbValue) || isNaN(gwValue)) {
      setHasError(true);
      setErrorMessage("Please enter valid numbers for all fields");
      setCgfaResult(null);
      return;
    }
    
    if (gwValue === 0) {
      setHasError(true);
      setErrorMessage("Gross Weight cannot be zero");
      setCgfaResult(null);
      return;
    }
    
    if (rawValue > gwValue) {
      setHasError(true);
      setErrorMessage("Rear Axle Weight cannot be greater than Gross Weight");
      setCgfaResult(null);
      return;
    }
    
    const result = (rawValue * wbValue) / gwValue;
    setCgfaResult(result);
  };

  // Reset all fields
  const resetFields = () => {
    setRearAxleWeight("");
    setWheelbase("");
    setGrossWeight("");
    setCgfaResult(null);
    setHasError(false);
    setErrorMessage("");
  };

  return (
    <>
      <Helmet>
        <title>Vehicle CGFA Calculator - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Calculate Center of Gravity Forward of Aft Axle (CGFA) for vehicle loading on aircraft." 
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
              <Truck className="h-6 w-6 mr-3 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">
                Vehicle CGFA Calculator
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Calculate Center of Gravity Forward of Aft Axle for vehicle loading operations
            </p>
          </section>

          {/* Calculator Card */}
          <Card className="mb-8">
            <CardHeader className="bg-primary/10">
              <CardTitle>CGFA Calculator</CardTitle>
              <CardDescription>
                Calculate the Center of Gravity Forward of the Aft Axle in inches
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="p-3 bg-slate-800 rounded-md text-center">
                  <p className="font-medium">RAW × WB ÷ GW = CGFA in Inches</p>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="rear-axle-weight">
                      RAW - Rear Axle Weight (lbs)
                    </Label>
                    <Input 
                      id="rear-axle-weight" 
                      type="number" 
                      step="1" 
                      placeholder="Enter rear axle weight" 
                      value={rearAxleWeight}
                      onChange={(e) => setRearAxleWeight(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The weight supported by the rear axle of the vehicle
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="wheelbase">
                      WB - Wheelbase (inches)
                    </Label>
                    <Input 
                      id="wheelbase" 
                      type="number" 
                      step="0.1" 
                      placeholder="Enter wheelbase length" 
                      value={wheelbase}
                      onChange={(e) => setWheelbase(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The distance between the front and rear axles
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gross-weight">
                      GW - Gross Weight (lbs)
                    </Label>
                    <Input 
                      id="gross-weight" 
                      type="number" 
                      step="1" 
                      placeholder="Enter total vehicle weight" 
                      value={grossWeight}
                      onChange={(e) => setGrossWeight(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The total weight of the vehicle including cargo
                    </p>
                  </div>
                </div>
                
                {hasError && (
                  <div className="bg-destructive/20 text-destructive p-3 rounded-md text-sm">
                    {errorMessage}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={resetFields}>
                    Reset
                  </Button>
                  <Button onClick={calculateCgfa}>
                    Calculate
                  </Button>
                </div>
                
                {cgfaResult !== null && (
                  <div className="mt-6 p-4 bg-muted rounded-md">
                    <div className="font-medium mb-2">Result:</div>
                    <div className="text-2xl font-bold text-primary">
                      CGFA = {cgfaResult.toFixed(2)} inches
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Center of Gravity is {cgfaResult.toFixed(2)} inches forward of the aft (rear) axle
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>About Vehicle CGFA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>
                  The Center of Gravity Forward of Aft Axle (CGFA) calculation is crucial for determining a vehicle's balance
                  when loading onto aircraft. This measurement helps loadmasters ensure proper weight distribution and aircraft stability.
                </p>
                
                <Separator />
                
                <div className="space-y-2">
                  <p className="font-medium">Formula Components:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <span className="font-medium">RAW (Rear Axle Weight)</span> - Weight supported by the rear axle, measured in pounds
                    </li>
                    <li>
                      <span className="font-medium">WB (Wheelbase)</span> - Distance between the front and rear axles, measured in inches
                    </li>
                    <li>
                      <span className="font-medium">GW (Gross Weight)</span> - Total weight of the vehicle and cargo, measured in pounds
                    </li>
                    <li>
                      <span className="font-medium">CGFA</span> - Center of Gravity Forward of Aft axle, measured in inches
                    </li>
                  </ul>
                </div>
                
                <Separator />
                
                <div>
                  <p className="font-medium mb-2">Important Note:</p>
                  <Badge variant="outline" className="mb-2">Military Loading Operations</Badge>
                  <p>
                    This calculation is especially important for loading vehicles onto military aircraft like the C-17, C-130, and KC-30A,
                    where precise weight distribution is critical for flight safety and performance.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 text-xs text-muted-foreground">
              <p>
                Always verify calculations against your specific aircraft's loading manual and consult with qualified loadmasters
                for official loading operations.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}