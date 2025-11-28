import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { 
  Plane, 
  ArrowLeft, 
  BookOpen, 
  Star, 
  GraduationCap,
  BarChart2 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { aircraftConfigs } from "@/utils/aircraft-config";

type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";

interface Module {
  id: string | number;
  title: string;
  description: string;
  aircraft: string;
  difficulty: DifficultyLevel;
  duration: string;
  topics: string[];
  objectives: string[];
  imageUrl?: string;
}

// Aircraft-specific training modules with progressive difficulty levels
const trainingModules: Module[] = [
  // C-17 Modules
  {
    id: "c17-basics",
    title: "C-17 Globemaster Basics",
    description: "Introduction to C-17 cargo loading fundamentals for beginner loadmasters",
    aircraft: "c17",
    difficulty: "beginner",
    duration: "45 minutes",
    topics: ["Aircraft Overview", "Safety Procedures", "Basic Loading Configurations"],
    objectives: [
      "Understand C-17 cargo area layout and dimensions",
      "Learn basic weight and balance principles",
      "Identify standard pallet positions"
    ],
    imageUrl: "/C17-cargo-bay.jpg"
  },
  {
    id: "c17-intermediate",
    title: "C-17 Weight Distribution",
    description: "Intermediate training on C-17 weight balancing and cargo distribution",
    aircraft: "c17",
    difficulty: "intermediate",
    duration: "60 minutes", 
    topics: ["Weight & Balance Management", "CG Calculation", "Load Planning Software"],
    objectives: [
      "Calculate center of gravity accurately",
      "Plan mixed cargo loads effectively",
      "Develop load plans for various mission profiles"
    ]
  },
  {
    id: "c17-advanced",
    title: "C-17 Complex Cargo Configurations",
    description: "Advanced techniques for complex cargo arrangements on C-17 aircraft",
    aircraft: "c17",
    difficulty: "advanced",
    duration: "90 minutes",
    topics: ["Mixed Cargo Types", "Oversized Equipment", "Dangerous Goods Integration"],
    objectives: [
      "Secure and transport oversized equipment safely",
      "Integrate multiple cargo types in single mission",
      "Implement special handling procedures for sensitive cargo"
    ]
  },
  {
    id: "c17-expert",
    title: "C-17 Tactical Loading Operations",
    description: "Expert-level tactical loading operations for C-17 in combat environments",
    aircraft: "c17",
    difficulty: "expert", 
    duration: "120 minutes",
    topics: ["Combat Loading Techniques", "Rapid Deployment", "Tactical Airlift Operations"],
    objectives: [
      "Execute rapid loading/unloading in tactical situations",
      "Plan airdrops and special mission configurations",
      "Implement emergency loading procedures"
    ]
  },
  
  // C-130 Modules
  {
    id: "c130-basics",
    title: "C-130 Hercules Fundamentals",
    description: "Introduction to C-130 cargo loading fundamentals",
    aircraft: "c130",
    difficulty: "beginner",
    duration: "45 minutes",
    topics: ["Aircraft Familiarization", "Standard Cargo Configurations", "Weight Limitations"],
    objectives: [
      "Understand C-130 cargo area layout and limitations",
      "Learn proper securing techniques",
      "Identify standard cargo positions"
    ]
  },
  {
    id: "c130-intermediate",
    title: "C-130 Load Planning Essentials",
    description: "Intermediate training on C-130 load planning and configuration",
    aircraft: "c130",
    difficulty: "intermediate",
    duration: "60 minutes",
    topics: ["Load Planning", "Weight Distribution", "Mixed Load Configuration"],
    objectives: [
      "Create effective load plans for varied mission types",
      "Calculate proper weight distribution",
      "Configure the aircraft for dual-role missions"
    ]
  },
  {
    id: "c130-advanced",
    title: "C-130 Specialized Cargo Handling",
    description: "Advanced training for specialized cargo types on C-130 aircraft",
    aircraft: "c130",
    difficulty: "advanced",
    duration: "90 minutes",
    topics: ["Special Cargo Procedures", "Airdrop Operations", "Combat Offload Techniques"],
    objectives: [
      "Prepare and secure cargo for airdrop operations",
      "Execute safe combat offload procedures",
      "Handle specialized military equipment configurations"
    ]
  },
  {
    id: "c130-expert",
    title: "C-130 Master Loadmaster Operations",
    description: "Expert level training for C-130 loadmasters in complex operations",
    aircraft: "c130",
    difficulty: "expert",
    duration: "120 minutes",
    topics: ["Complex Mission Planning", "Tactical Loading", "Multi-Drop Operations"],
    objectives: [
      "Plan and execute multi-drop missions",
      "Coordinate complex loading operations",
      "Implement contingency procedures for mission changes"
    ]
  },
  
  // KC30A Modules
  {
    id: "kc30a-basics",
    title: "KC30-A Airbus Cargo Basics",
    description: "Introduction to KC30-A cargo loading fundamentals",
    aircraft: "kc30a",
    difficulty: "beginner",
    duration: "45 minutes",
    topics: ["Aircraft Configuration", "ULD Management", "Weight in Kilograms"],
    objectives: [
      "Understand KC30-A unique cargo systems",
      "Properly plan loads using kg measurements",
      "Learn LD3 container and pallet positioning"
    ]
  },
  {
    id: "kc30a-intermediate",
    title: "KC30-A Mixed Operations",
    description: "Intermediate level training for mixed cargo/passenger/fuel operations",
    aircraft: "kc30a",
    difficulty: "intermediate",
    duration: "60 minutes",
    topics: ["Dual-Role Operations", "Passenger Cargo Mix", "Fuel Considerations"],
    objectives: [
      "Configure aircraft for mixed passenger/cargo operations",
      "Calculate weight balance with variable fuel loads",
      "Optimize cargo arrangement for dual-role missions"
    ]
  },
  {
    id: "kc30a-advanced",
    title: "KC30-A Advanced Configuration Management",
    description: "Advanced KC30-A configuration and cargo management",
    aircraft: "kc30a",
    difficulty: "advanced",
    duration: "90 minutes",
    topics: ["Configuration Changes", "Long-Range Operations", "Cargo System Troubleshooting"],
    objectives: [
      "Plan configuration changes during deployed operations",
      "Optimize loading for extended range missions",
      "Troubleshoot and resolve cargo system issues"
    ]
  },
  {
    id: "kc30a-expert",
    title: "KC30-A Operations Management",
    description: "Expert level KC30-A operations and cargo management",
    aircraft: "kc30a",
    difficulty: "expert",
    duration: "120 minutes",
    topics: ["Complete Aircraft Management", "Mission Replanning", "System Integration"],
    objectives: [
      "Manage complete aircraft loading operations",
      "Implement rapid reconfiguration procedures",
      "Integrate with aerial refueling mission requirements"
    ]
  },
  
  // C-27J Modules
  {
    id: "c27j-basics",
    title: "C-27J Spartan Fundamentals",
    description: "Introduction to C-27J cargo loading basics",
    aircraft: "c27j",
    difficulty: "beginner",
    duration: "30 minutes",
    topics: ["Aircraft Overview", "Basic Loading", "Small Configuration Management"],
    objectives: [
      "Understand C-27J cargo area layout and limitations",
      "Learn proper tie-down and securing techniques",
      "Configure aircraft for basic cargo missions"
    ]
  },
  {
    id: "c27j-intermediate",
    title: "C-27J Tactical Operations",
    description: "Intermediate tactical loading for C-27J operations",
    aircraft: "c27j",
    difficulty: "intermediate",
    duration: "45 minutes",
    topics: ["Tactical Loading", "Short Field Operations", "Rapid Reconfiguration"],
    objectives: [
      "Execute loading plans for tactical operations",
      "Prepare aircraft for short field operations",
      "Perform rapid cargo-to-personnel conversions"
    ]
  },
  {
    id: "c27j-advanced",
    title: "C-27J Multi-Mission Configuration",
    description: "Advanced training for C-27J multi-mission configurations",
    aircraft: "c27j",
    difficulty: "advanced",
    duration: "60 minutes",
    topics: ["Multi-Role Operations", "Medevac Configuration", "Special Mission Support"],
    objectives: [
      "Configure aircraft for medevac operations",
      "Support special mission requirements",
      "Implement rapid role change procedures"
    ]
  },
  {
    id: "c27j-expert",
    title: "C-27J Master Operations",
    description: "Expert level C-27J operational management",
    aircraft: "c27j",
    difficulty: "expert",
    duration: "90 minutes",
    topics: ["Complete Platform Management", "Austere Field Operations", "Mission Command"],
    objectives: [
      "Plan complete aircraft utilization for austere operations",
      "Manage loading operations in forward locations",
      "Coordinate multiple mission types in single deployment"
    ]
  }
];

// Difficulty color mapping
const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: "bg-green-500/20 text-green-500 border-green-500/30",
  intermediate: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  advanced: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  expert: "bg-red-500/20 text-red-500 border-red-500/30"
};

