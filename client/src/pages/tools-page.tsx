import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator, Scale, BarChart2, TrendingUp, Truck, Box, Cylinder, Package, Circle, Target, Anchor, CheckSquare } from "lucide-react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface MissionData {
  airframe: 'C-17' | 'C-130' | 'C-27J' | 'KC30A';
  cargoWeight: number;
  requiresTechPrep: boolean;
  palletCount: number;
  isInternational: boolean;
  hasLiveAnimals: boolean;
  hasDangerousGoods: boolean;
  loadmasterCount: 1 | 2;
  captainCategory: 'D' | 'C' | 'B' | 'A';
  hasLoadingTeam: boolean;
}

interface ComplexityResult {
  score: number;
  category: 'Beginner' | 'Intermediate' | 'Advanced';
  categoryLetter: 'D' | 'C' | 'B/A';
  color: string;
  icon: any;
  factors: Array<{ name: string; points: number; maxPoints: number }>;
}

function MissionComplexityAnalyzer() {
  const [missionData, setMissionData] = useState<MissionData>({
    airframe: 'C-17',
    cargoWeight: 0,
    requiresTechPrep: false,
    palletCount: 0,
    isInternational: false,
    hasLiveAnimals: false,
    hasDangerousGoods: false,
    loadmasterCount: 1,
    captainCategory: 'D',
    hasLoadingTeam: false,
  });

  const [result, setResult] = useState<ComplexityResult | null>(null);

  const calculateComplexity = () => {
    let totalPoints = 0;
    const factors = [];

    // Define airframe limits
    const airframeLimits = {
      'C-17': { maxWeight: 170900, maxPallets: 18 },
      'C-130': { maxWeight: 42000, maxPallets: 6 },
      'C-27J': { maxWeight: 25000, maxPallets: 4 },
      'KC30A': { maxWeight: 75000, maxPallets: 26 } // KC30A uses kg, but we'll convert for display
    };

    const currentLimits = airframeLimits[missionData.airframe];

    // Remove airframe capacity exceeded factor as requested

    // Tech Prep Required (0-10 points)
    const techPrepPoints = missionData.requiresTechPrep ? 10 : 0;
    factors.push({ name: 'Mechanical Equipment (Tech Prep)', points: techPrepPoints, maxPoints: 10 });
    totalPoints += techPrepPoints;

    // International Destination (0-8 points)
    const internationalPoints = missionData.isInternational ? 8 : 0;
    factors.push({ name: 'International Destination', points: internationalPoints, maxPoints: 8 });
    totalPoints += internationalPoints;

    // Live Animals (0-12 points)
    const liveAnimalPoints = missionData.hasLiveAnimals ? 12 : 0;
    factors.push({ name: 'Live Animals', points: liveAnimalPoints, maxPoints: 12 });
    totalPoints += liveAnimalPoints;

    // Dangerous Goods (0-15 points)
    const dangerousGoodsPoints = missionData.hasDangerousGoods ? 15 : 0;
    factors.push({ name: 'Dangerous Goods', points: dangerousGoodsPoints, maxPoints: 15 });
    totalPoints += dangerousGoodsPoints;

    // Single Loadmaster (0-10 points)
    const singleLoadmasterPoints = missionData.loadmasterCount === 1 ? 10 : 0;
    factors.push({ name: 'Single Loadmaster', points: singleLoadmasterPoints, maxPoints: 10 });
    totalPoints += singleLoadmasterPoints;

    // Captain Category (1-10 points) - D = least experienced (10 pts), A = most experienced (1 pt)
    let captainPoints = 0;
    if (missionData.captainCategory === 'D') captainPoints = 10;
    else if (missionData.captainCategory === 'C') captainPoints = 6;
    else if (missionData.captainCategory === 'B') captainPoints = 3;
    else if (missionData.captainCategory === 'A') captainPoints = 1;
    factors.push({ name: 'Captain Experience Level', points: captainPoints, maxPoints: 10 });
    totalPoints += captainPoints;

    // No Loading Team (0-25 points) - Having no loading team increases difficulty
    const noLoadingTeamPoints = !missionData.hasLoadingTeam ? 25 : 0;
    factors.push({ name: 'No Loading Team Assistance', points: noLoadingTeamPoints, maxPoints: 25 });
    totalPoints += noLoadingTeamPoints;

    // Calculate percentage
    const maxTotalPoints = 90; // Updated after removing cargo weight and pallet count factors
    const percentage = (totalPoints / maxTotalPoints) * 100;

    // Determine category
    let category: 'Beginner' | 'Intermediate' | 'Advanced';
    let categoryLetter: 'D' | 'C' | 'B/A';
    let color: string;
    let icon: any;

    if (percentage <= 33.3) {
      category = 'Beginner';
      categoryLetter = 'D';
      color = 'text-green-600';
      icon = CheckCircle;
    } else if (percentage <= 66.6) {
      category = 'Intermediate';
      categoryLetter = 'C';
      color = 'text-yellow-600';
      icon = Info;
    } else {
      category = 'Advanced';
      categoryLetter = 'B/A';
      color = 'text-red-600';
      icon = AlertTriangle;
    }

    setResult({
      score: Math.round(percentage),
      category,
      categoryLetter,
      color,
      icon,
      factors,
    });
  };

  const airframeLimits = {
    'C-17': { maxWeight: 170900, maxPallets: 18 },
    'C-130': { maxWeight: 42000, maxPallets: 6 },
    'C-27J': { maxWeight: 25000, maxPallets: 4 },
    'KC30A': { maxWeight: 75000, maxPallets: 26 }
  };

  const currentLimits = airframeLimits[missionData.airframe];

  return (
    <div className="space-y-6">
      {/* Airframe Selection */}
      <div className="p-4 border rounded-lg bg-primary/5">
        <Label htmlFor="airframe" className="text-lg font-semibold">Select Aircraft Type</Label>
        <Select value={missionData.airframe} onValueChange={(value) => setMissionData(prev => ({ ...prev, airframe: value as 'C-17' | 'C-130' | 'C-27J' | 'KC30A' }))}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="C-17">C-17 Globemaster III (Max: 170,900 lbs, 18 pallets)</SelectItem>
            <SelectItem value="C-130">C-130 Hercules (Max: 42,000 lbs, 6 pallets)</SelectItem>
            <SelectItem value="C-27J">C-27J Spartan (Max: 25,000 lbs, 4 pallets)</SelectItem>
            <SelectItem value="KC30A">KC30A (Max: 75,000 lbs, 26 pallets)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="cargoWeight">
              Cargo Weight (lbs) 
              <span className="text-sm text-muted-foreground ml-2">
                Max: {currentLimits.maxWeight.toLocaleString()} lbs
              </span>
            </Label>
            <Input
              id="cargoWeight"
              type="text"
              value={missionData.cargoWeight === 0 ? '' : missionData.cargoWeight.toString()}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value === '' ? 0 : parseInt(value) || 0;
                setMissionData(prev => ({ ...prev, cargoWeight: numValue }));
              }}
              placeholder="Enter cargo weight"
              className={missionData.cargoWeight > currentLimits.maxWeight ? "border-red-500" : ""}
            />
            {missionData.cargoWeight > currentLimits.maxWeight && (
              <p className="text-sm text-red-600 mt-1">⚠️ Exceeds aircraft capacity</p>
            )}
          </div>

          <div>
            <Label htmlFor="palletCount">
              Number of Pallets
              <span className="text-sm text-muted-foreground ml-2">
                Max: {currentLimits.maxPallets} pallets
              </span>
            </Label>
            <Input
              id="palletCount"
              type="text"
              value={missionData.palletCount === 0 ? '' : missionData.palletCount.toString()}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value === '' ? 0 : parseInt(value) || 0;
                setMissionData(prev => ({ ...prev, palletCount: numValue }));
              }}
              placeholder="Enter pallet count"
              className={missionData.palletCount > currentLimits.maxPallets ? "border-red-500" : ""}
            />
            {missionData.palletCount > currentLimits.maxPallets && (
              <p className="text-sm text-red-600 mt-1">⚠️ Exceeds aircraft pallet capacity</p>
            )}
          </div>

          <div>
            <Label htmlFor="loadmasterCount">Number of Loadmasters</Label>
            <Select value={missionData.loadmasterCount.toString()} onValueChange={(value) => setMissionData(prev => ({ ...prev, loadmasterCount: parseInt(value) as 1 | 2 }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Loadmaster</SelectItem>
                <SelectItem value="2">2 Loadmasters</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="captainCategory">Captain Category</Label>
            <Select value={missionData.captainCategory} onValueChange={(value) => setMissionData(prev => ({ ...prev, captainCategory: value as 'D' | 'C' | 'B' | 'A' }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="D">D Category (Least Experienced)</SelectItem>
                <SelectItem value="C">C Category</SelectItem>
                <SelectItem value="B">B Category</SelectItem>
                <SelectItem value="A">A Category (Most Experienced)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="techPrep"
                checked={missionData.requiresTechPrep}
                onCheckedChange={(checked) => setMissionData(prev => ({ ...prev, requiresTechPrep: !!checked }))}
              />
              <Label htmlFor="techPrep">Mechanical Equipment (Tech Prep)</Label>
            </div>
            <span className="text-sm text-muted-foreground">{missionData.requiresTechPrep ? 10 : 0}/10</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="international"
                checked={missionData.isInternational}
                onCheckedChange={(checked) => setMissionData(prev => ({ ...prev, isInternational: !!checked }))}
              />
              <Label htmlFor="international">International Destination</Label>
            </div>
            <span className="text-sm text-muted-foreground">{missionData.isInternational ? 8 : 0}/8</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="liveAnimals"
                checked={missionData.hasLiveAnimals}
                onCheckedChange={(checked) => setMissionData(prev => ({ ...prev, hasLiveAnimals: !!checked }))}
              />
              <Label htmlFor="liveAnimals">Live Animals</Label>
            </div>
            <span className="text-sm text-muted-foreground">{missionData.hasLiveAnimals ? 12 : 0}/12</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dangerousGoods"
                checked={missionData.hasDangerousGoods}
                onCheckedChange={(checked) => setMissionData(prev => ({ ...prev, hasDangerousGoods: !!checked }))}
              />
              <Label htmlFor="dangerousGoods">Dangerous Goods</Label>
            </div>
            <span className="text-sm text-muted-foreground">{missionData.hasDangerousGoods ? 15 : 0}/15</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="singleLoadmaster"
                checked={missionData.loadmasterCount === 1}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setMissionData(prev => ({ ...prev, loadmasterCount: 1 }));
                  }
                }}
              />
              <Label htmlFor="singleLoadmaster">Single Loadmaster</Label>
            </div>
            <span className="text-sm text-muted-foreground">{missionData.loadmasterCount === 1 ? 10 : 0}/10</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="captainExperience"
                checked={missionData.captainCategory === 'D'}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setMissionData(prev => ({ ...prev, captainCategory: 'D' }));
                  }
                }}
              />
              <Label htmlFor="captainExperience">Captain Experience Level</Label>
            </div>
            <span className="text-sm text-muted-foreground">{missionData.captainCategory === 'D' ? 10 : 0}/10</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="loadingTeam"
                checked={!missionData.hasLoadingTeam}
                onCheckedChange={(checked) => setMissionData(prev => ({ ...prev, hasLoadingTeam: !checked }))}
              />
              <Label htmlFor="loadingTeam">No Loading Team Assistance</Label>
            </div>
            <span className="text-sm text-muted-foreground">{!missionData.hasLoadingTeam ? 25 : 0}/25</span>
          </div>
        </div>
      </div>

      {/* Analyze Button */}
      <div className="flex justify-center">
        <Button onClick={calculateComplexity} className="px-8 py-2">
          Analyze Mission Complexity
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-8 p-6 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Mission Complexity Analysis</h3>
            <div className="flex items-center space-x-3">
              <result.icon className={`h-6 w-6 ${result.color}`} />
              <Badge variant="outline" className={`${result.color} text-lg px-3 py-1`}>
                {result.categoryLetter} Category
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Complexity Score</span>
                  <span className={`text-2xl font-bold ${result.color}`}>{result.score}%</span>
                </div>
                <Progress value={result.score} className="h-3" />
              </div>

              <div className={`p-4 rounded-lg border ${result.color === 'text-green-600' ? 'bg-green-950/20 border-green-800' : result.color === 'text-yellow-600' ? 'bg-yellow-950/20 border-yellow-800' : 'bg-red-950/20 border-red-800'}`}>
                <h4 className={`font-semibold ${result.color}`}>{result.category} Mission</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.category === 'Beginner' && 'Suitable for new loadmasters with supervision'}
                  {result.category === 'Intermediate' && 'Requires experienced loadmaster or close supervision'}
                  {result.category === 'Advanced' && 'Requires highly experienced loadmaster and additional support'}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Complexity Factors</h4>
              <div className="space-y-2">
                {result.factors.map((factor, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>{factor.name}</span>
                    <span className="font-medium">{factor.points}/{factor.maxPoints}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

          {/* Tools Categories */}
          <Tabs defaultValue="weight-balance" className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="weight-balance">Weight & Balance</TabsTrigger>
              <TabsTrigger value="psi-calculators">PSI Calculators</TabsTrigger>
              <TabsTrigger value="mission-analysis">Mission Analysis</TabsTrigger>
              <TabsTrigger value="checklists">Checklists</TabsTrigger>
            </TabsList>
            
            {/* Weight & Balance Tools */}
            <TabsContent value="weight-balance" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {/* Restraint Calculator */}
                <Card 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigateToTool('restraint-calculator')}
                >
                  <CardHeader className="bg-primary/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Restraint Calculator</CardTitle>
                      <Anchor className="h-5 w-5 text-primary" />
                    </div>
                    <CardDescription>Effective restraint force calculations</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-primary">Calculate:</div>
                      <div className="p-3 bg-slate-800 rounded text-xs font-mono">
                        <div>Effective Force = Total Force × cos(θ)</div>
                        <div>Forward/Aft = Force × cos(horizontal angle)</div>
                        <div>Lateral = Force × sin(horizontal angle)</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        • Restraint angle analysis<br />
                        • Component force calculation<br />
                        • G-force requirement verification
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 pt-2">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      Open Calculator
                    </Button>
                  </CardFooter>
                </Card>

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
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
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
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      Open Calculator
                    </Button>
                  </CardFooter>
                </Card>



                {/* Fuel Calculator */}
                <Card 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigateToTool('fuel-calculator')}
                >
                  <CardHeader className="bg-primary/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Fuel Calculator</CardTitle>
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <CardDescription>Aviation fuel burn calculations</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-primary">Calculate:</div>
                      <div className="p-3 bg-slate-800 rounded text-xs font-mono">
                        <div>• Fuel burn per hour</div>
                        <div>• Trip fuel requirements</div>
                        <div>• Range calculations</div>
                        <div>• Reserve fuel planning</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        • C-17, C-130, C-27J, KC30A profiles<br />
                        • Metric units (km, kg, L/h)<br />
                        • Weather condition adjustments
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 pt-2">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      Open Calculator
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            {/* PSI Calculators */}
            <TabsContent value="psi-calculators" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {/* Box PSI Calculator */}
                <Card 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigateToTool('box-psi')}
                >
                  <CardHeader className="bg-primary/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Box PSI Calculator</CardTitle>
                      <Box className="h-5 w-5 text-primary" />
                    </div>
                    <CardDescription>Square & Rectangle Box Floor Loading</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-primary">Formula:</div>
                      <div className="p-3 bg-slate-800 rounded-md">
                        <p>Weight ÷ (Length × Width) = PSI</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Critical for ensuring floor loading stays within aircraft limits
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 pt-2">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      Open Calculator
                    </Button>
                  </CardFooter>
                </Card>

                {/* Drum PSI Calculator */}
                <Card 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigateToTool('drum-psi')}
                >
                  <CardHeader className="bg-primary/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Drum PSI Calculator</CardTitle>
                      <Cylinder className="h-5 w-5 text-primary" />
                    </div>
                    <CardDescription>With & Without Rims Calculations</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-primary">Calculates:</div>
                      <div className="p-3 bg-slate-800 rounded-md">
                        <p className="mb-2">• Drums with rim (ring contact)</p>
                        <p>• Drums without rim (full base)</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Accounts for different contact area patterns
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 pt-2">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      Open Calculator
                    </Button>
                  </CardFooter>
                </Card>

                {/* Skidded Box PSI Calculator */}
                <Card 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigateToTool('skidded-box-psi')}
                >
                  <CardHeader className="bg-primary/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Skidded Box PSI</CardTitle>
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <CardDescription>Skid-Mounted Cargo Calculations</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-primary">Formula:</div>
                      <div className="p-3 bg-slate-800 rounded-md">
                        <p>GW ÷ (L of skid × W of skid × # of skids) = PSI</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          For cargo mounted on runners or skids
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 pt-2">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      Open Calculator
                    </Button>
                  </CardFooter>
                </Card>

                {/* Pneumatic Tire PSI Calculator */}
                <Card 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigateToTool('tire-psi')}
                >
                  <CardHeader className="bg-primary/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Tire PSI Calculator</CardTitle>
                      <Circle className="h-5 w-5 text-primary" />
                    </div>
                    <CardDescription>Pneumatic Tire Floor Loading</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-primary">Calculates:</div>
                      <div className="p-3 bg-slate-800 rounded-md">
                        <p className="mb-2">• Single tire PSI</p>
                        <p>• Multiple tire distribution</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          For vehicles and wheeled equipment
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 pt-2">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      Open Calculator
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            {/* Mission Analysis Tools */}
            <TabsContent value="mission-analysis" className="mt-6">
              <div className="mb-10">
                {/* Mission Complexity Analyzer - Full Width */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-primary/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Mission Complexity Analyzer</CardTitle>
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <CardDescription>One-Click Mission Difficulty Assessment</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <MissionComplexityAnalyzer />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Checklists */}
            <TabsContent value="checklists" className="mt-6">
              <div className="mb-10">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-primary/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Aircraft Checklists</CardTitle>
                      <CheckSquare className="h-5 w-5 text-primary" />
                    </div>
                    <CardDescription>Digital aircraft operational checklists with completion tracking</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <CheckSquare className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Digital Checklists</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Access instructor-created aircraft checklists for various operations. Complete items with tickboxes and track your progress.
                      </p>
                      <Button 
                        onClick={() => navigateToTool('checklists')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2"
                      >
                        View Available Checklists
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm text-gray-600">
                      <div className="text-center">
                        <div className="font-medium text-orange-600">C-17</div>
                        <div>Startup • Shutdown</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-orange-600">C-130</div>
                        <div>Pre-flight • Emergency</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-orange-600">KC30A</div>
                        <div>Systems • Operations</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-orange-600">C-27J</div>
                        <div>Configuration • Safety</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}