import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { 
  Scenario, 
  ScenarioSubmission, 
  Quiz, 
  QuizSubmission,
  Document,
  DocumentSubmission
} from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Area,
  AreaChart,
  ComposedChart
} from "recharts";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon,
  Users,
  Medal,
  Layers,
  CheckCircle,
  XCircle,
  CalendarClock,
  Filter,
  LayoutDashboard,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

// A set of predefined squadrons for filtering
const SQUADRONS = ["33 Squadron", "35 Squadron", "36 Squadron", "37 Squadron"];

// Color constants for charts
const COLORS = {
  primary: "#FF9500",
  secondary: "#6B7280",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  squadrons: {
    "33 Squadron": "#FF9500",
    "35 Squadron": "#10B981",
    "36 Squadron": "#3B82F6",
    "37 Squadron": "#8B5CF6"
  },
  scoreRanges: {
    "0-49%": "#EF4444",
    "50-69%": "#F59E0B",
    "70-89%": "#10B981", 
    "90-100%": "#3B82F6"
  }
};

export default function AdvancedAnalytics() {
  // State for filters
  const [selectedSquadron, setSelectedSquadron] = useState<string>("all");
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [selectedView, setSelectedView] = useState<string>("overview");
  
  // Fetch all data types we need for comprehensive analytics
  const { data: scenarios, isLoading: isLoadingScenarios } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
  });
  
  const { data: scenarioSubmissions, isLoading: isLoadingScenarioSubmissions } = useQuery<ScenarioSubmission[]>({
    queryKey: ["/api/scenario-submissions"],
  });
  
  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });
  
  const { data: quizSubmissions, isLoading: isLoadingQuizSubmissions } = useQuery<QuizSubmission[]>({
    queryKey: ["/api/instructor/quiz-submissions"],
  });
  
  const { data: documents, isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });
  
  const { data: documentSubmissions, isLoading: isLoadingDocumentSubmissions } = useQuery<DocumentSubmission[]>({
    queryKey: ["/api/document-submissions"],
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });
  
  // Derived state for analytics
  const [overviewStats, setOverviewStats] = useState({
    totalStudents: 0,
    totalSubmissions: 0,
    avgScore: 0,
    passRate: 0,
    completionRate: 0,
    squadronBreakdown: [] as { name: string, count: number }[]
  });
  
  const [performanceData, setPerformanceData] = useState({
    scoreDistribution: [] as { range: string, count: number }[],
    squadronPerformance: [] as { squadron: string, avgScore: number, passRate: number, submissions: number }[],
    assessmentTypePerformance: [] as { type: string, avgScore: number, passRate: number, submissions: number }[],
    trendOverTime: [] as { date: string, avgScore: number, submissions: number }[]
  });
  
  // Process the data when it changes or filters change
  useEffect(() => {
    if (
      isLoadingScenarioSubmissions || 
      isLoadingQuizSubmissions || 
      isLoadingDocumentSubmissions
    ) {
      return; // Wait for all data to load
    }
    
    // Combine all submission types for comprehensive analytics
    const allSubmissions = [
      ...(scenarioSubmissions || []).map(sub => ({
        ...sub,
        type: 'scenario',
        // Extract squadron from studentId if it contains format "ID - Squadron"
        squadronFromId: extractSquadronFromId(sub.studentId),
        // Use calculated score if available
        calculatedScore: calculateScoreFromMarkedAnswers(sub.markedAnswers),
        date: new Date(sub.submissionDate),
        // Ensure consistent squadron field
        squadron: undefined 
      })),
      ...(quizSubmissions || []).map(sub => ({
        ...sub,
        type: 'quiz',
        // Get squadron directly if available, or extract from ID
        squadronFromId: sub.squadron || "AMG",
        calculatedScore: sub.score,
        date: new Date(sub.submissionDate),
        passed: sub.score >= 70, // Default pass threshold for quizzes
        squadron: undefined // Remove to avoid type conflicts
      })),
      // Add document submissions if they have score data
      ...(documentSubmissions || []).map(sub => ({
        ...sub,
        type: 'document',
        squadronFromId: "AMG", // Default squadron if not specified
        calculatedScore: 0, // Documents typically don't have scores
        date: new Date(sub.submissionDate),
        passed: true, // Documents are typically pass/fail based on completion
        squadron: undefined // Remove to avoid type conflicts
      }))
    ];
    
    // Apply filters
    const filteredSubmissions = allSubmissions.filter(sub => {
      // Squadron filter
      if (selectedSquadron !== "all") {
        // Use squadronFromId that we've already extracted for all submission types
        const subSquadron = sub.squadronFromId;
        if (subSquadron !== selectedSquadron) return false;
      }
      
      // Assessment type filter
      if (selectedAssessmentType !== "all" && sub.type !== selectedAssessmentType) {
        return false;
      }
      
      // Date range filter
      if (selectedDateRange !== "all") {
        const now = new Date();
        const subDate = sub.date;
        
        if (selectedDateRange === "week" && differenceInDays(now, subDate) > 7) {
          return false;
        } else if (selectedDateRange === "month" && differenceInDays(now, subDate) > 30) {
          return false;
        } else if (selectedDateRange === "quarter" && differenceInDays(now, subDate) > 90) {
          return false;
        }
      }
      
      return true;
    });
    
    // Process overview statistics
    calculateOverviewStats(filteredSubmissions);
    
    // Process detailed performance data
    calculatePerformanceData(filteredSubmissions);
    
  }, [
    scenarioSubmissions, 
    quizSubmissions, 
    documentSubmissions,
    users,
    selectedSquadron,
    selectedAssessmentType,
    selectedDateRange,
    isLoadingScenarioSubmissions,
    isLoadingQuizSubmissions,
    isLoadingDocumentSubmissions,
    isLoadingUsers
  ]);
  
  // Helper functions for data processing
  function differenceInDays(date1: Date, date2: Date) {
    const diffTime = Math.abs(date1.getTime() - date2.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  function extractSquadronFromId(studentId: string | null | undefined) {
    // Extract squadron from format "ID - Squadron"
    if (!studentId) return "AMG"; // Default squadron if not provided
    
    const parts = studentId.split(' - ');
    if (parts.length > 1) {
      return parts[1];
    }
    return "AMG"; // Default squadron if not specified
  }
  
  function calculateScoreFromMarkedAnswers(markedAnswers: any) {
    if (!markedAnswers) return 0;
    
    try {
      // Parse answers if they're a string
      const parsedAnswers = typeof markedAnswers === 'string' 
        ? JSON.parse(markedAnswers) 
        : markedAnswers;
      
      if (typeof parsedAnswers !== 'object') return 0;
      
      const correctCount = Object.values(parsedAnswers).filter(val => val === true).length;
      const totalQuestions = Object.keys(parsedAnswers).length;
      
      if (totalQuestions === 0) return 0;
      
      return Math.round((correctCount / totalQuestions) * 100);
    } catch (e) {
      console.error("Error calculating score:", e);
      return 0;
    }
  }
  
  function calculateOverviewStats(submissions: any[]) {
    // Count total licensed students from users data (all active users except superadmins)
    const totalLicensedStudents = users ? users.filter(user => 
      user.licenseStatus === 'active' && user.role !== 'superadmin'
    ).length : 0;
    
    // Filter submissions with scores
    const submissionsWithScores = submissions.filter(sub => 
      (sub.calculatedScore !== undefined && sub.calculatedScore !== null) || 
      (sub.score !== undefined && sub.score !== null)
    );
    
    // Calculate average score
    const totalScore = submissionsWithScores.reduce((sum, sub) => 
      sum + (sub.calculatedScore || sub.score || 0), 0);
    const avgScore = submissionsWithScores.length > 0 
      ? totalScore / submissionsWithScores.length 
      : 0;
    
    // Calculate pass rate (require that passed field is a boolean)
    const scorableSubmissions = submissions.filter(sub => 
      sub.passed !== undefined || 
      (sub.calculatedScore !== undefined && sub.calculatedScore >= 70) ||
      (sub.score !== undefined && sub.score >= 70)
    );
    
    const passedSubmissions = scorableSubmissions.filter(sub => 
      sub.passed === true || 
      (sub.calculatedScore !== undefined && sub.calculatedScore >= 70) ||
      (sub.score !== undefined && sub.score >= 70)
    );
    
    const passRate = scorableSubmissions.length > 0 
      ? (passedSubmissions.length / scorableSubmissions.length) * 100 
      : 0;
    
    // Get breakdown by squadron with normalized formatting
    const squadronCounts: Record<string, number> = {};
    submissions.forEach(sub => {
      // Get squadron - directly from sub.squadron or from studentId
      let squadron = sub.squadron || sub.squadronFromId || "AMG";
      
      // Normalize squadron format - convert "33" to "33 Squadron", "33SQN" to "33 Squadron", etc.
      if (squadron.match(/^\d+$/)) {
        squadron = `${squadron} Squadron`;
      } else if (squadron.match(/^\d+SQN$/)) {
        squadron = `${squadron.replace('SQN', '')} Squadron`;
      }
      
      squadronCounts[squadron] = (squadronCounts[squadron] || 0) + 1;
    });
    
    // Format for chart
    const squadronBreakdown = Object.entries(squadronCounts).map(([name, count]) => ({
      name,
      count
    }));
    
    setOverviewStats({
      totalStudents: totalLicensedStudents,
      totalSubmissions: submissions.length,
      avgScore: Math.round(avgScore * 10) / 10, // Round to 1 decimal place
      passRate: Math.round(passRate * 10) / 10, // Round to 1 decimal place
      completionRate: 0, // Placeholder
      squadronBreakdown
    });
  }
  
  function calculatePerformanceData(submissions: any[]) {
    // Calculate score distribution
    const scoreGroups = {
      "0-49%": 0,
      "50-69%": 0,
      "70-89%": 0,
      "90-100%": 0
    };
    
    // Only include submissions with valid scores in score distribution
    const submissionsWithScores = submissions.filter(sub => {
      const score = sub.calculatedScore !== undefined ? sub.calculatedScore : sub.score;
      return score !== undefined && score !== null && score > 0;
    });
    
    submissionsWithScores.forEach(sub => {
      const score = sub.calculatedScore !== undefined ? sub.calculatedScore : sub.score;
      if (score < 50) scoreGroups["0-49%"]++;
      else if (score < 70) scoreGroups["50-69%"]++;
      else if (score < 90) scoreGroups["70-89%"]++;
      else scoreGroups["90-100%"]++;
    });
    
    const scoreDistribution = Object.entries(scoreGroups).map(([range, count]) => ({
      range,
      count
    }));
    
    // Calculate performance by squadron
    const squadronData: Record<string, { scores: number[], passed: number, total: number }> = {};
    
    submissions.forEach(sub => {
      let squadron = sub.squadron || sub.squadronFromId || "AMG";
      
      // Normalize squadron format - convert "33" to "33 Squadron", "33SQN" to "33 Squadron", etc.
      if (squadron.match(/^\d+$/)) {
        squadron = `${squadron} Squadron`;
      } else if (squadron.match(/^\d+SQN$/)) {
        squadron = `${squadron.replace('SQN', '')} Squadron`;
      }
      
      if (!squadronData[squadron]) {
        squadronData[squadron] = {
          scores: [],
          passed: 0,
          total: 0
        };
      }
      
      // Add score if available
      const score = sub.calculatedScore !== undefined ? sub.calculatedScore : (sub.score || null);
      if (score !== null) {
        squadronData[squadron].scores.push(score);
      }
      
      // Count pass/fail if determinable
      const isPassed = sub.passed !== undefined 
        ? sub.passed 
        : (score !== null ? score >= 70 : null);
      
      if (isPassed !== null) {
        squadronData[squadron].total++;
        if (isPassed) squadronData[squadron].passed++;
      }
    });
    
    const squadronPerformance = Object.entries(squadronData).map(([squadron, data]) => {
      const totalScore = data.scores.reduce((sum, score) => sum + score, 0);
      const avgScore = data.scores.length > 0 ? totalScore / data.scores.length : 0;
      const passRate = data.total > 0 ? (data.passed / data.total) * 100 : 0;
      
      return {
        squadron,
        avgScore: Math.round(avgScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10,
        submissions: data.scores.length
      };
    });
    
    // Calculate performance by assessment type
    const typeData: Record<string, { scores: number[], passed: number, total: number }> = {};
    
    submissions.forEach(sub => {
      const type = sub.type || 'unknown';
      
      if (!typeData[type]) {
        typeData[type] = {
          scores: [],
          passed: 0,
          total: 0
        };
      }
      
      // Add score if available
      const score = sub.calculatedScore !== undefined ? sub.calculatedScore : (sub.score || null);
      if (score !== null) {
        typeData[type].scores.push(score);
      }
      
      // Count pass/fail if determinable
      const isPassed = sub.passed !== undefined 
        ? sub.passed 
        : (score !== null ? score >= 70 : null);
      
      if (isPassed !== null) {
        typeData[type].total++;
        if (isPassed) typeData[type].passed++;
      }
    });
    
    const assessmentTypePerformance = Object.entries(typeData).map(([type, data]) => {
      const totalScore = data.scores.reduce((sum, score) => sum + score, 0);
      const avgScore = data.scores.length > 0 ? totalScore / data.scores.length : 0;
      const passRate = data.total > 0 ? (data.passed / data.total) * 100 : 0;
      
      return {
        type: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize
        avgScore: Math.round(avgScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10,
        submissions: data.scores.length
      };
    });
    
    // Calculate performance trends over time
    // Group by month for a reasonable time series
    const monthlyData: Record<string, { scores: number[], submissions: number }> = {};
    
    submissions.forEach(sub => {
      if (!sub.date) return;
      
      const date = sub.date;
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { scores: [], submissions: 0 };
      }
      
      const score = sub.calculatedScore !== undefined ? sub.calculatedScore : (sub.score || null);
      if (score !== null) {
        monthlyData[monthYear].scores.push(score);
      }
      
      monthlyData[monthYear].submissions++;
    });
    
    // Convert to array and sort chronologically
    const trendOverTime = Object.entries(monthlyData)
      .map(([date, data]) => {
        const totalScore = data.scores.reduce((sum, score) => sum + score, 0);
        const avgScore = data.scores.length > 0 ? totalScore / data.scores.length : 0;
        
        return {
          date,
          avgScore: Math.round(avgScore * 10) / 10,
          submissions: data.submissions
        };
      })
      .sort((a, b) => {
        const [aMonth, aYear] = a.date.split('/').map(Number);
        const [bMonth, bYear] = b.date.split('/').map(Number);
        
        if (aYear !== bYear) return aYear - bYear;
        return aMonth - bMonth;
      });
    
    setPerformanceData({
      scoreDistribution,
      squadronPerformance,
      assessmentTypePerformance,
      trendOverTime
    });
  }
  
  // Loading state
  const isLoading = 
    isLoadingScenarioSubmissions || 
    isLoadingQuizSubmissions || 
    isLoadingDocumentSubmissions;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Advanced Analytics - LOADMworkflow</title>
        <meta name="description" content="Advanced performance analytics for loadmaster training" />
      </Helmet>
      
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Link href="/instructors-portal">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Advanced Performance Analytics</h1>
              <p className="text-muted-foreground">Comprehensive insights across all assessment types and squadrons</p>
            </div>
          </div>
          
          {/* Analytics View Selector */}
          <div className="flex gap-2">
            <Button 
              variant={selectedView === "overview" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedView("overview")}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button 
              variant={selectedView === "scoring" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedView("scoring")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Scoring
            </Button>
            <Button 
              variant={selectedView === "squadrons" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedView("squadrons")}
            >
              <Users className="h-4 w-4 mr-2" />
              Squadrons
            </Button>
            <Button 
              variant={selectedView === "trends" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedView("trends")}
            >
              <LineChartIcon className="h-4 w-4 mr-2" />
              Trends
            </Button>
          </div>
        </div>
        
        {/* Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="squadron-filter" className="text-sm whitespace-nowrap">Squadron:</Label>
                <Select 
                  value={selectedSquadron} 
                  onValueChange={setSelectedSquadron}
                >
                  <SelectTrigger id="squadron-filter" className="h-8 w-[140px]">
                    <SelectValue placeholder="All Squadrons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Squadrons</SelectItem>
                    {SQUADRONS.map(sq => (
                      <SelectItem key={sq} value={sq}>{sq}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="type-filter" className="text-sm whitespace-nowrap">Assessment Type:</Label>
                <Select 
                  value={selectedAssessmentType} 
                  onValueChange={setSelectedAssessmentType}
                >
                  <SelectTrigger id="type-filter" className="h-8 w-[160px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="scenario">Scenarios</SelectItem>
                    <SelectItem value="quiz">Quizzes</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="date-filter" className="text-sm whitespace-nowrap">Time Period:</Label>
                <Select 
                  value={selectedDateRange} 
                  onValueChange={setSelectedDateRange}
                >
                  <SelectTrigger id="date-filter" className="h-8 w-[140px]">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="quarter">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
          
          <Card className="col-span-1 md:col-span-2 lg:col-span-4">
            <CardHeader className="p-4 pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-primary mr-2" />
                  <div className="text-2xl font-bold">{overviewStats.totalStudents}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {SQUADRONS.length} squadrons
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center">
                  <Layers className="h-5 w-5 text-primary mr-2" />
                  <div className="text-2xl font-bold">{overviewStats.totalSubmissions}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All assessment types combined
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center">
                  <Medal className="h-5 w-5 text-primary mr-2" />
                  <div className="text-2xl font-bold">{overviewStats.avgScore}%</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overviewStats.avgScore >= 70 ? "Above" : "Below"} passing threshold
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  <div className="text-2xl font-bold">{overviewStats.passRate}%</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on instructor evaluations
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Area - Conditional based on selected view */}
          {selectedView === "overview" && (
            <div className="space-y-6">
              {/* Performance Overview - 2-column layout */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Score Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Score Distribution</CardTitle>
                    <CardDescription>Student performance across score ranges</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData.scoreDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            dataKey="count" 
                            name="Students" 
                            fill={COLORS.primary}
                          >
                            {performanceData.scoreDistribution.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS.scoreRanges[entry.range as keyof typeof COLORS.scoreRanges]} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Squadron Breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Squadron Activity</CardTitle>
                    <CardDescription>Distribution of submissions by squadron</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={overviewStats.squadronBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {overviewStats.squadronBreakdown.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS.squadrons[entry.name as keyof typeof COLORS.squadrons] || COLORS.primary} 
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Assessment Type Performance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Assessment Type Performance</CardTitle>
                  <CardDescription>Comparison of student performance across different assessment types</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={performanceData.assessmentTypePerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 'dataMax + 10']} />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          yAxisId="right"
                          dataKey="submissions" 
                          name="Total Submissions" 
                          fill={COLORS.secondary}
                          barSize={50}
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="avgScore" 
                          name="Average Score (%)" 
                          stroke={COLORS.primary}
                          strokeWidth={2}
                          dot={{ r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="passRate" 
                          name="Pass Rate (%)" 
                          stroke={COLORS.success}
                          strokeWidth={2}
                          dot={{ r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {selectedView === "scoring" && (
            <div className="space-y-6">
              {/* Score Distribution Detailed View */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Score Analysis</CardTitle>
                  <CardDescription>Comprehensive view of performance across assessment types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData.scoreDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="count" 
                          name="Number of Students" 
                        >
                          {performanceData.scoreDistribution.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS.scoreRanges[entry.range as keyof typeof COLORS.scoreRanges]} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Score Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    {performanceData.scoreDistribution.map((range) => (
                      <Card key={range.range} className="bg-muted/40 border-none">
                        <CardContent className="p-4">
                          <h3 className="text-lg font-medium mb-1 flex items-center">
                            <span 
                              className="h-3 w-3 rounded-full mr-2"
                              style={{ backgroundColor: COLORS.scoreRanges[range.range as keyof typeof COLORS.scoreRanges] }}
                            />
                            {range.range}
                          </h3>
                          <p className="text-3xl font-bold">{range.count}</p>
                          <p className="text-sm text-muted-foreground">
                            {(range.count / performanceData.scoreDistribution.reduce((sum, item) => sum + item.count, 0) * 100).toFixed(1)}% of submissions
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {selectedView === "squadrons" && (
            <div className="space-y-6">
              {/* Squadron Performance Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Squadron Performance Comparison</CardTitle>
                  <CardDescription>Detailed analysis of performance metrics by squadron</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={performanceData.squadronPerformance} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="squadron" />
                        <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          yAxisId="left"
                          dataKey="avgScore" 
                          name="Average Score (%)" 
                          fill={COLORS.primary}
                        >
                          {performanceData.squadronPerformance.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS.squadrons[entry.squadron as keyof typeof COLORS.squadrons] || COLORS.primary} 
                            />
                          ))}
                        </Bar>
                        <Bar 
                          yAxisId="left"
                          dataKey="passRate" 
                          name="Pass Rate (%)" 
                          fill={COLORS.success}
                        >
                          {performanceData.squadronPerformance.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS.squadrons[entry.squadron as keyof typeof COLORS.squadrons] 
                                ? `${COLORS.squadrons[entry.squadron as keyof typeof COLORS.squadrons]}80` 
                                : `${COLORS.success}80`} 
                            />
                          ))}
                        </Bar>
                        <Bar 
                          yAxisId="right"
                          dataKey="submissions" 
                          name="Total Submissions" 
                          fill={COLORS.secondary}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {selectedView === "trends" && (
            <div className="space-y-6">
              {/* Performance Trends Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>Analysis of student performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={performanceData.trendOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis 
                          yAxisId="left" 
                          orientation="left" 
                          domain={[0, 100]} 
                          label={{ value: 'Average Score (%)', angle: -90, position: 'insideLeft' }} 
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          domain={[0, 'dataMax + 5']} 
                          label={{ value: 'Submissions', angle: 90, position: 'insideRight' }} 
                        />
                        <Tooltip />
                        <Legend />
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="avgScore" 
                          name="Average Score (%)" 
                          fill={`${COLORS.primary}20`}
                          stroke={COLORS.primary}
                          strokeWidth={2}
                        />
                        <Bar 
                          yAxisId="right"
                          dataKey="submissions" 
                          name="Submissions" 
                          fill={COLORS.secondary}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          

        </>
      )}
    </div>
  );
}
