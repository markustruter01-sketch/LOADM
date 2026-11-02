import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Document, Scenario, DocumentSubmission, ScenarioSubmission } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  FileText, ClipboardList, Layers, FileCheck, BookOpen, 
  GraduationCap, PenTool, Lightbulb, BarChart2, Award, UserCircle,
  HelpCircle, Users, ArrowLeft, Edit, CheckSquare, FileUser
} from "lucide-react";
import { UserReportModal } from "@/components/UserReportModal";
import { DataAuditModal, DataAuditButton } from "@/components/DataAuditModal";
import { useIsolatedAuth } from "../../auth-isolated/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import instructorBannerImage from "@assets/unnamed (1)_1764542553672.jpg";
import ddgLogoImage from "@assets/ddg-logo.png";
export default function InstructorsPortal() {
  const { user } = useIsolatedAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [selectedSquadron, setSelectedSquadron] = useState<string>("ALL");
  const [isMottoModalOpen, setIsMottoModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

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

  const { data: squadronPersonnelCounts } = useQuery<Array<{ squadron: string; total: string; loadmasters: string; instructors: string }>>({
    queryKey: ["/api/workforce/squadron-personnel-counts"],
    enabled: !!user,
  });

  // Calculate total submissions shown based on squadron filter
  // Document submissions don't yet carry squadron info, so they only appear under "All Squadrons"
  const filteredCount = selectedSquadron === "ALL"
    ? documentSubmissions?.length || 0
    : 0;

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
        
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-foreground">Instructors Portal</h2>
        </div>

        {/* DDG Quote with Glassmorphic Frame - Clickable */}
        <div className="flex items-stretch justify-center gap-4 mb-8">
          <button 
            onClick={() => setIsMottoModalOpen(true)}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-sm shadow-black/5 cursor-pointer transition-all duration-300 hover:bg-white/10 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
            data-testid="button-motto"
          >
            <p 
              className="text-sm md:text-base text-foreground/80 tracking-wide"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', fontWeight: 300 }}
            >
              "Decisions in data, assurance in action"
            </p>
            <span 
              className="text-xs md:text-sm text-primary font-normal tracking-widest"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              — DDG
            </span>
          </button>
          
          {/* Data Audit Trail Button */}
          <DataAuditButton onClick={() => setIsAuditModalOpen(true)} className="h-full aspect-square" />
        </div>
        
        {/* Data Audit Modal */}
        <DataAuditModal 
          isOpen={isAuditModalOpen} 
          onClose={() => setIsAuditModalOpen(false)} 
        />

        {/* Motto Explanation Modal */}
        <Dialog open={isMottoModalOpen} onOpenChange={setIsMottoModalOpen}>
          <DialogContent className="max-w-xl min-h-[500px] bg-black/20 backdrop-blur-2xl border border-white/15 shadow-2xl flex flex-col">
            <DialogHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <img 
                  src={ddgLogoImage} 
                  alt="Digital Dynamics Group Logo" 
                  className="h-24 w-auto object-contain"
                  loading="eager"
                />
              </div>
              <DialogTitle 
                className="text-2xl md:text-3xl text-center text-foreground"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
              >
                "Decisions in Data, Assurance in Action"
              </DialogTitle>
              <DialogDescription className="sr-only">DDG Philosophy and Mission Statement</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 text-muted-foreground leading-relaxed px-2 flex-1">
              <p>
                At DDG, we believe that effective leadership begins with clarity. The Instructor Portal was designed to place real-time workforce intelligence directly in your hands—qualification statuses, training progress, flight hour metrics, and readiness trends across your entire team.
              </p>
              <p>
                When you can see the full picture, you can make decisions that are precise, timely, and grounded in fact rather than assumption. Every chart, alert, and analytics tool here is built to help you identify gaps before they become problems.
              </p>
              <p>
                This philosophy extends beyond visibility into action. Forecast qualification renewals, allocate training resources where they'll have the greatest impact, and ensure mission readiness with confidence. Data informs your decisions; decisive action delivers results.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Featured Section Banner */}
        <div className="relative rounded-xl overflow-hidden shadow-xl mb-6 h-64 bg-muted/50" data-testid="instructor-banner">
          <img
            src={instructorBannerImage}
            alt="RAAF loadmaster directing cargo operations"
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center 20%' }}
            loading="eager"
            decoding="async"
            width={1920}
            height={1080}
            fetchpriority="high"
          />
          <div className="gradient-overlay flex items-end">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-2 text-left">
                Training & Assessment Management
              </h3>
              <p className="text-muted-foreground max-w-xl text-left">
                Create scenarios, manage quizzes, track student progress, and analyze performance metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Generate User Report Button - Centered below banner */}
        <div className="flex justify-center mb-10">
          <Button
            onClick={() => setIsReportModalOpen(true)}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg font-semibold transition-all duration-200"
            data-testid="button-generate-user-report"
          >
            <FileUser className="h-5 w-5 mr-3" />
            Generate User Report
          </Button>
        </div>

        {/* User Report Modal */}
        <UserReportModal 
          open={isReportModalOpen} 
          onOpenChange={setIsReportModalOpen} 
        />

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
              const sqnKey = squadron === 'All Units' ? null : squadron.split(' ')[0] + 'SQN'; // e.g. "33SQN"

              // Personnel headcount from the new endpoint
              const personnelRow = sqnKey
                ? squadronPersonnelCounts?.find(r => r.squadron === sqnKey)
                : null;
              const personnelCount = sqnKey
                ? (personnelRow ? parseInt(personnelRow.total) : 0)
                : (squadronPersonnelCounts?.reduce((sum, r) => sum + parseInt(r.total), 0) ?? 0);

              // Submission pass rate (secondary metric)
              const squadronSubmissions = scenarioSubmissions?.filter(sub => {
                if (squadron === 'All Units') return true;
                const squadronNumber = squadron.split(' ')[0];
                const userSquadron = (sub.squadron || '').toString();
                return userSquadron.includes(squadronNumber) ||
                       userSquadron === squadron ||
                       userSquadron === squadronNumber ||
                       userSquadron === `${squadronNumber}SQN` ||
                       userSquadron.startsWith(squadronNumber);
              }) || [];
              const squadronPassed = squadronSubmissions.filter(sub => sub.passed === true).length;
              const squadronPassRate = squadronSubmissions.length > 0
                ? Math.round((squadronPassed / squadronSubmissions.length) * 100)
                : null;

              return (
                <Card key={squadron} className="bg-card hover:bg-card/90 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{squadron}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{personnelCount}</div>
                    <p className="text-xs text-muted-foreground">personnel</p>
                    {squadronPassRate !== null && (
                      <p className="text-xs text-primary mt-1">{squadronPassRate}% pass rate</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Analytics Quick Links - Featured at Top */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Advanced Analytics Card - Large */}
          <Card className="bg-card hover:bg-card/90 transition-colors border-primary/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Workforce Performance Analytics</CardTitle>
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <CardDescription className="text-base">Comprehensive Performance Metrics</CardDescription>
            </CardHeader>
            <CardContent className="py-6">
              <div className="text-center text-muted-foreground">
                Analyze performance across all assessment types, track squadron-specific progress, and view detailed training metrics.
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Link href="/instructors-portal/analytics" className="w-full">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-base font-semibold">
                  Workforce Performance Analytics
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Workforce Analytics Card - Large */}
          <Card className="bg-card hover:bg-card/90 transition-colors border-orange-500/30" data-testid="card-workforce-analytics">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Workforce Health Analytics</CardTitle>
                <BarChart2 className="h-6 w-6 text-orange-500" />
              </div>
              <CardDescription className="text-base">Flight Hours, Currency & Readiness</CardDescription>
            </CardHeader>
            <CardContent className="py-6">
              <div className="text-center text-muted-foreground">
                Track flight hours by aircraft, monitor currency expirations, squadron readiness status, and safety compliance across the workforce.
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Link href="/instructors-portal/workforce-analytics" className="w-full">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-base font-semibold" data-testid="button-workforce-analytics">
                  View Workforce Health Analytics
                </Button>
              </Link>
            </CardFooter>
          </Card>
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
              <Link href="/instructors-portal/student-progress">
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