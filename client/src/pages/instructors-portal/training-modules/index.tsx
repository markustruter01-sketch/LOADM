import { useState } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plane, 
  ArrowLeft, 
  BookOpen, 
  Star, 
  GraduationCap,
  BarChart2,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { aircraftConfigs } from "@/utils/aircraft-config";

type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  aircraft: string;
  difficulty: DifficultyLevel;
  duration: string;
  topics: string[];
  objectives: string[];
  content?: string;
  videoUrl?: string;
  isActive: boolean;
  createdBy?: string;
  lastModified?: string;
}

// Initial training modules data
const initialTrainingModules: TrainingModule[] = [
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
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
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

export default function TrainingModulesManagement() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  interface FormData {
    title: string;
    description: string;
    aircraft: string;
    difficulty: DifficultyLevel;
    duration: string;
    topicsString: string;
    objectivesString: string;
    content: string;
    videoUrl: string;
    isActive: boolean;
    // Enhanced content sections
    overviewContent: string;
    readingContent: string;
    interactiveContent: string;
    videoContent: string;
    quizContent: string;
    videoUrls: string[];
    learningObjectives: string[];
    prerequisites: string;
    resources: string;
  }

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    aircraft: "c17",
    difficulty: "beginner",
    duration: "",
    topicsString: "",
    objectivesString: "",
    content: "",
    videoUrl: "",
    isActive: true,
    overviewContent: "",
    readingContent: "",
    interactiveContent: "",
    videoContent: "",
    quizContent: "",
    videoUrls: [],
    learningObjectives: [],
    prerequisites: "",
    resources: ""
  });

  // For now, we'll use local state. In production, this would be API calls
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>(initialTrainingModules);

  // Filter modules based on selected aircraft and squadron
  const filteredModules = activeTab === "all" 
    ? trainingModules 
    : trainingModules.filter(module => module.aircraft === activeTab);

  const handleCreateModule = () => {
    const newModule: TrainingModule = {
      id: `${formData.aircraft}-${Date.now()}`,
      title: formData.title || "",
      description: formData.description || "",
      aircraft: formData.aircraft || "c17",
      difficulty: formData.difficulty || "beginner",
      duration: formData.duration || "",
      topics: (formData.topicsString || "").split(",").map(t => t.trim()).filter(Boolean),
      objectives: (formData.objectivesString || "").split(",").map(o => o.trim()).filter(Boolean),
      content: formData.content || "",
      videoUrl: formData.videoUrl || "",
      createdBy: "Current User",
      lastModified: new Date().toISOString().split('T')[0],
      isActive: true
    };

    setTrainingModules(prev => [...prev, newModule]);
    setIsCreateDialogOpen(false);
    resetForm();
    
    toast({
      title: "Module Created",
      description: `Training module "${newModule.title}" has been created successfully.`,
    });
  };

  const handleEditModule = () => {
    if (!selectedModule) return;

    const updatedModule: TrainingModule = {
      ...selectedModule,
      title: formData.title,
      description: formData.description,
      aircraft: formData.aircraft,
      difficulty: formData.difficulty,
      duration: formData.duration,
      topics: formData.topicsString.split(",").map(t => t.trim()).filter(Boolean),
      objectives: formData.objectivesString.split(",").map(o => o.trim()).filter(Boolean),
      content: formData.content,
      videoUrl: formData.videoUrl,
      isActive: formData.isActive,
      lastModified: new Date().toISOString().split('T')[0]
    };

    setTrainingModules(prev => prev.map(module => 
      module.id === selectedModule.id ? updatedModule : module
    ));
    setIsEditDialogOpen(false);
    setSelectedModule(null);
    resetForm();
    
    toast({
      title: "Module Updated",
      description: `Training module "${updatedModule.title}" has been updated successfully.`,
    });
  };

  const handleDeleteModule = (moduleId: string) => {
    setTrainingModules(prev => prev.filter(module => module.id !== moduleId));
    
    toast({
      title: "Module Deleted",
      description: "Training module has been deleted successfully.",
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      aircraft: "c17",
      difficulty: "beginner",
      duration: "",
      topicsString: "",
      objectivesString: "",
      content: "",
      videoUrl: "",
      isActive: true,
      overviewContent: "",
      readingContent: "",
      interactiveContent: "",
      videoContent: "",
      quizContent: "",
      videoUrls: [],
      learningObjectives: [],
      prerequisites: "",
      resources: ""
    });
  };

  const openEditDialog = (module: TrainingModule) => {
    setSelectedModule(module);
    setFormData({
      title: module.title,
      description: module.description,
      aircraft: module.aircraft,
      difficulty: module.difficulty,
      duration: module.duration,
      topicsString: module.topics.join(", "),
      objectivesString: module.objectives.join(", "),
      content: module.content || "",
      videoUrl: module.videoUrl || "",
      isActive: module.isActive,
      overviewContent: module.content || "",
      readingContent: "",
      interactiveContent: "",
      videoContent: "",
      quizContent: "",
      videoUrls: module.videoUrl ? [module.videoUrl] : [],
      learningObjectives: module.objectives,
      prerequisites: "",
      resources: ""
    });
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Training Module Management | Instructors Portal</title>
        <meta name="description" content="Create and manage aircraft-specific training modules for loadmaster training" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/instructors-portal')}
                className="p-2 -ml-2"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Instructors Portal
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-7 w-7 text-orange-500" />
                  <h1 className="text-3xl font-bold text-foreground">
                    Training Module Management
                  </h1>
                </div>
                <p className="text-muted-foreground max-w-3xl">
                  Create, edit, and manage aircraft-specific training modules. Organize content by squadron preferences and difficulty levels to provide comprehensive loadmaster training.
                </p>
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Module
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Training Module</DialogTitle>
                    <DialogDescription>
                      Create a new aircraft-specific training module with content and assessments.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Module Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter module title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter module description"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="aircraft">Aircraft Type</Label>
                        <Select 
                          value={formData.aircraft} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, aircraft: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select aircraft" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="c17">C-17 Globemaster</SelectItem>
                            <SelectItem value="c130">C-130 Hercules</SelectItem>
                            <SelectItem value="kc30a">KC30-A Airbus</SelectItem>
                            <SelectItem value="c27j">C-27J Spartan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="difficulty">Difficulty Level</Label>
                        <Select 
                          value={formData.difficulty} 
                          onValueChange={(value: DifficultyLevel) => setFormData(prev => ({ ...prev, difficulty: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="e.g., 45 minutes"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="topics">Topics (comma-separated)</Label>
                      <Input
                        id="topics"
                        value={formData.topicsString}
                        onChange={(e) => setFormData(prev => ({ ...prev, topicsString: e.target.value }))}
                        placeholder="Topic 1, Topic 2, Topic 3"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="objectives">Learning Objectives (comma-separated)</Label>
                      <Textarea
                        id="objectives"
                        value={formData.objectivesString}
                        onChange={(e) => setFormData(prev => ({ ...prev, objectivesString: e.target.value }))}
                        placeholder="Objective 1, Objective 2, Objective 3"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="videoUrl">Video URL (optional)</Label>
                      <Input
                        id="videoUrl"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                        placeholder="https://example.com/video"
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateModule} className="bg-primary hover:bg-primary/90 text-white">
                      Create Module
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </section>

          {/* Squadron Selection Tabs */}
          <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
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

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredModules.length}</div>
                <p className="text-xs text-muted-foreground">
                  {activeTab === "all" ? "All aircraft" : `${activeTab.toUpperCase()} modules`}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredModules.filter(m => m.isActive).length}</div>
                <p className="text-xs text-muted-foreground">Currently available</p>
              </CardContent>
            </Card>
            
            <Card className="border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Difficulty Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{new Set(filteredModules.map(m => m.difficulty)).size}</div>
                <p className="text-xs text-muted-foreground">Available levels</p>
              </CardContent>
            </Card>
            
            <Card className="border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">Today</div>
                <p className="text-xs text-muted-foreground">Recent modifications</p>
              </CardContent>
            </Card>
          </div>

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
                  <div className="flex flex-wrap gap-1 mb-3">
                    {module.topics.slice(0, 3).map((topic, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-gray-800/30 text-gray-400">
                        {topic}
                      </Badge>
                    ))}
                    {module.topics.length > 3 && (
                      <Badge variant="secondary" className="text-xs bg-gray-800/30 text-gray-400">
                        +{module.topics.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    <div>Created by: {module.createdBy}</div>
                    <div>Last modified: {module.lastModified}</div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/training-modules/${module.id}`)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(module)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteModule(module.id)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Enhanced Full-Screen Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-xl">Edit Training Module: {selectedModule?.title}</DialogTitle>
                <DialogDescription>
                  Comprehensive content editing for all training module sections
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="overview" className="flex-1 flex flex-col h-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                    Videos
                  </TabsTrigger>
                  <TabsTrigger value="readings" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                    Readings
                  </TabsTrigger>
                  <TabsTrigger value="interactive" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                    Interactive
                  </TabsTrigger>
                  <TabsTrigger value="quizzes" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                    Quizzes
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="flex-1 space-y-4 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-title">Module Title</Label>
                        <Input
                          id="edit-title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter module title"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea
                          id="edit-description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter module description"
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-aircraft">Aircraft Type</Label>
                          <Select 
                            value={formData.aircraft} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, aircraft: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select aircraft" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="c17">C-17 Globemaster</SelectItem>
                              <SelectItem value="c130">C-130 Hercules</SelectItem>
                              <SelectItem value="kc30a">KC30-A Airbus</SelectItem>
                              <SelectItem value="c27j">C-27J Spartan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="edit-difficulty">Difficulty Level</Label>
                          <Select 
                            value={formData.difficulty} 
                            onValueChange={(value: DifficultyLevel) => setFormData(prev => ({ ...prev, difficulty: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-duration">Duration</Label>
                        <Input
                          id="edit-duration"
                          value={formData.duration}
                          onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                          placeholder="e.g., 45 minutes"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-prerequisites">Prerequisites</Label>
                        <Textarea
                          id="edit-prerequisites"
                          value={formData.prerequisites}
                          onChange={(e) => setFormData(prev => ({ ...prev, prerequisites: e.target.value }))}
                          placeholder="Required knowledge or previous modules"
                          rows={2}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-topics">Topics (comma-separated)</Label>
                        <Textarea
                          id="edit-topics"
                          value={formData.topicsString}
                          onChange={(e) => setFormData(prev => ({ ...prev, topicsString: e.target.value }))}
                          placeholder="Topic 1, Topic 2, Topic 3"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-objectives">Learning Objectives</Label>
                        <Textarea
                          id="edit-objectives"
                          value={formData.objectivesString}
                          onChange={(e) => setFormData(prev => ({ ...prev, objectivesString: e.target.value }))}
                          placeholder="Objective 1, Objective 2, Objective 3"
                          rows={4}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-resources">Additional Resources</Label>
                        <Textarea
                          id="edit-resources"
                          value={formData.resources}
                          onChange={(e) => setFormData(prev => ({ ...prev, resources: e.target.value }))}
                          placeholder="Additional learning materials, manuals, references"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-overview-content">Overview Content</Label>
                    <Textarea
                      id="edit-overview-content"
                      value={formData.overviewContent}
                      onChange={(e) => setFormData(prev => ({ ...prev, overviewContent: e.target.value }))}
                      placeholder="Detailed overview content for this training module..."
                      rows={8}
                      className="w-full"
                    />
                  </div>
                </TabsContent>

                {/* Videos Tab */}
                <TabsContent value="videos" className="flex-1 space-y-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-video-content">Video Content Description</Label>
                      <Textarea
                        id="edit-video-content"
                        value={formData.videoContent}
                        onChange={(e) => setFormData(prev => ({ ...prev, videoContent: e.target.value }))}
                        placeholder="Describe the video content, key points covered, and learning outcomes..."
                        rows={6}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-video-urls">Video URLs (one per line)</Label>
                      <Textarea
                        id="edit-video-urls"
                        value={formData.videoUrls.join('\n')}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          videoUrls: e.target.value.split('\n').filter(url => url.trim()) 
                        }))}
                        placeholder="https://example.com/video1&#10;https://example.com/video2"
                        rows={8}
                      />
                    </div>
                    
                    <div className="bg-gray-800/20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Video Guidelines:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Use YouTube, Vimeo, or direct video file URLs</li>
                        <li>• Ensure videos are accessible to military personnel</li>
                        <li>• Include captions for accessibility compliance</li>
                        <li>• Video duration should align with module timing</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                {/* Readings Tab */}
                <TabsContent value="readings" className="flex-1 space-y-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-reading-content">Reading Material Content</Label>
                      <Textarea
                        id="edit-reading-content"
                        value={formData.readingContent}
                        onChange={(e) => setFormData(prev => ({ ...prev, readingContent: e.target.value }))}
                        placeholder="Enter comprehensive reading material content. Use markdown formatting for structure..."
                        rows={20}
                        className="font-mono text-sm"
                      />
                    </div>
                    
                    <div className="bg-gray-800/20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Reading Content Guidelines:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Use clear headings and subheadings</li>
                        <li>• Include relevant diagrams and illustrations references</li>
                        <li>• Reference official military publications when applicable</li>
                        <li>• Structure content progressively from basic to advanced concepts</li>
                        <li>• Include real-world examples and case studies</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                {/* Interactive Tab */}
                <TabsContent value="interactive" className="flex-1 space-y-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-interactive-content">Interactive Content</Label>
                      <Textarea
                        id="edit-interactive-content"
                        value={formData.interactiveContent}
                        onChange={(e) => setFormData(prev => ({ ...prev, interactiveContent: e.target.value }))}
                        placeholder="Define interactive exercises, simulations, drag-and-drop activities, or hands-on practice scenarios..."
                        rows={12}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-800/20 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Interactive Types:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Load planning simulations</li>
                          <li>• Weight & balance calculators</li>
                          <li>• Drag-and-drop cargo exercises</li>
                          <li>• 3D aircraft visualization</li>
                          <li>• Safety procedure walkthroughs</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-800/20 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Implementation Notes:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Ensure mobile compatibility</li>
                          <li>• Include progress tracking</li>
                          <li>• Provide immediate feedback</li>
                          <li>• Allow multiple attempts</li>
                          <li>• Save progress automatically</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Quizzes Tab */}
                <TabsContent value="quizzes" className="flex-1 space-y-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-quiz-content">Quiz Content & Questions</Label>
                      <Textarea
                        id="edit-quiz-content"
                        value={formData.quizContent}
                        onChange={(e) => setFormData(prev => ({ ...prev, quizContent: e.target.value }))}
                        placeholder="Define quiz questions, multiple choice options, correct answers, and explanations..."
                        rows={15}
                        className="font-mono text-sm"
                      />
                    </div>
                    
                    <div className="bg-gray-800/20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Quiz Format Example:</h4>
                      <pre className="text-xs text-muted-foreground bg-gray-900/50 p-3 rounded overflow-x-auto">
{`Question 1: What is the maximum cargo weight for C-17?
A) 170,900 lbs
B) 169,000 lbs  
C) 171,000 lbs
D) 168,500 lbs
Correct: A
Explanation: The C-17 maximum payload is 170,900 lbs...

Question 2: Which pallet position affects CG most?
A) Position 1
B) Position 2
C) Position 3
D) Position 4
Correct: A
Explanation: Forward positions have greater impact...`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditModule} className="bg-primary hover:bg-primary/90 text-white">
                  Update Training Module
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}