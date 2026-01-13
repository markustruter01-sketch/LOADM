import { useState } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator } from "lucide-react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function WAMCalculatorPage() {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("find-moment");
  
  // States for the three different calculations
  const [arm, setArm] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [moment, setMoment] = useState<string>("");
  
  // Results
  const [momentResult, setMomentResult] = useState<number | null>(null);
  const [weightResult, setWeightResult] = useState<number | null>(null);
  const [armResult, setArmResult] = useState<number | null>(null);

  const handleBackClick = () => {
    navigate("/tools");
  };

  // Calculate moment
  const calculateMoment = () => {
    const armValue = parseFloat(arm);
    const weightValue = parseFloat(weight);
    
    if (!isNaN(armValue) && !isNaN(weightValue)) {
      const result = armValue * weightValue;
      setMomentResult(result);
    } else {
      setMomentResult(null);
    }
  };

  // Calculate weight
  const calculateWeight = () => {
    const momentValue = parseFloat(moment);
    const armValue = parseFloat(arm);
    
    if (!isNaN(momentValue) && !isNaN(armValue) && armValue !== 0) {
      const result = momentValue / armValue;
      setWeightResult(result);
    } else {
      setWeightResult(null);
    }
  };

  // Calculate arm
  const calculateArm = () => {
    const momentValue = parseFloat(moment);
    const weightValue = parseFloat(weight);
    
    if (!isNaN(momentValue) && !isNaN(weightValue) && weightValue !== 0) {
      const result = momentValue / weightValue;
      setArmResult(result);
    } else {
      setArmResult(null);
    }
  };

  // Reset all fields
  const resetFields = () => {
    setArm("");
    setWeight("");
    setMoment("");
    setMomentResult(null);
    setWeightResult(null);
    setArmResult(null);
  };

  return (
    <>
      <Helmet>
        <title>WAM Calculator - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Weight-Arm-Moment calculator for loadmaster aircraft balance calculations." 
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
              <Calculator className="h-6 w-6 mr-3 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">
                WAM Calculator
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Calculate Weight, Arm, and Moment values for aircraft loading and balance
            </p>
          </section>

          {/* Calculator Card */}
          <Card className="mb-8">
            <CardHeader className="bg-primary/10">
              <CardTitle>Weight-Arm-Moment (WAM) Formulas</CardTitle>
              <CardDescription>
                Select a calculation type and enter the known values
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-[#1a1a1a] border border-[#444444] p-1 h-auto">
                  <TabsTrigger 
                    value="find-moment"
                    className="py-3 text-sm font-medium border border-transparent data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:border-orange-500 data-[state=inactive]:bg-[#2a2a2a] data-[state=inactive]:text-gray-300 data-[state=inactive]:border-[#444444] data-[state=inactive]:hover:bg-[#333333] data-[state=inactive]:hover:text-white transition-all"
                  >
                    Find Moment
                  </TabsTrigger>
                  <TabsTrigger 
                    value="find-weight"
                    className="py-3 text-sm font-medium border border-transparent data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:border-orange-500 data-[state=inactive]:bg-[#2a2a2a] data-[state=inactive]:text-gray-300 data-[state=inactive]:border-[#444444] data-[state=inactive]:hover:bg-[#333333] data-[state=inactive]:hover:text-white transition-all"
                  >
                    Find Weight
                  </TabsTrigger>
                  <TabsTrigger 
                    value="find-arm"
                    className="py-3 text-sm font-medium border border-transparent data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:border-orange-500 data-[state=inactive]:bg-[#2a2a2a] data-[state=inactive]:text-gray-300 data-[state=inactive]:border-[#444444] data-[state=inactive]:hover:bg-[#333333] data-[state=inactive]:hover:text-white transition-all"
                  >
                    Find Arm
                  </TabsTrigger>
                </TabsList>

                {/* Find Moment Tab */}
                <TabsContent value="find-moment" className="mt-6">
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-800 rounded-md mb-6">
                      <p className="text-center font-medium">Arm × Weight = Moment</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="arm1">Arm (inches)</Label>
                        <Input 
                          id="arm1" 
                          type="number" 
                          step="0.01" 
                          placeholder="Enter arm value" 
                          value={arm}
                          onChange={(e) => setArm(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="weight1">Weight (lbs/kg)</Label>
                        <Input 
                          id="weight1" 
                          type="number" 
                          step="0.01" 
                          placeholder="Enter weight value" 
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-6">
                      <Button variant="outline" onClick={resetFields}>
                        Reset
                      </Button>
                      <Button onClick={calculateMoment}>
                        Calculate
                      </Button>
                    </div>
                    
                    {momentResult !== null && (
                      <div className="mt-6 p-4 bg-muted rounded-md">
                        <div className="font-medium mb-2">Result:</div>
                        <div className="text-2xl font-bold text-primary">
                          Moment = {momentResult.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Find Weight Tab */}
                <TabsContent value="find-weight" className="mt-6">
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-800 rounded-md mb-6">
                      <p className="text-center font-medium">Moment ÷ Arm = Weight</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="moment2">Moment</Label>
                        <Input 
                          id="moment2" 
                          type="number" 
                          step="0.01" 
                          placeholder="Enter moment value" 
                          value={moment}
                          onChange={(e) => setMoment(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="arm2">Arm (inches)</Label>
                        <Input 
                          id="arm2" 
                          type="number" 
                          step="0.01" 
                          placeholder="Enter arm value" 
                          value={arm}
                          onChange={(e) => setArm(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-6">
                      <Button variant="outline" onClick={resetFields}>
                        Reset
                      </Button>
                      <Button onClick={calculateWeight}>
                        Calculate
                      </Button>
                    </div>
                    
                    {weightResult !== null && (
                      <div className="mt-6 p-4 bg-muted rounded-md">
                        <div className="font-medium mb-2">Result:</div>
                        <div className="text-2xl font-bold text-primary">
                          Weight = {weightResult.toFixed(2)} lbs/kg
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Find Arm Tab */}
                <TabsContent value="find-arm" className="mt-6">
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-800 rounded-md mb-6">
                      <p className="text-center font-medium">Moment ÷ Weight = Arm</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="moment3">Moment</Label>
                        <Input 
                          id="moment3" 
                          type="number" 
                          step="0.01" 
                          placeholder="Enter moment value" 
                          value={moment}
                          onChange={(e) => setMoment(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="weight3">Weight (lbs/kg)</Label>
                        <Input 
                          id="weight3" 
                          type="number" 
                          step="0.01" 
                          placeholder="Enter weight value" 
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-6">
                      <Button variant="outline" onClick={resetFields}>
                        Reset
                      </Button>
                      <Button onClick={calculateArm}>
                        Calculate
                      </Button>
                    </div>
                    
                    {armResult !== null && (
                      <div className="mt-6 p-4 bg-muted rounded-md">
                        <div className="font-medium mb-2">Result:</div>
                        <div className="text-2xl font-bold text-primary">
                          Arm = {armResult.toFixed(2)} inches
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>About WAM Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>
                  The Weight-Arm-Moment (WAM) formulas are fundamental calculations used in aircraft loading and balance.
                  These calculations help ensure proper weight distribution and maintain the center of gravity within acceptable limits.
                </p>
                
                <div className="space-y-2">
                  <p className="font-medium">Key Terms:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><span className="font-medium">Weight</span> - The mass of the item (measured in pounds or kilograms)</li>
                    <li><span className="font-medium">Arm</span> - The horizontal distance from the reference datum to the center of gravity of the item (measured in inches)</li>
                    <li><span className="font-medium">Moment</span> - The product of weight multiplied by arm, representing the item's tendency to rotate around the reference datum</li>
                  </ul>
                </div>
                
                <p>
                  These calculations are essential for loadmasters to ensure the aircraft remains within its center of gravity limits
                  throughout all phases of flight, which is critical for flight safety and performance.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}