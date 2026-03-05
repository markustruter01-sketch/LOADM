import { useState } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Anchor, AlertTriangle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

export default function RestraintCalculatorPage() {
  const [_, navigate] = useLocation();
  
  // Input states
  const [cargoWeight, setCargoWeight] = useState<string>("");
  const [totalForce, setTotalForce] = useState<string>("");
  const [horizontalAngle, setHorizontalAngle] = useState<string>("");
  const [verticalAngle, setVerticalAngle] = useState<string>("");
  
  // Result states
  const [effectiveForce, setEffectiveForce] = useState<number | null>(null);
  const [forwardAftComponent, setForwardAftComponent] = useState<number | null>(null);
  const [lateralComponent, setLateralComponent] = useState<number | null>(null);
  const [verticalComponent, setVerticalComponent] = useState<number | null>(null);
  const [gForceRatio, setGForceRatio] = useState<number | null>(null);

  const handleBackClick = () => {
    navigate("/tools");
  };

  // Standard G-force requirements
  const gForceRequirements = {
    forward: 3.0,
    aft: 1.5,
    lateral: 1.5,
    vertical: 2.0
  };

  // Calculate restraint forces
  const calculateRestraints = () => {
    const force = parseFloat(totalForce);
    const hAngle = parseFloat(horizontalAngle);
    const vAngle = parseFloat(verticalAngle);
    const weight = parseFloat(cargoWeight);
    
    if (!isNaN(force) && !isNaN(hAngle) && !isNaN(vAngle)) {
      // Convert angles to radians
      const hRadians = (hAngle * Math.PI) / 180;
      const vRadians = (vAngle * Math.PI) / 180;
      
      // Calculate effective force (total force at angle)
      const effective = force * Math.cos(hRadians);
      setEffectiveForce(effective);
      
      // Calculate component forces
      const forwardAft = force * Math.cos(hRadians);
      const lateral = force * Math.sin(hRadians);
      const vertical = force * Math.sin(vRadians);
      
      setForwardAftComponent(forwardAft);
      setLateralComponent(lateral);
      setVerticalComponent(vertical);
      
      // Calculate G-force ratio if weight is provided
      if (!isNaN(weight) && weight > 0) {
        const gRatio = effective / weight;
        setGForceRatio(gRatio);
      } else {
        setGForceRatio(null);
      }
    }
  };

  // Reset all fields
  const resetFields = () => {
    setCargoWeight("");
    setTotalForce("");
    setHorizontalAngle("");
    setVerticalAngle("");
    setEffectiveForce(null);
    setForwardAftComponent(null);
    setLateralComponent(null);
    setVerticalComponent(null);
    setGForceRatio(null);
  };

  // Check if restraint meets requirements
  const checkRequirements = (component: number | null, requirement: number, weight: number) => {
    if (component === null || isNaN(weight) || weight <= 0) return null;
    const gForce = component / weight;
    return gForce >= requirement;
  };

  const weight = parseFloat(cargoWeight);

  return (
    <>
      <Helmet>
        <title>Restraint Calculator - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Calculate effective restraint forces and component forces for cargo restraint systems." 
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
              <Anchor className="h-6 w-6 mr-3 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">
                Restraint Calculator
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Calculate effective restraint forces and verify G-force requirements for cargo restraint systems
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle>Restraint Parameters</CardTitle>
                <CardDescription>
                  Enter the restraint configuration and cargo details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cargo-weight">Cargo Weight (lbs)</Label>
                  <Input
                    id="cargo-weight"
                    type="number"
                    placeholder="Enter cargo weight"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total-force">Total Restraint Force (lbs)</Label>
                  <Input
                    id="total-force"
                    type="number"
                    placeholder="Enter total force applied"
                    value={totalForce}
                    onChange={(e) => setTotalForce(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horizontal-angle">Horizontal Angle (degrees)</Label>
                  <Input
                    id="horizontal-angle"
                    type="number"
                    placeholder="0-90 degrees from forward direction"
                    value={horizontalAngle}
                    onChange={(e) => setHorizontalAngle(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    0° = straight forward, 90° = straight lateral
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vertical-angle">Vertical Angle (degrees)</Label>
                  <Input
                    id="vertical-angle"
                    type="number"
                    placeholder="0-90 degrees from horizontal"
                    value={verticalAngle}
                    onChange={(e) => setVerticalAngle(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    0° = horizontal, 90° = straight up
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={calculateRestraints} className="flex-1">
                    Calculate Forces
                  </Button>
                  <Button onClick={resetFields} variant="outline">
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card>
              <CardHeader>
                <CardTitle>Calculation Results</CardTitle>
                <CardDescription>
                  Effective forces and G-force analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {effectiveForce !== null ? (
                  <>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Effective Restraint Force</h4>
                        <p className="text-2xl font-bold text-primary">
                          {effectiveForce.toFixed(1)} lbs
                        </p>
                        {gForceRatio !== null && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {gForceRatio.toFixed(2)}G restraint capacity
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium">Component Forces</h4>
                        
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex justify-between items-center p-3 bg-muted rounded">
                            <span className="text-sm font-medium">Forward/Aft:</span>
                            <div className="text-right">
                              <span className="font-mono">{forwardAftComponent?.toFixed(1)} lbs</span>
                              {!isNaN(weight) && weight > 0 && forwardAftComponent && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant={checkRequirements(forwardAftComponent, gForceRequirements.forward, weight) ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {(forwardAftComponent / weight).toFixed(2)}G
                                  </Badge>
                                  {!checkRequirements(forwardAftComponent, gForceRequirements.forward, weight) && (
                                    <AlertTriangle className="h-3 w-3 text-destructive" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-muted rounded">
                            <span className="text-sm font-medium">Lateral:</span>
                            <div className="text-right">
                              <span className="font-mono">{lateralComponent?.toFixed(1)} lbs</span>
                              {!isNaN(weight) && weight > 0 && lateralComponent && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant={checkRequirements(lateralComponent, gForceRequirements.lateral, weight) ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {(lateralComponent / weight).toFixed(2)}G
                                  </Badge>
                                  {!checkRequirements(lateralComponent, gForceRequirements.lateral, weight) && (
                                    <AlertTriangle className="h-3 w-3 text-destructive" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-muted rounded">
                            <span className="text-sm font-medium">Vertical:</span>
                            <div className="text-right">
                              <span className="font-mono">{verticalComponent?.toFixed(1)} lbs</span>
                              {!isNaN(weight) && weight > 0 && verticalComponent && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant={checkRequirements(verticalComponent, gForceRequirements.vertical, weight) ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {(verticalComponent / weight).toFixed(2)}G
                                  </Badge>
                                  {!checkRequirements(verticalComponent, gForceRequirements.vertical, weight) && (
                                    <AlertTriangle className="h-3 w-3 text-destructive" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Anchor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter restraint parameters to calculate forces</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* G-Force Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Standard G-Force Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Forward Restraint:</span>
                    <Badge variant="outline">{gForceRequirements.forward}G</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Aft Restraint:</span>
                    <Badge variant="outline">{gForceRequirements.aft}G</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Lateral Restraint:</span>
                    <Badge variant="outline">{gForceRequirements.lateral}G</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Vertical Restraint:</span>
                    <Badge variant="outline">{gForceRequirements.vertical}G</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calculation Formulas */}
            <Card>
              <CardHeader>
                <CardTitle>Calculation Formulas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm font-mono">
                  <div className="p-3 bg-muted rounded">
                    <div className="font-medium text-primary mb-2">Effective Force:</div>
                    <div>Force × cos(horizontal_angle)</div>
                    <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                      <span className="text-primary/70">e.g.</span> 5,000 lbs × cos(30°) = <span className="text-primary">4,330 lbs</span>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <div className="font-medium text-primary mb-2">Component Forces:</div>
                    <div>Forward/Aft = Force × cos(θh)</div>
                    <div>Lateral = Force × sin(θh)</div>
                    <div>Vertical = Force × sin(θv)</div>
                    <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground space-y-0.5">
                      <div><span className="text-primary/70">e.g.</span> Forward: 5,000 × cos(30°) = <span className="text-primary">4,330 lbs</span></div>
                      <div><span className="text-primary/70">e.g.</span> Lateral: 5,000 × sin(30°) = <span className="text-primary">2,500 lbs</span></div>
                      <div><span className="text-primary/70">e.g.</span> Vertical: 5,000 × sin(15°) = <span className="text-primary">1,294 lbs</span></div>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <div className="font-medium text-primary mb-2">G-Force:</div>
                    <div>G = Component_Force / Cargo_Weight</div>
                    <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                      <span className="text-primary/70">e.g.</span> 4,330 lbs ÷ 10,000 lbs = <span className="text-primary">0.43G</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}