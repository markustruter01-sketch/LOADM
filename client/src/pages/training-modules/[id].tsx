import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useRoute, useLocation } from "wouter";
import { 
  ArrowLeft, 
  BookOpen, 
  Star, 
  CheckCircle2,
  Download,
  Plane,
  PlayCircle,
  FileText,
  LucideIcon,
  ListChecks,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { aircraftConfigs } from "@/utils/aircraft-config";

// Import interactive content components
import C17BasicsInteractive from "./interactive-content/c17-basics";
import KC30ABasicsInteractive from "./interactive-content/kc30a-basics";
import C130BasicsInteractive from "./interactive-content/c130-basics";
import C27JBasicsInteractive from "./interactive-content/c27j-basics";

// Import quiz content components
import C17BasicsQuiz from "./quiz-content/c17-basics-quiz";
import KC30ABasicsQuiz from "./quiz-content/kc30a-basics-quiz";
import C130BasicsQuiz from "./quiz-content/c130-basics-quiz";
import C27JBasicsQuiz from "./quiz-content/c27j-basics-quiz";

// Import reading content components
import C17CargoBayLayout from "./reading-content/c17-cargo-bay-layout";
import KC30ACargoBaySystems from "./reading-content/kc30a-cargo-systems";
import C130CargoConfigurations from "./reading-content/c130-cargo-configurations";
import C27JOperations from "./reading-content/c27j-operations";

// Import video player component
import TrainingVideoPlayer from "@/components/TrainingVideoPlayer";

// Types from the main modules page
type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";

interface Module {
  id: string;
  title: string;
  description: string;
  aircraft: string;
  difficulty: DifficultyLevel;
  duration: string;
  topics: string[];
  objectives: string[];
  imageUrl?: string;
}

// Create a type for module content
interface LessonContent {
  id: string;
  title: string;
  type: "video" | "reading" | "interactive" | "quiz";
  duration: string;
  description: string;
  content: string;
  completed?: boolean;
}

// Create sample training modules the same as in the index page
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

// Content type icon mapping
const contentTypeIcons: Record<string, LucideIcon> = {
  video: PlayCircle,
  reading: FileText,
  interactive: ListChecks,
  quiz: GraduationCap
};

// Sample module contents for C-17 basics (first module)
const moduleContents: Record<string, LessonContent[]> = {
  "c17-basics": [
    {
      id: "c17-basics-1",
      title: "Introduction to C-17 Globemaster",
      type: "video",
      duration: "15 min",
      description: "Overview of the C-17 Globemaster capabilities and specifications",
      content: "Video content would be embedded here",
      completed: true
    },
    {
      id: "c17-cargo-bay-layout",
      title: "C-17 Cargo Bay Layout",
      type: "reading",
      duration: "10 min",
      description: "Detailed walkthrough of the C-17 cargo bay dimensions and configurations",
      content: "Reading content would be displayed here",
      completed: true
    },
    {
      id: "c17-basics-3",
      title: "Pallet Position Identification",
      type: "interactive",
      duration: "12 min",
      description: "Interactive exercise to learn pallet positions and naming conventions",
      content: "Interactive content would be displayed here",
      completed: false
    },
    {
      id: "c17-basics-4",
      title: "Basic Weight and Balance Principles",
      type: "reading",
      duration: "8 min",
      description: "Fundamental weight and balance principles for C-17 cargo loading",
      content: "Reading content would be displayed here",
      completed: false
    },
    {
      id: "c17-basics-5",
      title: "C-17 Basics Assessment",
      type: "quiz",
      duration: "10 min",
      description: "Test your knowledge of C-17 Globemaster basics",
      content: "Quiz questions would be displayed here",
      completed: false
    }
  ],
  "c17-intermediate": [
    {
      id: "c17-inter-1",
      title: "Advanced Weight Distribution Concepts",
      type: "video",
      duration: "18 min",
      description: "Detailed overview of weight distribution principles for C-17",
      content: "Video content would be embedded here",
      completed: false
    },
    {
      id: "c17-inter-2",
      title: "Center of Gravity Calculations",
      type: "interactive",
      duration: "15 min",
      description: "Interactive tutorial on CG calculations for different load scenarios",
      content: "Interactive content would be displayed here",
      completed: false
    },
    {
      id: "c17-inter-3",
      title: "Mixed Cargo Loading Strategies",
      type: "reading",
      duration: "12 min",
      description: "Strategies for efficiently loading different types of cargo",
      content: "Reading content would be displayed here",
      completed: false
    },
    {
      id: "c17-inter-4",
      title: "Load Planning Software Tutorial",
      type: "interactive",
      duration: "20 min",
      description: "Hands-on tutorial for using load planning software",
      content: "Interactive tutorial would be displayed here",
      completed: false
    },
    {
      id: "c17-inter-5",
      title: "Intermediate Assessment",
      type: "quiz",
      duration: "15 min",
      description: "Evaluate your understanding of intermediate C-17 loading concepts",
      content: "Quiz content would be displayed here",
      completed: false
    }
  ],
  "c130-basics": [
    {
      id: "c130-basics-1",
      title: "Introduction to C-130 Hercules",
      type: "video",
      duration: "15 min",
      description: "Overview of the C-130 Hercules capabilities and specifications",
      content: "Video content would be embedded here",
      completed: true
    },
    {
      id: "c130-cargo-configurations",
      title: "C-130 Cargo Configurations and Procedures",
      type: "reading",
      duration: "10 min",
      description: "Standard configurations and procedures for the C-130 cargo systems",
      content: "Reading content would be displayed here",
      completed: true
    },
    {
      id: "c130-basics-3",
      title: "Pallet Securing Techniques",
      type: "interactive",
      duration: "15 min",
      description: "Hands-on tutorial for securing pallets in a C-130",
      content: "Interactive content would be displayed here",
      completed: true
    },
    {
      id: "c130-basics-4",
      title: "C-130 Weight Limitations",
      type: "reading",
      duration: "10 min",
      description: "Understanding weight limitations for the C-130 Hercules",
      content: "Reading content would be displayed here",
      completed: false
    },
    {
      id: "c130-basics-5",
      title: "C-130 Basics Assessment",
      type: "quiz",
      duration: "10 min",
      description: "Test your knowledge of C-130 Hercules fundamentals",
      content: "Quiz content would be displayed here",
      completed: false
    }
  ],
  "kc30a-basics": [
    {
      id: "kc30a-basics-1",
      title: "Introduction to KC30-A Airbus",
      type: "video",
      duration: "15 min",
      description: "Overview of the KC30-A capabilities and specifications",
      content: "Video content would be embedded here",
      completed: true
    },
    {
      id: "kc30a-cargo-systems",
      title: "KC30-A Multi-Role Tanker Transport Cargo Systems",
      type: "reading",
      duration: "12 min",
      description: "Understanding cargo systems specific to the KC30-A MRTT",
      content: "Reading content would be displayed here",
      completed: true
    },
    {
      id: "kc30a-basics-3",
      title: "ULD Management for KC30-A",
      type: "interactive",
      duration: "15 min",
      description: "Managing Unit Load Devices in KC30-A operations",
      content: "Interactive content would be displayed here",
      completed: true
    },
    {
      id: "kc30a-basics-4",
      title: "Kilogram Calculations for KC30-A",
      type: "interactive",
      duration: "10 min",
      description: "Weight calculations using metric units for KC30-A",
      content: "Interactive content would be displayed here",
      completed: false
    },
    {
      id: "kc30a-basics-5",
      title: "KC30-A Basics Assessment",
      type: "quiz",
      duration: "10 min",
      description: "Test your knowledge of KC30-A fundamentals",
      content: "Quiz content would be displayed here",
      completed: false
    }
  ],
  "c27j-basics": [
    {
      id: "c27j-basics-1",
      title: "Introduction to C-27J Spartan",
      type: "video",
      duration: "12 min",
      description: "Overview of the C-27J Spartan capabilities and specifications",
      content: "Video content would be embedded here",
      completed: false
    },
    {
      id: "c27j-operations",
      title: "C-27J Spartan Tactical Operations",
      type: "reading",
      duration: "8 min",
      description: "Understanding C-27J tactical operations and cargo configurations",
      content: "Reading content would be displayed here",
      completed: false
    },
    {
      id: "c27j-basics-3",
      title: "Tie-Down Techniques for C-27J",
      type: "interactive",
      duration: "10 min",
      description: "Proper securing and tie-down methods for C-27J cargo",
      content: "Interactive content would be displayed here",
      completed: false
    },
    {
      id: "c27j-basics-4",
      title: "C-27J Weight and Balance",
      type: "reading",
      duration: "8 min",
      description: "Basic weight and balance principles for the C-27J",
      content: "Reading content would be displayed here",
      completed: false
    },
    {
      id: "c27j-basics-5",
      title: "C-27J Basics Assessment",
      type: "quiz",
      duration: "8 min",
      description: "Test your knowledge of C-27J Spartan fundamentals",
      content: "Quiz content would be displayed here",
      completed: false
    }
  ]
};

export default function ModuleDetailPage() {
  const [, params] = useRoute('/training-modules/:id');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('overview');
  const [moduleProgress, setModuleProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  
  // Fetch training modules from API
  const { data: apiModules } = useQuery({
    queryKey: ['/api/training-modules'],
    queryFn: async () => {
      const response = await fetch('/api/training-modules');
      if (!response.ok) throw new Error('Failed to fetch training modules');
      return response.json();
    },
  });

  // Use API data if available, otherwise fallback to local data
  const modules = apiModules || trainingModules;
  
  // Find the module that matches the ID parameter (convert to number if needed)
  const moduleId = params?.id || '';
  const numericId = parseInt(moduleId);
  const module = modules.find(m => m.id === numericId || m.id === moduleId);

  // Map API module IDs to content keys
  const getContentKey = (module: any) => {
    if (!module) return '';
    
    // If it's a numeric ID from API, map to content key
    if (typeof module.id === 'number') {
      const aircraft = module.aircraft;
      const difficulty = module.difficulty;
      
      // Map based on aircraft type and difficulty
      if (aircraft === 'c17') {
        if (difficulty === 'beginner') return 'c17-basics';
        if (difficulty === 'intermediate') return 'c17-intermediate';
        if (difficulty === 'advanced') return 'c17-advanced';
        if (difficulty === 'expert') return 'c17-expert';
      }
      if (aircraft === 'c130') {
        if (difficulty === 'beginner') return 'c130-basics';
        if (difficulty === 'intermediate') return 'c130-intermediate';
        if (difficulty === 'advanced') return 'c130-advanced';
        if (difficulty === 'expert') return 'c130-expert';
      }
      if (aircraft === 'kc30a') {
        if (difficulty === 'beginner') return 'kc30a-basics';
        if (difficulty === 'intermediate') return 'kc30a-intermediate';
        if (difficulty === 'advanced') return 'kc30a-advanced';
        if (difficulty === 'expert') return 'kc30a-expert';
      }
      if (aircraft === 'c27j') {
        if (difficulty === 'beginner') return 'c27j-basics';
        if (difficulty === 'intermediate') return 'c27j-intermediate';
        if (difficulty === 'advanced') return 'c27j-advanced';
        if (difficulty === 'expert') return 'c27j-expert';
      }
    }
    
    // Fallback to original ID for string IDs
    return module.id;
  };

  // Get module content using the correct key
  const contentKey = getContentKey(module);
  const content = moduleContents[contentKey] || [];

  // Calculate progress based on completed lessons
  useEffect(() => {
    if (content.length > 0) {
      const completedCount = content.filter(lesson => lesson.completed).length;
      const progress = Math.round((completedCount / content.length) * 100);
      setModuleProgress(progress);
      
      // Update completed lessons array
      const completed = content
        .filter(lesson => lesson.completed)
        .map(lesson => lesson.id);
      setCompletedLessons(completed);
    }
  }, [content]);

  // Handle lesson completion
  const completeLesson = (lessonId: string) => {
    // In a real app, this would make an API call to update the user's progress
    toast({
      title: "Lesson completed",
      description: "Your progress has been saved",
    });
    
    // Update local state for demo purposes
    setCompletedLessons(prev => [...prev, lessonId]);
  };

  if (!module) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Module Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The training module you requested could not be found.
          </p>
          <Button onClick={() => navigate('/training-modules')}>
            Return to Modules
          </Button>
        </div>
      </div>
    );
  }

  // Calculate available content types
  const contentTypes = [...new Set(content.map(item => item.type))];

  const getAircraftName = (id: string) => {
    const config = aircraftConfigs[id];
    return config ? config.name : id;
  };

  return (
    <>
      <Helmet>
        <title>{module.title} | LOADMworkflow</title>
        <meta 
          name="description" 
          content={`${module.description} - Aircraft-specific training module for military loadmasters.`} 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-6"
            onClick={() => navigate('/airframe')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Modules
          </Button>
          
          {/* Header Section */}
          <div className="mb-8 bg-card border border-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-orange-500/20 p-2 rounded-md">
                    <Plane className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <Badge variant="outline" className={`${difficultyColors[module.difficulty]} border mb-1`}>
                      {module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1)}
                      {' '}
                      {[...Array(difficultyStars[module.difficulty])].map((_, i) => (
                        <Star key={i} className="h-3 w-3 inline ml-0.5 fill-current" />
                      ))}
                    </Badge>
                    <h1 className="text-2xl font-bold">{module.title}</h1>
                  </div>
                </div>
                <p className="text-muted-foreground max-w-2xl mb-4">
                  {module.description}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30">
                      {getAircraftName(module.aircraft)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{module.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                    <span>{content.length} lessons</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="bg-gray-800/20 border-gray-800"
                  onClick={() => {
                    toast({
                      title: "Module materials downloaded",
                      description: "You can now access this module offline",
                    });
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{moduleProgress}%</span>
              </div>
              <Progress value={moduleProgress} className="h-2" />
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-8">
            <TabsList className="bg-muted">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              {contentTypes.includes('video') && (
                <TabsTrigger value="videos" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Videos
                </TabsTrigger>
              )}
              {contentTypes.includes('reading') && (
                <TabsTrigger value="readings" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Readings
                </TabsTrigger>
              )}
              {contentTypes.includes('interactive') && (
                <TabsTrigger value="interactive" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Interactive
                </TabsTrigger>
              )}
              {contentTypes.includes('quiz') && (
                <TabsTrigger value="quizzes" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Quizzes
                </TabsTrigger>
              )}
            </TabsList>

            {/* Overview Tab Content */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Module Info */}
                <div className="md:col-span-2 space-y-6">
                  <Card className="border-gray-800">
                    <CardHeader>
                      <CardTitle>Module Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        {module.description}
                      </p>
                      <h3 className="text-lg font-medium mb-2">Learning Objectives</h3>
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground mb-4">
                        {module.objectives.map((objective, index) => (
                          <li key={index}>{objective}</li>
                        ))}
                      </ul>
                      <h3 className="text-lg font-medium mb-2">Topics Covered</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {module.topics.map((topic, index) => (
                          <Badge key={index} variant="outline" className="bg-gray-800/10 text-gray-300">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="text-lg font-medium mb-2">Prerequisites</h3>
                      <p className="text-muted-foreground">
                        {module.difficulty === "beginner" 
                          ? "No prerequisites required. This is a beginner level module."
                          : `Complete the ${module.aircraft.toUpperCase()} ${
                              module.difficulty === "intermediate" 
                                ? "basics" 
                                : module.difficulty === "advanced" 
                                  ? "intermediate" 
                                  : "advanced"
                            } module before starting this one.`
                        }
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-800">
                    <CardHeader>
                      <CardTitle>Module Content</CardTitle>
                      <CardDescription>
                        Complete all lessons to finish this module
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {content.map((lesson, index) => {
                          const ContentIcon = contentTypeIcons[lesson.type];
                          const isCompleted = completedLessons.includes(lesson.id);
                          return (
                            <div key={lesson.id} className="relative">
                              {index > 0 && (
                                <div className="absolute left-4 top-0 h-full w-0.5 -translate-x-1/2 bg-gray-800/20" />
                              )}
                              <div className="relative flex items-start gap-4 pb-4">
                                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                                  isCompleted 
                                    ? "bg-primary border-primary" 
                                    : "bg-gray-800/10 border-gray-800/30"
                                }`}>
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  ) : (
                                    <ContentIcon className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-base font-medium">{lesson.title}</h4>
                                    <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30">
                                      {lesson.duration}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {lesson.description}
                                  </p>
                                  <div className="mt-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => isCompleted ? null : completeLesson(lesson.id)}
                                      className={isCompleted ? "bg-green-600 hover:bg-green-700" : ""}
                                      disabled={isCompleted}
                                    >
                                      {isCompleted ? (
                                        <>
                                          <CheckCircle2 className="h-4 w-4 mr-2" />
                                          Completed
                                        </>
                                      ) : (
                                        <>
                                          <ContentIcon className="h-4 w-4 mr-2" />
                                          Start {lesson.type}
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Sidebar */}
                <div className="space-y-6">
                  <Card className="border-gray-800">
                    <CardHeader>
                      <CardTitle>Your Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center rounded-full w-20 h-20 border-4 border-primary mb-2">
                          <span className="text-2xl font-bold">{moduleProgress}%</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {completedLessons.length} of {content.length} lessons completed
                        </p>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Videos</span>
                            <span>{
                              completedLessons.filter(id => 
                                content.find(l => l.id === id)?.type === 'video'
                              ).length
                            } / {
                              content.filter(l => l.type === 'video').length
                            }</span>
                          </div>
                          <Progress 
                            value={
                              content.filter(l => l.type === 'video').length > 0
                                ? (completedLessons.filter(id => 
                                    content.find(l => l.id === id)?.type === 'video'
                                  ).length / 
                                  content.filter(l => l.type === 'video').length) * 100
                                : 0
                            } 
                            className="h-2" 
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Readings</span>
                            <span>{
                              completedLessons.filter(id => 
                                content.find(l => l.id === id)?.type === 'reading'
                              ).length
                            } / {
                              content.filter(l => l.type === 'reading').length
                            }</span>
                          </div>
                          <Progress 
                            value={
                              content.filter(l => l.type === 'reading').length > 0
                                ? (completedLessons.filter(id => 
                                    content.find(l => l.id === id)?.type === 'reading'
                                  ).length / 
                                  content.filter(l => l.type === 'reading').length) * 100
                                : 0
                            } 
                            className="h-2" 
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Interactive</span>
                            <span>{
                              completedLessons.filter(id => 
                                content.find(l => l.id === id)?.type === 'interactive'
                              ).length
                            } / {
                              content.filter(l => l.type === 'interactive').length
                            }</span>
                          </div>
                          <Progress 
                            value={
                              content.filter(l => l.type === 'interactive').length > 0
                                ? (completedLessons.filter(id => 
                                    content.find(l => l.id === id)?.type === 'interactive'
                                  ).length / 
                                  content.filter(l => l.type === 'interactive').length) * 100
                                : 0
                            } 
                            className="h-2" 
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Quizzes</span>
                            <span>{
                              completedLessons.filter(id => 
                                content.find(l => l.id === id)?.type === 'quiz'
                              ).length
                            } / {
                              content.filter(l => l.type === 'quiz').length
                            }</span>
                          </div>
                          <Progress 
                            value={
                              content.filter(l => l.type === 'quiz').length > 0
                                ? (completedLessons.filter(id => 
                                    content.find(l => l.id === id)?.type === 'quiz'
                                  ).length / 
                                  content.filter(l => l.type === 'quiz').length) * 100
                                : 0
                            } 
                            className="h-2" 
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-800">
                    <CardHeader>
                      <CardTitle>Resources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li>
                          <Button variant="link" className="p-0 h-auto text-primary">
                            <FileText className="h-4 w-4 mr-2" />
                            {module.aircraft.toUpperCase()} Technical Manual
                          </Button>
                        </li>
                        <li>
                          <Button variant="link" className="p-0 h-auto text-primary">
                            <FileText className="h-4 w-4 mr-2" />
                            Cargo Loading Procedures
                          </Button>
                        </li>
                        <li>
                          <Button variant="link" className="p-0 h-auto text-primary">
                            <FileText className="h-4 w-4 mr-2" />
                            Weight and Balance Handbook
                          </Button>
                        </li>
                        <li>
                          <Button variant="link" className="p-0 h-auto text-primary">
                            <Download className="h-4 w-4 mr-2" />
                            Download All Resources
                          </Button>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-800">
                    <CardHeader>
                      <CardTitle>Certificate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Complete this module to earn your certificate
                      </p>
                      <Button 
                        className="w-full" 
                        disabled={moduleProgress < 100}
                        onClick={() => {
                          if (moduleProgress >= 100) {
                            toast({
                              title: "Certificate Generated",
                              description: "Your certificate has been generated and added to your profile",
                            });
                          }
                        }}
                      >
                        <GraduationCap className="h-4 w-4 mr-2" />
                        {moduleProgress >= 100 ? "Generate Certificate" : "Complete Module First"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Videos Tab Content */}
            <TabsContent value="videos">
              <Card className="border-gray-800">
                <CardHeader>
                  <CardTitle>Video Lessons</CardTitle>
                  <CardDescription>
                    Watch all video lessons to build your knowledge
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {content
                      .filter(lesson => lesson.type === 'video')
                      .map(lesson => (
                        <div key={lesson.id} className="space-y-4">
                          {/* Training Video Player Component with the provided video template */}
                          <TrainingVideoPlayer
                            title={lesson.title}
                            description={lesson.description}
                          />
                          
                          <div className="flex justify-between items-center">
                            <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30">
                              {lesson.duration}
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => completedLessons.includes(lesson.id) ? null : completeLesson(lesson.id)}
                              disabled={completedLessons.includes(lesson.id)}
                              className={completedLessons.includes(lesson.id) ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {completedLessons.includes(lesson.id) ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Completed
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Mark as Completed
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Readings Tab Content */}
            <TabsContent value="readings">
              <Card className="border-gray-800">
                <CardHeader>
                  <CardTitle>Reading Materials</CardTitle>
                  <CardDescription>
                    Study the reading materials to deepen your understanding
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {content
                      .filter(lesson => lesson.type === 'reading')
                      .map(lesson => (
                        <Card key={lesson.id} className="border-gray-800">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{lesson.title}</CardTitle>
                              <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30">
                                {lesson.duration}
                              </Badge>
                            </div>
                            <CardDescription>{lesson.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* Display different reading content components based on the lesson ID */}
                            {lesson.id === 'c17-cargo-bay-layout' && <C17CargoBayLayout />}
                            {lesson.id === 'kc30a-cargo-systems' && <KC30ACargoBaySystems />}
                            {lesson.id === 'c130-cargo-configurations' && <C130CargoConfigurations />}
                            {lesson.id === 'c27j-operations' && <C27JOperations />}
                            
                            {/* Fallback if none of the specific components match */}
                            {!['c17-cargo-bay-layout', 'kc30a-cargo-systems', 'c130-cargo-configurations', 'c27j-operations'].includes(lesson.id) && (
                              <p className="text-sm text-muted-foreground">
                                {lesson.content}
                              </p>
                            )}
                          </CardContent>
                          <CardFooter className="flex justify-end">
                            <Button 
                              variant="outline"
                              className="mr-2"
                              onClick={() => {
                                toast({
                                  title: "Reading downloaded",
                                  description: "Material is now available offline",
                                });
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button 
                              onClick={() => completedLessons.includes(lesson.id) ? null : completeLesson(lesson.id)}
                              disabled={completedLessons.includes(lesson.id)}
                              className={completedLessons.includes(lesson.id) ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {completedLessons.includes(lesson.id) ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Completed
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Mark as Read
                                </>
                              )}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interactive Tab Content */}
            <TabsContent value="interactive">
              <Card className="border-gray-800">
                <CardHeader>
                  <CardTitle>Interactive Exercises</CardTitle>
                  <CardDescription>
                    Practice your skills with these interactive exercises
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {content
                      .filter(lesson => lesson.type === 'interactive')
                      .map(lesson => (
                        <Card key={lesson.id} className="border-gray-800">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{lesson.title}</CardTitle>
                              <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30">
                                {lesson.duration}
                              </Badge>
                            </div>
                            <CardDescription>{lesson.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* Show custom interactive content for the specific aircraft modules */}
                            {(module.id === "c17-basics" && lesson.id === "c17-basics-3") ? (
                              <div className="bg-card border border-gray-800/30 rounded-lg p-6">
                                <C17BasicsInteractive />
                                <div className="mt-6 pt-4 border-t border-gray-800/30 flex justify-center">
                                  <Button 
                                    onClick={() => completedLessons.includes(lesson.id) ? null : completeLesson(lesson.id)}
                                    disabled={completedLessons.includes(lesson.id)}
                                    className={completedLessons.includes(lesson.id) ? "bg-green-600 hover:bg-green-700" : ""}
                                  >
                                    {completedLessons.includes(lesson.id) ? (
                                      <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Completed
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Mark Complete
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ) : (module.id === "kc30a-basics" && lesson.id === "kc30a-basics-3") ? (
                              <div className="bg-card border border-gray-800/30 rounded-lg p-6">
                                <KC30ABasicsInteractive />
                                <div className="mt-6 pt-4 border-t border-gray-800/30 flex justify-center">
                                  <Button 
                                    onClick={() => completedLessons.includes(lesson.id) ? null : completeLesson(lesson.id)}
                                    disabled={completedLessons.includes(lesson.id)}
                                    className={completedLessons.includes(lesson.id) ? "bg-green-600 hover:bg-green-700" : ""}
                                  >
                                    {completedLessons.includes(lesson.id) ? (
                                      <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Completed
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Mark Complete
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ) : (module.id === "c130-basics" && lesson.id === "c130-basics-3") ? (
                              <div className="bg-card border border-gray-800/30 rounded-lg p-6">
                                <C130BasicsInteractive />
                                <div className="mt-6 pt-4 border-t border-gray-800/30 flex justify-center">
                                  <Button 
                                    onClick={() => completedLessons.includes(lesson.id) ? null : completeLesson(lesson.id)}
                                    disabled={completedLessons.includes(lesson.id)}
                                    className={completedLessons.includes(lesson.id) ? "bg-green-600 hover:bg-green-700" : ""}
                                  >
                                    {completedLessons.includes(lesson.id) ? (
                                      <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Completed
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Mark Complete
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ) : (module.id === "c27j-basics" && lesson.id === "c27j-basics-3") ? (
                              <div className="bg-card border border-gray-800/30 rounded-lg p-6">
                                <C27JBasicsInteractive />
                                <div className="mt-6 pt-4 border-t border-gray-800/30 flex justify-center">
                                  <Button 
                                    onClick={() => completedLessons.includes(lesson.id) ? null : completeLesson(lesson.id)}
                                    disabled={completedLessons.includes(lesson.id)}
                                    className={completedLessons.includes(lesson.id) ? "bg-green-600 hover:bg-green-700" : ""}
                                  >
                                    {completedLessons.includes(lesson.id) ? (
                                      <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Completed
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Mark Complete
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-800/20 border border-gray-800/30 rounded-lg p-6 text-center">
                                <ListChecks className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground mb-4">
                                  Interactive exercise content would be displayed here
                                </p>
                                <Button 
                                  onClick={() => completedLessons.includes(lesson.id) ? null : completeLesson(lesson.id)}
                                  disabled={completedLessons.includes(lesson.id)}
                                  className={completedLessons.includes(lesson.id) ? "bg-green-600 hover:bg-green-700" : ""}
                                >
                                  {completedLessons.includes(lesson.id) ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Completed
                                    </>
                                  ) : (
                                    <>
                                      <ListChecks className="h-4 w-4 mr-2" />
                                      Start Exercise
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quizzes Tab Content */}
            <TabsContent value="quizzes">
              <Card className="border-gray-800">
                <CardHeader>
                  <CardTitle>Assessment Quizzes</CardTitle>
                  <CardDescription>
                    Test your knowledge with these quizzes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {content
                      .filter(lesson => lesson.type === 'quiz')
                      .map(lesson => (
                        <Card key={lesson.id} className="border-gray-800">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{lesson.title}</CardTitle>
                              <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30">
                                {lesson.duration}
                              </Badge>
                            </div>
                            <CardDescription>{lesson.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* Show specific quiz component based on module ID */}
                            {(module.id === "c17-basics" && lesson.id === "c17-basics-5") ? (
                              <div className="border border-gray-800/30 rounded-lg">
                                {completedLessons.includes(lesson.id) ? (
                                  <div className="bg-gray-800/20 p-6 text-center">
                                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-md">
                                      <p className="text-green-500 font-medium">Quiz passed successfully!</p>
                                      <p className="text-sm text-green-500/80 mt-1">You've completed this assessment.</p>
                                    </div>
                                  </div>
                                ) : (
                                  <C17BasicsQuiz />
                                )}
                              </div>
                            ) : (module.id === "kc30a-basics" && lesson.id === "kc30a-basics-5") ? (
                              <div className="border border-gray-800/30 rounded-lg">
                                {completedLessons.includes(lesson.id) ? (
                                  <div className="bg-gray-800/20 p-6 text-center">
                                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-md">
                                      <p className="text-green-500 font-medium">Quiz passed successfully!</p>
                                      <p className="text-sm text-green-500/80 mt-1">You've completed this assessment.</p>
                                    </div>
                                  </div>
                                ) : (
                                  <KC30ABasicsQuiz />
                                )}
                              </div>
                            ) : (module.id === "c130-basics" && lesson.id === "c130-basics-5") ? (
                              <div className="border border-gray-800/30 rounded-lg">
                                {completedLessons.includes(lesson.id) ? (
                                  <div className="bg-gray-800/20 p-6 text-center">
                                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-md">
                                      <p className="text-green-500 font-medium">Quiz passed successfully!</p>
                                      <p className="text-sm text-green-500/80 mt-1">You've completed this assessment.</p>
                                    </div>
                                  </div>
                                ) : (
                                  <C130BasicsQuiz />
                                )}
                              </div>
                            ) : (module.id === "c27j-basics" && lesson.id === "c27j-basics-5") ? (
                              <div className="border border-gray-800/30 rounded-lg">
                                {completedLessons.includes(lesson.id) ? (
                                  <div className="bg-gray-800/20 p-6 text-center">
                                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-md">
                                      <p className="text-green-500 font-medium">Quiz passed successfully!</p>
                                      <p className="text-sm text-green-500/80 mt-1">You've completed this assessment.</p>
                                    </div>
                                  </div>
                                ) : (
                                  <C27JBasicsQuiz />
                                )}
                              </div>
                            ) : (
                              <div className="bg-gray-800/20 border border-gray-800/30 rounded-lg p-6 text-center">
                                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                  Complete all readings and videos before taking this quiz
                                </p>
                                {completedLessons.includes(lesson.id) && (
                                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-md text-left">
                                    <p className="text-green-500 font-medium">Quiz passed successfully!</p>
                                    <p className="text-sm text-green-500/80">Score: 85%</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="flex justify-end">
                            <Button 
                              onClick={() => completedLessons.includes(lesson.id) ? null : completeLesson(lesson.id)}
                              disabled={completedLessons.includes(lesson.id)}
                              className={completedLessons.includes(lesson.id) ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {completedLessons.includes(lesson.id) ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Completed
                                </>
                              ) : (
                                <>
                                  <GraduationCap className="h-4 w-4 mr-2" />
                                  Start Quiz
                                </>
                              )}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}