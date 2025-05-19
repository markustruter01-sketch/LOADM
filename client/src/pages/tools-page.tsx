import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator, Scale, BarChart2, TrendingUp, Truck } from "lucide-react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ToolsPage() {
  const [_, navigate] = useLocation();

  const handleBackClick = () => {
    navigate("/");
  };

  // Function to navigate to specific tool pages
  const navigateToTool = (toolPath: string) => {
    navigate(`/tools/${toolPath}`);
  };

  return (
    <>
      <Helmet>
        <title>Loadmaster Tools - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Loadmaster tools and utilities for aircraft cargo operations and calculations." 
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
            Back to Home
          </Button>
          
          {/* Header Section */}
          <section className="mb-10">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Loadmaster Tools
            </h2>
            <p className="text-muted-foreground mb-6">
              Essential calculation tools and utilities for loadmaster operations
            </p>
          </section>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* WAM Calculator */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigateToTool('wam-calculator')}
            >
              <CardHeader className="bg-primary/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">WAM Calculator</CardTitle>
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <CardDescription>Weight-Arm-Moment calculations</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-primary">Formulas:</div>
                  <div className="p-3 bg-slate-800 rounded-md">
                    <p className="mb-2">Arm × Weight = Moment</p>
                    <p className="mb-2">Moment ÷ Arm = Weight</p>
                    <p>Moment ÷ Weight = Arm</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 pt-2">
                <Button variant="ghost" className="w-full">
                  Open Calculator
                </Button>
              </CardFooter>
            </Card>

            {/* Vehicle CGFA Calculator */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigateToTool('vehicle-cgfa')}
            >
              <CardHeader className="bg-primary/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Vehicle CGFA Calculator</CardTitle>
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <CardDescription>Center of Gravity Forward of Aft Axle</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-primary">Formula:</div>
                  <div className="p-3 bg-slate-800 rounded-md">
                    <p>RAW × WB ÷ GW = CGFA in Inches</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      RAW: Rear Axle Weight<br />
                      WB: Wheelbase<br />
                      GW: Gross Weight
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 pt-2">
                <Button variant="ghost" className="w-full">
                  Open Calculator
                </Button>
              </CardFooter>
            </Card>

            {/* Balance Arm Calculator */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer opacity-75"
              onClick={() => navigateToTool('balance-arm')}
            >
              <CardHeader className="bg-primary/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Balance Arm Calculator</CardTitle>
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <CardDescription>Aircraft Balance & Load Distribution</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-sm">
                  <p>Calculate the balance arm for specific aircraft types and configurations.</p>
                  <div className="mt-4 text-xs text-muted-foreground">
                    • AC-130 Balance Arm<br />
                    • C-17 Balance Arm<br />
                    • KC30A Balance Arm
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 pt-2">
                <Button variant="ghost" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>

            {/* Fuel Calculations */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer opacity-75"
              onClick={() => navigateToTool('fuel-calculator')}
            >
              <CardHeader className="bg-primary/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Fuel Calculations</CardTitle>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <CardDescription>Fuel Weight & CG Impact</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-sm">
                  <p>Calculate fuel weight, distribution and center of gravity impacts.</p>
                  <div className="mt-4 text-xs text-muted-foreground">
                    • Fuel Density Conversion<br />
                    • CG Shift Calculation<br />
                    • Fuel Burn Impact
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 pt-2">
                <Button variant="ghost" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}