import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Document, Scenario, DocumentSubmission, ScenarioSubmission } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, ClipboardList, Layers, FileCheck, BookOpen, 
  GraduationCap, PenTool, Lightbulb, BarChart2, Award, UserCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export default function InstructorsPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSquadron, setSelectedSquadron] = useState<string>("AMG");

  // Welcome toast for new instructors (optional)
  useEffect(() => {
    if (user && !sessionStorage.getItem('instructorWelcomed')) {
      sessionStorage.setItem('instructorWelcomed', 'true');
      toast({
        title: "Welcome to the Instructors Portal",
        description: "You can create and manage training scenarios here",
      });
    }
  }, [user, toast]);

  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: scenarios } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
    refetchInterval: 2000, // Refetch every 2 seconds
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });

  const { data: documentSubmissions } = useQuery<DocumentSubmission[]>({
    queryKey: ["/api/document-submissions"],
    enabled: !!user,
  });

  const { data: scenarioSubmissions } = useQuery<ScenarioSubmission[]>({
    queryKey: ["/api/scenario-submissions"],
    enabled: !!user,
  });
  
  // Calculate total submissions shown based on squadron filter
  const filteredCount = selectedSquadron === "AMG"
    ? documentSubmissions?.length || 0
    : documentSubmissions?.filter(submission => {
        // Since document submissions don't have squadron info yet, we only show AMG
        return selectedSquadron === "AMG";
      }).length || 0;

  return (
    <>
      <Helmet>
        <title>Instructors Portal - LOADMworkflow</title>
        <meta name="description" content="Instructors portal for LOADMworkflow - create, edit and manage training scenarios" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold mb-2 text-foreground">Instructors Portal</h2>
          <p className="text-muted-foreground">
            Welcome to the instructor management portal. You can create, edit, and manage 
            training scenarios to support loadmaster training and assessments.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Scenarios</CardTitle>
              <GraduationCap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scenarios?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Training scenarios available</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Student Attempts</CardTitle>
              <Layers className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scenarioSubmissions?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total scenarios attempted</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Document templates</p>
            </CardContent>
          </Card>
          
          {/* Squadron Selection Dropdown */}
          <div className="relative mb-2">
            <Select 
              value={selectedSquadron} 
              onValueChange={setSelectedSquadron}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Squadron" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AMG">AMG</SelectItem>
                <SelectItem value="33SQN">33SQN</SelectItem>
                <SelectItem value="35SQN">35SQN</SelectItem>
                <SelectItem value="36SQN">36SQN</SelectItem>
                <SelectItem value="37SQN">37SQN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Submissions</CardTitle>
              <FileCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredCount}</div>
              <p className="text-xs text-muted-foreground">Total forms completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <h3 className="text-xl font-semibold mb-4 text-foreground">Scenario Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Create Scenarios</CardTitle>
                <PenTool className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Design new training scenarios and quizzes</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Create custom training scenarios with multiple-choice questions and automatic scoring
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/scenarios/create">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  Create New Scenario
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Manage Scenarios</CardTitle>
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Edit, update or delete training scenarios</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Modify existing training scenarios, update questions, and manage scenario content
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/scenarios">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  Manage Scenarios
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Student Progress</CardTitle>
                <BarChart2 className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>View student performance and results</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Track student progress, analyze performance metrics, and identify improvement areas
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/student-progress">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  View Student Progress
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          {/* Workforce Analytics Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Workforce Analytics</CardTitle>
                <BarChart2 className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Track student performance</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Performance Analytics - Track student performance across scenarios. View comprehensive statistics and progress data.
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/student-progress?tab=analytics">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  View Analytics
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Additional Resources */}
        <h3 className="text-xl font-semibold mb-4 text-foreground">Instructor Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Teaching Materials</CardTitle>
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Access instructor resources and guides</CardDescription>
            </CardHeader>
            <CardContent className="h-24 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Reference materials to help create effective training scenarios
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/resources">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  Access Resources
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Best Practices</CardTitle>
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Learn scenario design techniques</CardDescription>
            </CardHeader>
            <CardContent className="h-24 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Guidelines for creating effective assessment questions
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/best-practices">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  View Best Practices
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}