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
  const [useMetric, setUseMetric] = useState(false);

  const [rearAxleWeight, setRearAxleWeight] = useState<string>("");
  const [wheelbase, setWheelbase] = useState<string>("");
  const [grossWeight, setGrossWeight] = useState<string>("");

  const [cgfaResult, setCgfaResult] = useState<number | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const wUnit = useMetric ? "kg" : "lbs";
  const dUnit = useMetric ? "cm" : "in";

  const handleBackClick = () => navigate("/tools");

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
      setErrorMessage(
        "Rear Axle Weight cannot be greater than Gross Weight"
      );
      setCgfaResult(null);
      return;
    }

    const result = (rawValue * wbValue) / gwValue;
    setCgfaResult(result);
  };

  const resetFields = () => {
    setRearAxleWeight("");
    setWheelbase("");
    setGrossWeight("");
    setCgfaResult(null);
    setHasError(false);
    setErrorMessage("");
  };

  const handleUnitSwitch = (metric: boolean) => {
    setUseMetric(metric);
    resetFields();
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
          <Button
            variant="ghost"
            size="sm"
            className="mb-6"
            onClick={handleBackClick}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tools
          </Button>

          <section className="mb-10">
            <div className="flex items-center mb-4">
              <Truck className="h-6 w-6 mr-3 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">
                Vehicle CGFA Calculator
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Calculate Center of Gravity Forward of Aft Axle for vehicle
              loading operations
            </p>
          </section>

          <Card className="mb-8">
            <CardHeader className="bg-primary/10">
              <CardTitle>CGFA Calculator</CardTitle>
              <CardDescription>
                Calculate the Center of Gravity Forward of the Aft Axle in{" "}
                {dUnit}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-center mb-6">
                <div className="inline-flex rounded-lg bg-[#1a1a1a] border border-[#333] p-1 gap-1">
                  <button
                    onClick={() => handleUnitSwitch(false)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      !useMetric
                        ? "bg-orange-500 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    lbs / in
                  </button>
                  <button
                    onClick={() => handleUnitSwitch(true)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      useMetric
                        ? "bg-orange-500 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    kg / cm
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-3 bg-slate-800 rounded-md text-center">
                  <p className="font-medium">
                    RAW × WB ÷ GW = CGFA in {dUnit}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40">
                    <span className="text-primary/70">e.g.</span>{" "}
                    {useMetric
                      ? "2,948 kg × 305 cm ÷ 6,804 kg = "
                      : "6,500 lbs × 120 in ÷ 15,000 lbs = "}
                    <span className="text-primary font-semibold">
                      {useMetric ? "132.2 cm" : "52.0 in"}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="rear-axle-weight">
                      RAW – Rear Axle Weight ({wUnit})
                    </Label>
                    <Input
                      id="rear-axle-weight"
                      type="number"
                      step="1"
                      placeholder={`Enter rear axle weight in ${wUnit}`}
                      value={rearAxleWeight}
                      onChange={(e) => setRearAxleWeight(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The weight supported by the rear axle of the vehicle
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wheelbase">
                      WB – Wheelbase ({dUnit})
                    </Label>
                    <Input
                      id="wheelbase"
                      type="number"
                      step="0.1"
                      placeholder={`Enter wheelbase in ${dUnit}`}
                      value={wheelbase}
                      onChange={(e) => setWheelbase(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The distance between the front and rear axles
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gross-weight">
                      GW – Gross Weight ({wUnit})
                    </Label>
                    <Input
                      id="gross-weight"
                      type="number"
                      step="1"
                      placeholder={`Enter total vehicle weight in ${wUnit}`}
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
                  <Button onClick={calculateCgfa}>Calculate</Button>
                </div>

                {cgfaResult !== null && (
                  <div className="mt-6 p-4 bg-muted rounded-md">
                    <div className="font-medium mb-2">Result:</div>
                    <div className="text-2xl font-bold text-primary">
                      CGFA = {cgfaResult.toFixed(2)} {dUnit}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Center of Gravity is {cgfaResult.toFixed(2)} {dUnit}{" "}
                      forward of the aft (rear) axle
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About Vehicle CGFA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>
                  The Center of Gravity Forward of Aft Axle (CGFA) calculation
                  is crucial for determining a vehicle's balance when loading onto
                  aircraft. This measurement helps loadmasters ensure proper
                  weight distribution and aircraft stability.
                </p>

                <Separator />

                <div className="space-y-2">
                  <p className="font-medium">Formula Components:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <span className="font-medium">RAW (Rear Axle Weight)</span>{" "}
                      – Weight supported by the rear axle, measured in {wUnit}
                    </li>
                    <li>
                      <span className="font-medium">WB (Wheelbase)</span> –
                      Distance between the front and rear axles, measured in{" "}
                      {dUnit}
                    </li>
                    <li>
                      <span className="font-medium">GW (Gross Weight)</span> –
                      Total weight of the vehicle and cargo, measured in {wUnit}
                    </li>
                    <li>
                      <span className="font-medium">CGFA</span> – Center of
                      Gravity Forward of Aft axle, measured in {dUnit}
                    </li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <p className="font-medium mb-2">Important Note:</p>
                  <Badge variant="outline" className="mb-2">
                    Military Loading Operations
                  </Badge>
                  <p>
                    This calculation is especially important for loading vehicles
                    onto military aircraft like the C-17, C-130, and KC-30A,
                    where precise weight distribution is critical for flight
                    safety and performance.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 text-xs text-muted-foreground">
              <p>
                Always verify calculations against your specific aircraft's
                loading manual and consult with qualified loadmasters for
                official loading operations.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