// Difficulty stars mapping
const difficultyStars: Record<DifficultyLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4
};

interface TrainingModulesPageProps {
  hideHeader?: boolean;
  params?: any; 
}

export default function TrainingModulesPage({ hideHeader = false, params }: TrainingModulesPageProps) {
  const [_, navigate] = useLocation();
  const [activeAircraft, setActiveAircraft] = useState<string>("all");

  // Use API data for consistency with instructor portal
  const { data: apiModules, isLoading } = useQuery<Module[]>({
    queryKey: ['/api/training-modules'],
    queryFn: async () => {
      const response = await fetch('/api/training-modules', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch training modules');
      const data = await response.json();
      console.log('📚 Student view: Fetched', data.length, 'training modules from API');
      return data;
    },
  });

  // Use API data if available, otherwise fallback to local data
  const modules: Module[] = apiModules && apiModules.length > 0 ? apiModules : trainingModules;

  // Filter modules based on selected aircraft
  const filteredModules: Module[] = activeAircraft === "all" 
    ? modules 
    : modules.filter((module: Module) => module.aircraft === activeAircraft);

  return (
    <>
      {!hideHeader && (
        <Helmet>
          <title>Aircraft-Specific Training Modules | LOADMworkflow</title>
          <meta 
            name="description" 
            content="Progressive aircraft-specific training modules for military loadmasters" 
          />
        </Helmet>
      )}

      <div className={hideHeader ? "" : "container mx-auto px-4 py-8 mb-16"}>
        <div className={hideHeader ? "" : "max-w-6xl mx-auto"}>

          
          {/* Header Section - only show if not embedded */}
          {!hideHeader && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-7 w-7 text-orange-500" />
                <h1 className="text-3xl font-bold text-foreground">
                  Aircraft-Specific Training Modules
                </h1>
              </div>
              <p className="text-muted-foreground max-w-3xl">
                Progressive training modules designed specifically for each aircraft type. 
                Complete modules sequentially to build your loadmaster skills from beginner to expert level.
              </p>
            </section>
          )}

          {/* Aircraft Selection Tabs */}
          <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveAircraft}>
            <TabsList className="bg-muted">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                All Aircraft
              </TabsTrigger>
              <TabsTrigger value="c17" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                C-17 Globemaster
              </TabsTrigger>
              <TabsTrigger value="c130" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                C-130 Hercules
              </TabsTrigger>
              <TabsTrigger value="kc30a" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                KC30-A Airbus
              </TabsTrigger>
              <TabsTrigger value="c27j" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                C-27J Spartan
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Progress Overview Card */}
          <Card className="mb-8 border-gray-800">
            <CardHeader className="pb-3 bg-card/50">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">Your Training Progress</CardTitle>
              </div>
              <CardDescription>
                Track your progress through the aircraft-specific training modules
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(aircraftConfigs).map(([id, config]) => (
                  <div key={id} className="bg-card/50 rounded-lg border border-gray-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Plane className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">{config.name}</h3>
                    </div>
                    <div className="h-2 bg-gray-800/30 rounded-full mb-2">
                      <div 
                        className="h-2 bg-orange-500 rounded-full" 
                        style={{ width: `${id === 'c17' ? 25 : id === 'c130' ? 50 : id === 'kc30a' ? 75 : 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {id === 'c17' ? '1/4' : id === 'c130' ? '2/4' : id === 'kc30a' ? '3/4' : '0/4'} modules completed
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Module Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <Card key={module.id} className="border-gray-800 bg-card hover:bg-card/90 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className={`${difficultyColors[module.difficulty]} border`}>
                      {module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1)}
                      {' '}
                      {[...Array(difficultyStars[module.difficulty])].map((_, i) => (
                        <Star key={i} className="h-3 w-3 inline ml-0.5 fill-current" />
                      ))}
                    </Badge>
                    <Badge variant="outline" className="bg-gray-800/20 text-gray-400 border-gray-800/30">
                      {module.duration}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-orange-500/20 p-1.5 rounded-md">
                      <Plane className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </div>
                  <CardDescription className="line-clamp-2 mt-1">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <h4 className="text-sm font-medium mb-1.5">Topics Covered:</h4>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {module.topics.map((topic, i) => (
                      <Badge key={i} variant="outline" className="bg-gray-800/10 text-gray-300 font-normal text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  <h4 className="text-sm font-medium mb-1.5">Learning Objectives:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4 mb-3">
                    {module.objectives.map((objective, i) => (
                      <li key={i}>{objective}</li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => navigate(`/training-modules/${module.id}`)}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Start Module
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}