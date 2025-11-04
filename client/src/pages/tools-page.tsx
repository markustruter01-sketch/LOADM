import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator, Scale, BarChart2, TrendingUp, Truck, Box, Cylinder, Package, Circle, Target, Anchor, CheckSquare, Plane, Clock, Filter } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { PermissionDialog } from "@/components/PermissionDialog";

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

interface ChecklistItem {
  id: number;
  itemText: string;
  itemOrder: number;
  isRequired: boolean;
  category?: string;
}

interface Checklist {
  id: number;
  title: string;
  description?: string;
  aircraftType: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  items: ChecklistItem[];
  creator: {
    email: string;
  };
  userCompletion?: ChecklistCompletion | null;
}

interface ChecklistCompletion {
  id: number;
  checklistId: number;
  completionStatus: "in_progress" | "completed";
  completedCount: number;
  totalItems: number;
  startedAt: string;
  completedAt?: string;
  checklist: {
    title: string;
    aircraftType: string;
    category: string;
  };
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

function ChecklistsGrid() {
  const [, setLocation] = useLocation();
  const [aircraftFilter, setAircraftFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const canSubmit = true; // Permissions checked server-side

  const { data: checklists = [], isLoading: checklistsLoading, error: checklistsError } = useQuery({
    queryKey: ['/api/checklists'],
    enabled: true
  });

  // Completions are now included in the main checklists response - no separate call needed

  const handleChecklistClick = (checklistId: number) => {
    if (!canSubmit) {
      setShowPermissionDialog(true);
      return;
    }
    setLocation(`/tools/checklists/${checklistId}`);
  };

  const getCompletionStatus = (checklist: Checklist) => {
    if (!canSubmit) return null;
    return checklist.userCompletion;
  };

  const getAircraftIcon = (aircraftType: string) => {
    return <Plane className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'startup': return 'bg-green-100 text-green-800 border-green-200';
      case 'shutdown': return 'bg-red-100 text-red-800 border-red-200';
      case 'pre-flight': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'post-flight': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'emergency': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredChecklists = (checklists as Checklist[]).filter((checklist: Checklist) => {
    const aircraftMatch = aircraftFilter === "all" || checklist.aircraftType.toLowerCase() === aircraftFilter.toLowerCase();
    const categoryMatch = categoryFilter === "all" || checklist.category === categoryFilter;
    return aircraftMatch && categoryMatch;
  });

  const aircraftTypes = Array.from(new Set((checklists as Checklist[]).map((c: Checklist) => c.aircraftType)));
  const categories = Array.from(new Set((checklists as Checklist[]).map((c: Checklist) => c.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <CheckSquare className="h-12 w-12 text-orange-500 mx-auto mb-3" />
        <h3 className="text-xl font-semibold mb-2">Aircraft Checklists</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
          Complete digital checklists for various aircraft operations. Track your progress and ensure all procedures are followed correctly.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Select value={aircraftFilter} onValueChange={setAircraftFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Aircraft" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Aircraft</SelectItem>
              {aircraftTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {checklistsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChecklists.map((checklist: Checklist) => {
            const completion = getCompletionStatus(checklist);
            const isCompleted = completion?.completionStatus === "completed";
            const completionPercentage = completion ? Math.round((completion.completedCount / completion.totalItems) * 100) : 0;

            return (
              <Card 
                key={checklist.id}
                className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-orange-200"
                onClick={() => handleChecklistClick(checklist.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      {getAircraftIcon(checklist.aircraftType)}
                      <Badge variant="outline" className="text-xs border-orange-400 text-orange-600 bg-orange-50">
                        {checklist.aircraftType}
                      </Badge>
                    </div>
                    {completion && (
                      <Badge 
                        className={`text-xs ${isCompleted 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}
                      >
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base group-hover:text-orange-600 transition-colors">
                    {checklist.title}
                  </CardTitle>
                  {checklist.description && (
                    <CardDescription className="text-sm">
                      {checklist.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <Badge className={getCategoryColor(checklist.category)}>
                        {checklist.category.charAt(0).toUpperCase() + checklist.category.slice(1).replace('-', ' ')}
                      </Badge>
                      <span className="text-muted-foreground">
                        {checklist.items.length} items
                      </span>
                    </div>

                    {completion && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{completionPercentage}%</span>
                        </div>
                        <Progress value={completionPercentage} className="h-2" />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Created {new Date(checklist.createdAt).toLocaleDateString()}</span>
                      </div>
                      {completion?.completedAt && (
                        <span>Completed {new Date(completion.completedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredChecklists.length === 0 && !checklistsLoading && (
        <div className="text-center py-12">
          <CheckSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Checklists Found</h3>
          <p className="text-muted-foreground">
            {aircraftFilter !== "all" || categoryFilter !== "all" 
              ? "Try adjusting your filters to see more checklists."
              : "No checklists have been created yet."}
          </p>
        </div>
      )}

      <PermissionDialog 
        isOpen={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        action="access checklists"
        feature="Checklist Access"
      />
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
                  className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333] hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigateToTool('restraint-calculator')}
                  data-testid="card-restraint-calculator"
                >
                  <CardHeader className="border-b border-[#333333] pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">Restraint Calculator</CardTitle>
                      <Anchor className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardDescription className="text-gray-400">Effective restraint force calculations</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3 text-sm">
                      <div className="font-medium text-orange-500">Calculate:</div>
                      <div className="p-3 bg-[#0a0a0a] border border-[#444444] rounded-lg text-xs font-mono text-gray-300">
                        <div>Effective Force = Total Force × cos(θ)</div>
                        <div>Forward/Aft = Force × cos(horizontal angle)</div>
                        <div>Lateral = Force × sin(horizontal angle)</div>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>• Restraint angle analysis</div>
                        <div>• Component force calculation</div>
                        <div>• G-force requirement verification</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-t border-[#333333] pt-4">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200" data-testid="button-open-restraint-calculator">
                      Open Calculator
                    </Button>
                  </CardFooter>
                </Card>

                {/* WAM Calculator */}
                <Card 
                  className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333] hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigateToTool('wam-calculator')}
                  data-testid="card-wam-calculator"
                >
                  <CardHeader className="border-b border-[#333333] pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">WAM Calculator</CardTitle>
                      <Calculator className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardDescription className="text-gray-400">Weight-Arm-Moment calculations</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3 text-sm">
                      <div className="font-medium text-orange-500">Formulas:</div>
                      <div className="p-3 bg-[#0a0a0a] border border-[#444444] rounded-lg text-gray-300 space-y-2">
                        <p>Arm × Weight = Moment</p>
                        <p>Moment ÷ Arm = Weight</p>
                        <p>Moment ÷ Weight = Arm</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-t border-[#333333] pt-4">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200" data-testid="button-open-wam-calculator">
                      Open Calculator
                    </Button>
                  </CardFooter>
                </Card>

                {/* Vehicle CGFA Calculator */}
                <Card 
                  className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333] hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigateToTool('vehicle-cgfa')}
                  data-testid="card-vehicle-cgfa"
                >
                  <CardHeader className="border-b border-[#333333] pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">Vehicle CGFA Calculator</CardTitle>
                      <Truck className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardDescription className="text-gray-400">Center of Gravity Forward of Aft Axle</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3 text-sm">
                      <div className="font-medium text-orange-500">Formula:</div>
                      <div className="p-3 bg-[#0a0a0a] border border-[#444444] rounded-lg space-y-2">
                        <p className="text-gray-300">RAW × WB ÷ GW = CGFA in Inches</p>
                        <div className="text-xs text-gray-400 pt-2 space-y-1">
                          <div>RAW: Rear Axle Weight</div>
                          <div>WB: Wheelbase</div>
                          <div>GW: Gross Weight</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-t border-[#333333] pt-4">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200" data-testid="button-open-vehicle-cgfa">
                      Open Calculator
                    </Button>
                  </CardFooter>
                </Card>



                {/* Fuel Calculator */}
                <Card 
                  className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333] hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigateToTool('fuel-calculator')}
                  data-testid="card-fuel-calculator"
                >
                  <CardHeader className="border-b border-[#333333] pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">Fuel Calculator</CardTitle>
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardDescription className="text-gray-400">Aviation fuel burn calculations</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3 text-sm">
                      <div className="font-medium text-orange-500">Calculate:</div>
                      <div className="p-3 bg-[#0a0a0a] border border-[#444444] rounded-lg text-xs font-mono text-gray-300 space-y-1">
                        <div>• Fuel burn per hour</div>
                        <div>• Trip fuel requirements</div>
                        <div>• Range calculations</div>
                        <div>• Reserve fuel planning</div>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>• C-17, C-130, C-27J, KC30A profiles</div>
                        <div>• Metric units (km, kg, L/h)</div>
                        <div>• Weather condition adjustments</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-t border-[#333333] pt-4">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200" data-testid="button-open-fuel-calculator">
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
                  className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333] hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigateToTool('box-psi')}
                  data-testid="card-box-psi"
                >
                  <CardHeader className="border-b border-[#333333] pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">Box PSI Calculator</CardTitle>
                      <Box className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardDescription className="text-gray-400">Square & Rectangle Box Floor Loading</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3 text-sm">
                      <div className="font-medium text-orange-500">Formula:</div>
                      <div className="p-3 bg-[#0a0a0a] border border-[#444444] rounded-lg space-y-2">
                        <p className="text-gray-300">Weight ÷ (Length × Width) = PSI</p>
                        <p className="text-xs text-gray-400">
                          Critical for ensuring floor loading stays within aircraft limits
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-t border-[#333333] pt-4">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200" data-testid="button-open-box-psi">
                      Open Calculator
                    </Button>
                  </CardFooter>
                </Card>

                {/* Drum PSI Calculator */}
                <Card 
                  className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333] hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigateToTool('drum-psi')}
                  data-testid="card-drum-psi"
                >
                  <CardHeader className="border-b border-[#333333] pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">Drum PSI Calculator</CardTitle>
                      <Cylinder className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardDescription className="text-gray-400">With & Without Rims Calculations</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3 text-sm">
                      <div className="font-medium text-orange-500">Calculates:</div>
                      <div className="p-3 bg-[#0a0a0a] border border-[#444444] rounded-lg space-y-2">
                        <p className="text-gray-300">• Drums with rim (ring contact)</p>
                        <p className="text-gray-300">• Drums without rim (full base)</p>
                        <p className="text-xs text-gray-400 pt-1">
                          Accounts for different contact area patterns
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-t border-[#333333] pt-4">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200" data-testid="button-open-drum-psi">
                      Open Calculator
                    </Button>
                  </CardFooter>
                </Card>

                {/* Skidded Box PSI Calculator */}
                <Card 
                  className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333] hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigateToTool('skidded-box-psi')}
                  data-testid="card-skidded-box-psi"
                >
                  <CardHeader className="border-b border-[#333333] pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">Skidded Box PSI</CardTitle>
                      <Package className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardDescription className="text-gray-400">Skid-Mounted Cargo Calculations</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3 text-sm">
                      <div className="font-medium text-orange-500">Formula:</div>
                      <div className="p-3 bg-[#0a0a0a] border border-[#444444] rounded-lg space-y-2">
                        <p className="text-gray-300">GW ÷ (L of skid × W of skid × # of skids) = PSI</p>
                        <p className="text-xs text-gray-400">
                          For cargo mounted on runners or skids
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-t border-[#333333] pt-4">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200" data-testid="button-open-skidded-box-psi">
                      Open Calculator
                    </Button>
                  </CardFooter>
                </Card>

                {/* Pneumatic Tire PSI Calculator */}
                <Card 
                  className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333] hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigateToTool('tire-psi')}
                  data-testid="card-tire-psi"
                >
                  <CardHeader className="border-b border-[#333333] pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">Tire PSI Calculator</CardTitle>
                      <Circle className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardDescription className="text-gray-400">Pneumatic Tire Floor Loading</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3 text-sm">
                      <div className="font-medium text-orange-500">Calculates:</div>
                      <div className="p-3 bg-[#0a0a0a] border border-[#444444] rounded-lg space-y-2">
                        <p className="text-gray-300">• Single tire PSI</p>
                        <p className="text-gray-300">• Multiple tire distribution</p>
                        <p className="text-xs text-gray-400 pt-1">
                          For vehicles and wheeled equipment
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-t border-[#333333] pt-4">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200" data-testid="button-open-tire-psi">
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
                <Card className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-[#333333] hover:shadow-xl transition-all duration-300" data-testid="card-mission-complexity">
                  <CardHeader className="border-b border-[#333333] pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">Mission Complexity Analyzer</CardTitle>
                      <Target className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardDescription className="text-gray-400">One-Click Mission Difficulty Assessment</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <MissionComplexityAnalyzer />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Checklists */}
            <TabsContent value="checklists" className="mt-6">
              <ChecklistsGrid />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}