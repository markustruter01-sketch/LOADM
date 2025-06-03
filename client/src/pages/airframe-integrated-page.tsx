import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Play, CheckCircle, Clock, Plane } from "lucide-react";

// Import the existing pages with their hideHeader prop support
import LoadPlanningSelectionPage from "@/pages/load-planning-selection-page";

export default function AirframeIntegratedPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("load-planning");

  // Check URL parameters to set initial tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'training-modules') {
      setActiveTab('training-modules');
    }
  }, []);

  // These components are rendered differently for wouter routing
  const LoadPlanningContent = () => <LoadPlanningSelectionPage />;
  const trainingModules = [
    {
      id: 'c17-basics',
      title: 'C-17 Globemaster III Basics',
      aircraft: 'C-17',
      type: 'Reading',
      duration: '15 min',
      difficulty: 'Beginner',
      description: 'Introduction to C-17 aircraft specifications, cargo bay layout, and basic loading procedures.',
      completed: false,
      topics: ['Aircraft Overview', 'Cargo Bay Layout', 'Basic Loading', 'Safety Procedures']
    },
    {
      id: 'c130-basics',
      title: 'C-130 Hercules Fundamentals',
      aircraft: 'C-130',
      type: 'Interactive',
      duration: '20 min',
      difficulty: 'Beginner',
      description: 'Learn the fundamentals of C-130 cargo operations and configuration options.',
      completed: true,
      topics: ['Aircraft Specs', 'Cargo Configurations', 'Loading Procedures', 'Weight & Balance']
    },
    {
      id: 'c27j-ops',
      title: 'C-27J Spartan Operations',
      aircraft: 'C-27J',
      type: 'Quiz',
      duration: '10 min',
      difficulty: 'Intermediate',
      description: 'Test your knowledge of C-27J operational procedures and cargo handling.',
      completed: false,
      topics: ['Operational Procedures', 'Cargo Handling', 'Safety Protocols', 'Emergency Procedures']
    },
    {
      id: 'kc30a-systems',
      title: 'KC-30A Cargo Systems',
      aircraft: 'KC-30A',
      type: 'Reading',
      duration: '25 min',
      difficulty: 'Advanced',
      description: 'Comprehensive overview of KC-30A cargo systems and multi-role capabilities.',
      completed: false,
      topics: ['Cargo Systems', 'Multi-role Operations', 'Fuel Systems', 'Advanced Procedures']
    },
    {
      id: 'load-planning-theory',
      title: 'Load Planning Theory',
      aircraft: 'All Aircraft',
      type: 'Interactive',
      duration: '30 min',
      difficulty: 'Intermediate',
      description: 'Master the theoretical foundations of aircraft load planning and weight distribution.',
      completed: false,
      topics: ['Weight & Balance Theory', 'Center of Gravity', 'Load Distribution', 'Safety Margins']
    },
    {
      id: 'cargo-restraint',
      title: 'Cargo Restraint Systems',
      aircraft: 'All Aircraft',
      type: 'Quiz',
      duration: '15 min',
      difficulty: 'Advanced',
      description: 'Advanced cargo restraint techniques and regulatory compliance.',
      completed: true,
      topics: ['Restraint Types', 'Regulations', 'Safety Standards', 'Best Practices']
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Reading': return <BookOpen className="h-4 w-4" />;
      case 'Interactive': return <Play className="h-4 w-4" />;
      case 'Quiz': return <CheckCircle className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const TrainingModulesContent = () => (
    <div className="py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Training Modules</h2>
        <p className="text-muted-foreground">
          Aircraft-specific training modules and course materials to enhance your loadmaster expertise.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trainingModules.map((module) => (
          <Card key={module.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTypeIcon(module.type)}
                  <Badge variant="outline" className={getDifficultyColor(module.difficulty)}>
                    {module.difficulty}
                  </Badge>
                </div>
                {module.completed && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <CardTitle className="text-lg leading-tight">{module.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Plane className="h-3 w-3" />
                  {module.aircraft}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {module.duration}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {module.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {module.topics.map((topic, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-6 bg-muted/30 rounded-lg border border-dashed">
        <div className="text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">More Modules Coming Soon</h3>
          <p className="text-muted-foreground">
            Additional training modules and interactive content are being developed to expand your learning experience.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Airframe - LOADMworkflow</title>
        <meta 
          name="description" 
          content="Access airframe load planning and training modules in an integrated interface." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-6 mb-16">
        <div className="max-w-6xl mx-auto">
          {/* Header with Back Button */}
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="p-2 -ml-2"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Home
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Airframe</h1>
          <p className="text-muted-foreground mb-6">
            Access load planning simulations and training modules for various aircraft
          </p>

          {/* Tab toggle between Load Planning and Training Modules */}
          <Tabs
            defaultValue="load-planning"
            value={activeTab}
            onValueChange={setActiveTab}
            className="mb-6"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="load-planning">Load Planning</TabsTrigger>
              <TabsTrigger value="training-modules">Training Modules</TabsTrigger>
            </TabsList>

            <TabsContent value="load-planning" className="mt-6">
              {/* Reuse the content from the existing load planning page */}
              <div className="pt-2">
                <LoadPlanningContent />
              </div>
            </TabsContent>

            <TabsContent value="training-modules" className="mt-6">
              {/* Reuse the content from the existing training modules page */}
              <div className="pt-2">
                <TrainingModulesContent />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}