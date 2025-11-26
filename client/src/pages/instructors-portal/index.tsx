import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Document, Scenario, DocumentSubmission, ScenarioSubmission } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, ClipboardList, Layers, FileCheck, BookOpen, 
  GraduationCap, PenTool, Lightbulb, BarChart2, Award, UserCircle,
  HelpCircle, Users, ArrowLeft, Edit, CheckSquare
} from "lucide-react";
import { useIsolatedAuth } from "../../auth-isolated/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
export default function InstructorsPortal() {
  const { user } = useIsolatedAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Remove the automatic redirect - superadmins should be able to access instructor portal
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
    <div>
      <Helmet>
        <title>Instructors Portal - LOADMworkflow</title>
        <meta name="description" content="Instructors portal for LOADMworkflow - create, edit and manage training scenarios" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        {/* Back Button */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold mb-2 text-foreground">Instructors Portal</h2>
          <p className="text-muted-foreground">
            Welcome to the instructor management portal. You can create, edit, and manage 
            training scenarios to support loadmaster training and assessments.
          </p>
        </div>

        {/* Comprehensive Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Training Scenarios</CardTitle>
              <GraduationCap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scenarios?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Available scenarios</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Scenario Submissions</CardTitle>
              <Layers className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scenarioSubmissions?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Student attempts</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pop Quizzes</CardTitle>
              <HelpCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(scenarioSubmissions?.filter(sub => (sub.score || 0) >= 70).length || 0)}</div>
              <p className="text-xs text-muted-foreground">Quiz assessments</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(scenarioSubmissions?.length || 0) > 0 
                  ? Math.round(((scenarioSubmissions?.filter(sub => sub.passed === true).length || 0) / (scenarioSubmissions?.length || 1)) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Student success rate</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <BarChart2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const submissionsWithScores = scenarioSubmissions?.filter(sub => sub.score !== null && sub.score !== undefined) || [];
                  return submissionsWithScores.length > 0 
                    ? Math.round(submissionsWithScores.reduce((sum, sub) => sum + (sub.score || 0), 0) / submissionsWithScores.length)
                    : 0;
                })()}%
              </div>
              <p className="text-xs text-muted-foreground">Overall performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Squadron Performance Breakdown */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Squadron Performance Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {['All Units', '33 Squadron', '35 Squadron', '36 Squadron', '37 Squadron'].map(squadron => {
              const squadronSubmissions = scenarioSubmissions?.filter(sub => {
                if (squadron === 'All Units') return true;
                
                // Handle different squadron formats: "33 Squadron", "33", "33SQN", "37SQN", etc.
                const squadronNumber = squadron.split(' ')[0]; // Extract "33" from "33 Squadron"
                const userSquadron = (sub.squadron || '').toString();
                
                // Comprehensive squadron matching
                return userSquadron.includes(squadronNumber) || 
                       userSquadron === squadron ||
                       userSquadron === squadronNumber ||
                       userSquadron === `${squadronNumber}SQN` ||
                       userSquadron.startsWith(squadronNumber);
              }) || [];
              const squadronPassed = squadronSubmissions.filter(sub => sub.passed === true).length;
              const squadronPassRate = squadronSubmissions.length > 0 ? Math.round((squadronPassed / squadronSubmissions.length) * 100) : 0;
              
              return (
                <Card key={squadron} className="bg-card hover:bg-card/90 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{squadron}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{squadronSubmissions.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {squadronPassRate}% pass rate
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Management Tools */}
        <h3 className="text-xl font-semibold mb-4 text-foreground">Management Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
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
                <CardTitle className="text-lg">Student Submissions</CardTitle>
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Review and grade all student work</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Access all {scenarioSubmissions?.length || 0} submissions with grading tools and feedback systems
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/submissions">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  Review Submissions
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          {/* Checklist Management Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Checklist Management</CardTitle>
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Create and manage aircraft operation checklists</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Design digital checklists for aircraft operations that students can complete with tickbox tracking
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/checklist-management">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  Manage Checklists
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Pop Quizzes Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pop Quizzes</CardTitle>
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Create and manage quick knowledge tests</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Create randomized knowledge check quizzes from a library of loadmaster-specific questions to test student knowledge
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/quizzes">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  Create Pop Quiz
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Pop Quiz Questions Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pop Quiz Questions</CardTitle>
                <Edit className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Edit question bank and answers</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Manage the question library used for pop quizzes, including correct and incorrect answer options
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/quiz-questions">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  Edit Quiz Questions
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Training Module Management Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Training Modules</CardTitle>
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Create and manage aircraft training content</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Create, edit, and manage aircraft-specific training modules with reading content, videos, and assessments
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/training-modules">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  Manage Training Modules
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Workforce Management Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Workforce</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Squadron Personnel Management</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                View squadron personnel, track individual student progress, and review recent submissions by squadron members.
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/workforce">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  View Workforce
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Advanced Analytics Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Advanced Analytics</CardTitle>
                <BarChart2 className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>Comprehensive Performance Metrics</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Analyze performance across all assessment types, track squadron-specific progress, and view detailed training metrics.
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/analytics">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  Workforce Performance Analytics
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Workforce Analytics Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors border-orange-500/30" data-testid="card-workforce-analytics">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Workforce Analytics</CardTitle>
                <BarChart2 className="h-5 w-5 text-orange-500" />
              </div>
              <CardDescription>Flight Hours, Currency & Readiness</CardDescription>
            </CardHeader>
            <CardContent className="h-28 flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                Track flight hours by aircraft, monitor currency expirations, squadron readiness status, and safety compliance across the workforce.
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/instructors-portal/workforce-analytics">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" data-testid="button-workforce-analytics">
                  View Workforce Analytics
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
    </div>
  );
}