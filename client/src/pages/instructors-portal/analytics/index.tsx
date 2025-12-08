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
  ComposedChart,
  RadialBarChart,
  RadialBar
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
  ArrowLeft,
  HelpCircle,
  X,
  TrendingUp,
  Target,
  AlertTriangle,
  Award,
  FileText
} from "lucide-react";
import { Link } from "wouter";

interface HelpContent {
  title: string;
  icon: any;
  sections: {
    heading: string;
    points: string[];
  }[];
}

const HELP_CONTENT: Record<string, HelpContent> = {
  overviewMetrics: {
    title: "Overview Metrics",
    icon: LayoutDashboard,
    sections: [
      {
        heading: "What This Shows",
        points: [
          "Total Students - Count of all active licensed students across squadrons",
          "Total Submissions - Combined quiz, scenario, and document submissions",
          "Average Score - Mean score across all graded assessments",
          "Pass Rate - Percentage of submissions meeting or exceeding 70% threshold"
        ]
      },
      {
        heading: "How It Calculates",
        points: [
          "Filters apply to all metrics simultaneously",
          "Average score calculated from submissions with valid grades",
          "Pass rate based on instructor-evaluated submissions",
          "Squadron filter affects all downstream calculations"
        ]
      }
    ]
  },
  scoreDistribution: {
    title: "Score Distribution",
    icon: BarChart3,
    sections: [
      {
        heading: "What This Chart Shows",
        points: [
          "Breakdown of student scores across performance ranges",
          "Visual representation of class-wide performance patterns",
          "Helps identify if students cluster in certain score bands"
        ]
      },
      {
        heading: "Score Ranges",
        points: [
          "0-49% (Red) - Failing, needs significant improvement",
          "50-69% (Orange) - Below passing, remediation recommended",
          "70-89% (Green) - Passing, meets standards",
          "90-100% (Blue) - Excellent, exceeds expectations"
        ]
      }
    ]
  },
  squadronActivity: {
    title: "Squadron Activity",
    icon: Users,
    sections: [
      {
        heading: "What This Shows",
        points: [
          "Pie chart showing submission distribution by squadron",
          "Identifies which squadrons are most active",
          "Helps balance training workload across units"
        ]
      },
      {
        heading: "How to Use",
        points: [
          "Larger slices indicate more active squadrons",
          "Compare against squadron size for engagement rates",
          "Use to identify squadrons needing more attention"
        ]
      }
    ]
  },
  squadronPerformance: {
    title: "Squadron Performance Comparison",
    icon: BarChart3,
    sections: [
      {
        heading: "What This Chart Shows",
        points: [
          "Side-by-side comparison of all squadrons",
          "Average score and pass rate for each unit",
          "Total submission count per squadron"
        ]
      },
      {
        heading: "Metrics Explained",
        points: [
          "Average Score (%) - Mean performance level",
          "Pass Rate (%) - Percentage meeting 70% threshold",
          "Total Submissions - Activity level indicator",
          "Left axis: Percentages, Right axis: Counts"
        ]
      }
    ]
  },
  performanceTrends: {
    title: "Performance Trends",
    icon: TrendingUp,
    sections: [
      {
        heading: "What This Chart Shows",
        points: [
          "Historical view of performance over time",
          "Area chart shows average score trajectory",
          "Bar chart shows submission volume by period"
        ]
      },
      {
        heading: "How to Interpret",
        points: [
          "Upward trend indicates improving performance",
          "Downward trend may indicate curriculum gaps",
          "Compare volume with performance for insights",
          "Data grouped by month for clarity"
        ]
      }
    ]
  },
  assessmentType: {
    title: "Assessment Type Performance",
    icon: Layers,
    sections: [
      {
        heading: "What This Chart Shows",
        points: [
          "Radial gauge charts showing performance by assessment type",
          "Center value displays average score percentage",
          "Pass rate and submission counts shown below each gauge"
        ]
      },
      {
        heading: "Assessment Types",
        points: [
          "Scenarios - Practical load planning exercises",
          "Quizzes - Knowledge-based assessments",
          "Documents - Document comprehension tests",
          "Compare gauges to identify challenging assessment formats"
        ]
      }
    ]
  },
  topicMastery: {
    title: "Topic Mastery Matrix",
    icon: Layers,
    sections: [
      {
        heading: "What This Chart Shows",
        points: [
          "Horizontal bar chart of mastery by topic/category",
          "Shows which subject areas students struggle with",
          "Helps prioritize curriculum focus areas"
        ]
      },
      {
        heading: "Color Indicators",
        points: [
          "Green (≥70%) - Strong mastery, students performing well",
          "Yellow (50-69%) - Moderate mastery, needs reinforcement",
          "Red (<50%) - Weak mastery, requires targeted intervention"
        ]
      }
    ]
  },
  questionDifficulty: {
    title: "Question Difficulty Analysis",
    icon: AlertTriangle,
    sections: [
      {
        heading: "What This Shows",
        points: [
          "Top 10 most challenging questions across all assessments",
          "Success rate indicates how often students answer correctly",
          "Attempt count shows question exposure"
        ]
      },
      {
        heading: "How to Use",
        points: [
          "Low success rates may indicate confusing questions",
          "Consider revising questions with <50% success",
          "High attempts with low success = knowledge gap",
          "Review question wording and answer options"
        ]
      }
    ]
  },
  studentVsSquadron: {
    title: "Student vs Squadron Average",
    icon: Users,
    sections: [
      {
        heading: "What This Shows",
        points: [
          "Individual student scores compared to squadron average",
          "Positive difference = above squadron average",
          "Negative difference = below squadron average"
        ]
      },
      {
        heading: "Color Indicators",
        points: [
          "Green (+) - Student outperforming squadron",
          "Red (-) - Student below squadron average",
          "Gray (0) - Student at squadron average"
        ]
      }
    ]
  },
  moduleCompletion: {
    title: "Training Module Completion",
    icon: CheckCircle,
    sections: [
      {
        heading: "What This Shows",
        points: [
          "Progress bars for each training module",
          "Completion rate as a percentage",
          "Number of students who started vs completed"
        ]
      },
      {
        heading: "How to Use",
        points: [
          "Identify modules with low completion rates",
          "Large gap between started/completed = dropout issue",
          "Use to track overall training program progress"
        ]
      }
    ]
  },
  certificationReadiness: {
    title: "Certification Readiness Score",
    icon: Medal,
    sections: [
      {
        heading: "What This Shows",
        points: [
          "Leaderboard ranking students by overall readiness",
          "Readiness score combines multiple performance factors",
          "Status indicates proximity to certification"
        ]
      },
      {
        heading: "Status Levels",
        points: [
          "Ready - All requirements met, eligible for certification",
          "Near Ready - Most requirements met, minor gaps",
          "Not Ready - Significant requirements outstanding"
        ]
      }
    ]
  },
  atRiskStudents: {
    title: "At-Risk Students",
    icon: XCircle,
    sections: [
      {
        heading: "What This Shows",
        points: [
          "Students identified as needing intervention",
          "Risk factors highlighted for each student",
          "Risk level indicates urgency of action needed"
        ]
      },
      {
        heading: "Risk Factors",
        points: [
          "Low quiz scores - Below threshold on knowledge tests",
          "Low scenario scores - Struggling with practical exercises",
          "Inactivity - Extended time since last submission",
          "High risk = multiple factors combined"
        ]
      }
    ]
  },
  detailedScoreAnalysis: {
    title: "Detailed Score Analysis",
    icon: BarChart3,
    sections: [
      {
        heading: "What This Shows",
        points: [
          "Expanded view of score distribution",
          "Summary cards show counts per range",
          "Percentage of total submissions per range"
        ]
      },
      {
        heading: "How to Use",
        points: [
          "Identify overall class performance profile",
          "High percentage in lower ranges = curriculum review needed",
          "High percentage in upper ranges = effective training"
        ]
      }
    ]
  },
  iccPowerLaw: {
    title: "Item Characteristic Curves (ICC)",
    icon: TrendingUp,
    sections: [
      {
        heading: "What This Chart Shows",
        points: [
          "Power law distribution curves showing workforce development over time",
          "S-curves representing how performance metrics improve with experience",
          "Comparison across squadrons to identify development patterns",
          "Horizontal axis shows time in role as LOADM (years)"
        ]
      },
      {
        heading: "Available Metrics",
        points: [
          "Assessments Passed - Total number of passed evaluations",
          "Total Flight Hours - Cumulative day and night hours flown",
          "Active Qualifications - Count of current valid certifications",
          "Average Score - Mean assessment score percentage",
          "Cargo Weight Handled - Total cargo weight in kg"
        ]
      },
      {
        heading: "How to Interpret",
        points: [
          "Steeper curves indicate faster skill development",
          "Higher plateau indicates higher performance ceiling",
          "Curves reaching 1.0 indicate maximum expected performance",
          "Differences between squadrons highlight training effectiveness"
        ]
      },
      {
        heading: "Color Legend",
        points: [
          "Orange - 33 Squadron",
          "Green - 35 Squadron",
          "Blue - 36 Squadron",
          "Purple - 37 Squadron",
          "Yellow - AMG"
        ]
      }
    ]
  }
};

function HelpButton({ helpKey, onClick }: { helpKey: string; onClick: (key: string) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(helpKey); }}
      className="p-2 rounded-full bg-muted/50 hover:bg-primary/20 border border-primary/50 hover:border-primary transition-all duration-200 group"
      title="Click for help"
      data-testid={`help-button-${helpKey}`}
    >
      <HelpCircle className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors" />
    </button>
  );
}

function HelpModal({ helpKey, onClose }: { helpKey: string | null; onClose: () => void }) {
  if (!helpKey || !HELP_CONTENT[helpKey]) return null;
  
  const content = HELP_CONTENT[helpKey];
  const IconComponent = content.icon;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-card/95 to-background/98 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">{content.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              data-testid="help-modal-close"
            >
              <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
            {content.sections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                  {section.heading}
                </h3>
                <ul className="space-y-2">
                  {section.points.map((point, pointIdx) => (
                    <li key={pointIdx} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="text-primary mt-1.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-border/50 bg-muted/30">
            <p className="text-xs text-center text-muted-foreground">
              Click outside or press X to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// A set of predefined squadrons for filtering
const SQUADRONS = ["33 Squadron", "35 Squadron", "36 Squadron", "37 Squadron", "AMG"];

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
    "37 Squadron": "#8B5CF6",
    "AMG": "#FBBF24"
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
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [iccMetric, setIccMetric] = useState<string>("assessmentsPassed");
  const [showIccFormulaModal, setShowIccFormulaModal] = useState<boolean>(false);
  
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
  
  // Fetch advanced analytics data
  const { data: topicMastery, isLoading: isLoadingTopic } = useQuery<any[]>({
    queryKey: ["/api/analytics/topic-mastery"],
  });
  
  const { data: questionDifficulty, isLoading: isLoadingDifficulty } = useQuery<any[]>({
    queryKey: ["/api/analytics/question-difficulty"],
  });
  
  const { data: studentVsSquadron, isLoading: isLoadingComparison } = useQuery<any[]>({
    queryKey: ["/api/analytics/student-vs-squadron"],
  });
  
  const { data: moduleCompletion, isLoading: isLoadingModules } = useQuery<any[]>({
    queryKey: ["/api/analytics/module-completion"],
  });
  
  const { data: certificationReadiness, isLoading: isLoadingCertification } = useQuery<any[]>({
    queryKey: ["/api/analytics/certification-readiness"],
  });
  
  const { data: atRiskStudents, isLoading: isLoadingAtRisk } = useQuery<any[]>({
    queryKey: ["/api/analytics/at-risk-students"],
  });
  
  // ICC Power Law data - performance curves by time in role
  const { data: iccData, isLoading: isLoadingIcc } = useQuery<{
    metric: string;
    metricLabel: string;
    curves: {
      squadron: string;
      color: string;
      dataPoints: {
        year: number;
        yearLabel: string;
        rawValue: number;
        normalizedValue: number;
        usersInBin: number;
        cumulativeUsers: number;
      }[];
    }[];
    insights: { type: string; title: string; description: string }[];
    summary: {
      totalUsers: number;
      squadronsIncluded: number;
      tenureRange: { min: number; max: number };
    };
  }>({
    queryKey: [`/api/analytics/icc-power-law?metric=${iccMetric}`],
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
        // Use squadron field if available, otherwise extract from studentId
        squadronFromId: sub.squadron || extractSquadronFromId(sub.studentId),
        // Use score field if available, otherwise try to calculate from markedAnswers
        calculatedScore: sub.score !== undefined ? sub.score : calculateScoreFromMarkedAnswers(sub.markedAnswers),
        date: sub.submissionDate ? new Date(sub.submissionDate) : new Date(),
        // Ensure consistent squadron field
        squadron: undefined 
      })),
      ...(quizSubmissions || []).map(sub => ({
        ...sub,
        type: 'quiz',
        // Get squadron directly if available, or extract from ID
        squadronFromId: sub.squadron || "AMG",
        calculatedScore: sub.score,
        date: sub.submissionDate ? new Date(sub.submissionDate) : new Date(),
        passed: sub.score >= 70, // Default pass threshold for quizzes
        squadron: undefined // Remove to avoid type conflicts
      })),
      // Add document submissions if they have score data
      ...(documentSubmissions || []).map(sub => ({
        ...sub,
        type: 'document',
        squadronFromId: "AMG", // Default squadron if not specified
        calculatedScore: 0, // Documents typically don't have scores
        date: sub.submissionDate ? new Date(sub.submissionDate) : new Date(),
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
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                <HelpButton helpKey="overviewMetrics" onClick={setActiveHelp} />
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
          
          {/* ICC Power Law Distribution Chart */}
          <Card className="mb-6" data-testid="card-icc-power-law">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Item Characteristic Curves (ICC)
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Compare how different performance metrics develop across skill levels over time in role
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowIccFormulaModal(true)}
                    className="px-3 py-2 rounded-lg text-sm font-mono border border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 transition-colors text-blue-300 hover:text-blue-200 cursor-pointer"
                    data-testid="button-icc-formula"
                  >
                    View Formula
                  </button>
                  <Select value={iccMetric} onValueChange={setIccMetric}>
                    <SelectTrigger className="w-[200px]" data-testid="select-icc-metric">
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assessmentsPassed">Assessments Passed</SelectItem>
                      <SelectItem value="totalFlightHours">Total Flight Hours</SelectItem>
                      <SelectItem value="activeQualifications">Active Qualifications</SelectItem>
                      <SelectItem value="averageScore">Average Score</SelectItem>
                      <SelectItem value="cargoWeight">Cargo Weight Handled</SelectItem>
                    </SelectContent>
                  </Select>
                  <HelpButton helpKey="iccPowerLaw" onClick={setActiveHelp} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingIcc ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : iccData?.curves && iccData.curves.length > 0 ? (
                <>
                  {/* Chart */}
                  <div className="h-[400px] w-full" data-testid="icc-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="year" 
                          type="number"
                          domain={[0, 12]}
                          tickCount={13}
                          label={{ value: 'Time in Role (Years)', position: 'insideBottom', offset: -10, fill: '#9CA3AF' }}
                          stroke="#6B7280"
                        />
                        <YAxis 
                          domain={[0, 1]}
                          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                          label={{ value: iccData.metricLabel, angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                          stroke="#6B7280"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(31, 41, 55, 0.95)', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number, name: string) => [
                            `${(value * 100).toFixed(1)}%`,
                            name
                          ]}
                          labelFormatter={(label) => `Year ${label} in Role`}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                        />
                        {iccData.curves.map((curve) => (
                          <Line
                            key={curve.squadron}
                            data={curve.dataPoints}
                            type="monotone"
                            dataKey="normalizedValue"
                            name={curve.squadron}
                            stroke={curve.color}
                            strokeWidth={2}
                            dot={{ r: 3, fill: curve.color }}
                            activeDot={{ r: 5 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Axis Explanation Boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <Card className="bg-muted/30 border-muted">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-sm mb-2 text-primary">Horizontal Axis: Time in Role</h4>
                        <p className="text-xs text-muted-foreground">
                          Left (0 years) to right (12+ years). Shows how personnel at different experience levels perform. 
                          Career progression stages visible from entry-level to senior loadmasters.
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-muted">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-sm mb-2 text-primary">Vertical Axis: {iccData.metricLabel}</h4>
                        <p className="text-xs text-muted-foreground">
                          0% = entry level, 100% = maximum expected performance. 
                          S-curve shape indicates power law learning distribution - steep growth mid-career, plateau at expertise.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Insights Panel */}
                  {iccData.insights && iccData.insights.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        What These Curves Tell Us About Your Workforce
                      </h4>
                      <div className="space-y-2">
                        {iccData.insights.map((insight, idx) => (
                          <div 
                            key={idx} 
                            className={`flex items-start gap-3 p-3 rounded-lg ${
                              insight.type === 'strength' 
                                ? 'bg-green-500/10 border border-green-500/30' 
                                : insight.type === 'challenge'
                                ? 'bg-orange-500/10 border border-orange-500/30'
                                : 'bg-blue-500/10 border border-blue-500/30'
                            }`}
                          >
                            <span className={`text-lg ${
                              insight.type === 'strength' ? 'text-green-500' : 
                              insight.type === 'challenge' ? 'text-orange-500' : 'text-blue-500'
                            }`}>
                              {insight.type === 'strength' ? '●' : insight.type === 'challenge' ? '●' : '●'}
                            </span>
                            <div>
                              <p className="font-medium text-sm">{insight.title}</p>
                              <p className="text-xs text-muted-foreground">{insight.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Stats */}
                  <div className="flex items-center gap-8 mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                    <span>Total Personnel: {iccData.summary?.totalUsers || 0}</span>
                    <span>Squadrons: {iccData.summary?.squadronsIncluded || 0}</span>
                    <span>Tenure Range: {Math.floor((iccData.summary?.tenureRange?.min || 0) / 12)} - {Math.floor((iccData.summary?.tenureRange?.max || 0) / 12)} years</span>
                  </div>

                  {/* ICC Formula Modal */}
                  {showIccFormulaModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowIccFormulaModal(false)}>
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
                      <div 
                        className="relative bg-slate-900/60 border border-slate-700/50 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden"
                        style={{
                          backdropFilter: 'blur(10px)',
                          backgroundColor: 'rgba(15, 23, 42, 0.6)',
                          borderColor: 'rgba(71, 85, 105, 0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-700/50">
                          <div className="flex items-start justify-between">
                            <div>
                              <h2 className="text-xl font-bold text-white mb-2">ICC Power Law Distribution</h2>
                              <p className="text-sm text-blue-300">
                                ✨ <strong>Why This Matters:</strong> This chart reveals hidden patterns in how your workforce develops skills over time, helping you predict performance trajectories and identify optimal training windows for each career stage.
                              </p>
                            </div>
                            <button
                              onClick={() => setShowIccFormulaModal(false)}
                              className="text-slate-400 hover:text-white transition-colors"
                            >
                              <X className="h-6 w-6" />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                          {/* What It Does */}
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                              <Target className="h-5 w-5 text-blue-400" />
                              What It Does
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              The ICC (Item Characteristic Curve) Power Law Distribution chart models how performance metrics evolve across your workforce as personnel gain experience. It combines actual performance data with a sigmoid (S-curve) function to create smooth, realistic learning trajectories that match real-world skill development patterns.
                            </p>
                          </div>

                          {/* What It Shows */}
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-blue-400" />
                              What It Shows
                            </h3>
                            <ul className="space-y-2 text-sm text-slate-300">
                              <li className="flex items-start gap-3">
                                <span className="text-blue-400 mt-1">•</span>
                                <span><strong>Career Stage Performance:</strong> How different experience levels (0-12 years) perform on key metrics</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="text-blue-400 mt-1">•</span>
                                <span><strong>Squadron Comparison:</strong> Color-coded lines for each squadron show comparative performance trajectories</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="text-blue-400 mt-1">•</span>
                                <span><strong>Growth Periods:</strong> Steep curves indicate rapid skill acquisition; plateau regions show expertise stabilization</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="text-blue-400 mt-1">•</span>
                                <span><strong>Selectible Metrics:</strong> Switch between Assessments Passed, Flight Hours, Qualifications, Scores, and Cargo Weight</span>
                              </li>
                            </ul>
                          </div>

                          {/* Why It's Useful */}
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                              <Award className="h-5 w-5 text-blue-400" />
                              Why It's Useful
                            </h3>
                            <ul className="space-y-2 text-sm text-slate-300">
                              <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">✓</span>
                                <span><strong>Workforce Planning:</strong> Predict when personnel will reach peak performance and plan succession</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">✓</span>
                                <span><strong>Training Optimization:</strong> Identify the critical learning window (usually years 2-5) for targeted training investment</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">✓</span>
                                <span><strong>Squadron Benchmarking:</strong> Compare squadron trajectories to identify best practices and improvement areas</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">✓</span>
                                <span><strong>Performance Prediction:</strong> Estimate how new personnel will develop compared to historical patterns</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">✓</span>
                                <span><strong>Data-Driven Decisions:</strong> Base promotion, assignment, and retention decisions on statistically validated learning curves</span>
                              </li>
                            </ul>
                          </div>

                          {/* Formula */}
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                            <h4 className="text-sm font-semibold text-white mb-3">Mathematical Formula</h4>
                            <div className="space-y-2 font-mono text-xs text-slate-300">
                              <div className="text-center text-blue-300">Y = 0.6 × (M/M<sub>max</sub>) + 0.4 × σ(t)</div>
                              <div className="text-center text-blue-300">σ(t) = 1 / (1 + e<sup>-0.8(x-5)</sup>)</div>
                              <div className="text-slate-400 text-[10px] mt-3 text-center leading-relaxed">
                                Y = final curve value • M = actual metric value • M<sub>max</sub> = maximum expected value • σ(t) = logistic sigmoid function • k = 0.8 (steepness) • x₀ = 5 (midpoint in years)
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                          <button
                            onClick={() => setShowIccFormulaModal(false)}
                            className="w-full py-2 px-4 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <p>No ICC data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Main Content Area */}
          <div className="space-y-6">
              {/* Performance Overview - 2-column layout */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Score Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Score Distribution</CardTitle>
                      <HelpButton helpKey="scoreDistribution" onClick={setActiveHelp} />
                    </div>
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
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Squadron Activity</CardTitle>
                      <HelpButton helpKey="squadronActivity" onClick={setActiveHelp} />
                    </div>
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
              
              {/* Squadron Performance Comparison */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Squadron Performance Comparison</CardTitle>
                    <HelpButton helpKey="squadronPerformance" onClick={setActiveHelp} />
                  </div>
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
              
              {/* Performance Trends Over Time */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Performance Trends</CardTitle>
                    <HelpButton helpKey="performanceTrends" onClick={setActiveHelp} />
                  </div>
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
              
              {/* Assessment Type Performance - Radial Gauge Charts */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Assessment Type Performance</CardTitle>
                    <HelpButton helpKey="assessmentType" onClick={setActiveHelp} />
                  </div>
                  <CardDescription>Comparison of student performance across different assessment types</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {performanceData.assessmentTypePerformance.map((assessment, index) => {
                      const gaugeData = [
                        { name: 'Score', value: assessment.avgScore, fill: COLORS.primary },
                        { name: 'Remaining', value: 100 - assessment.avgScore, fill: 'rgba(107, 114, 128, 0.2)' }
                      ];
                      const typeIcons: Record<string, any> = {
                        'Scenario': FileText,
                        'Quiz': BarChart3,
                        'Document': FileText
                      };
                      const TypeIcon = typeIcons[assessment.type] || FileText;
                      
                      return (
                        <div 
                          key={assessment.type}
                          className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50"
                          data-testid={`gauge-${assessment.type.toLowerCase()}`}
                        >
                          {/* Assessment Type Header */}
                          <div className="flex items-center gap-2 mb-3">
                            <TypeIcon className="h-5 w-5 text-orange-500" />
                            <span className="font-semibold text-lg">{assessment.type}</span>
                          </div>
                          
                          {/* Radial Gauge */}
                          <div className="relative w-[160px] h-[160px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadialBarChart 
                                cx="50%" 
                                cy="50%" 
                                innerRadius="70%" 
                                outerRadius="100%" 
                                barSize={12}
                                data={[gaugeData[0]]}
                                startAngle={180} 
                                endAngle={0}
                              >
                                <RadialBar
                                  background={{ fill: 'rgba(107, 114, 128, 0.2)' }}
                                  dataKey="value"
                                  cornerRadius={6}
                                  fill={COLORS.primary}
                                />
                              </RadialBarChart>
                            </ResponsiveContainer>
                            {/* Center Score Display */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-bold text-orange-500">{assessment.avgScore}%</span>
                              <span className="text-xs text-muted-foreground">Avg Score</span>
                            </div>
                          </div>
                          
                          {/* Stats Below Gauge */}
                          <div className="w-full mt-4 space-y-2">
                            <div className="flex justify-between items-center px-2 py-1.5 rounded-lg bg-gray-800/50">
                              <span className="text-sm text-muted-foreground">Pass Rate</span>
                              <span className={`text-sm font-semibold ${assessment.passRate >= 70 ? 'text-green-500' : assessment.passRate >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {assessment.passRate}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center px-2 py-1.5 rounded-lg bg-gray-800/50">
                              <span className="text-sm text-muted-foreground">Submissions</span>
                              <span className="text-sm font-semibold text-white">{assessment.submissions.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Fallback if no data */}
                    {performanceData.assessmentTypePerformance.length === 0 && (
                      <div className="col-span-3 text-center py-8 text-muted-foreground">
                        No assessment data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Advanced Analytics Section - Consolidated into Overview */}
              <Separator className="my-8" />
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Advanced Performance Analytics</h2>
                <p className="text-muted-foreground">Detailed insights and metrics for comprehensive training assessment</p>
              </div>
              
              {/* Row 1: Topic Mastery Matrix & Question Difficulty Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Topic Mastery Matrix */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        Topic Mastery Matrix
                      </CardTitle>
                      <HelpButton helpKey="topicMastery" onClick={setActiveHelp} />
                    </div>
                    <CardDescription>Performance breakdown by quiz category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topicMastery || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis type="category" dataKey="category" width={150} />
                          <Tooltip />
                          <Bar dataKey="masteryPercentage" name="Mastery %" fill={COLORS.primary}>
                            {(topicMastery || []).map((entry: any, index: number) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.masteryPercentage >= 70 ? COLORS.success : 
                                      entry.masteryPercentage >= 50 ? COLORS.warning : COLORS.danger} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Question Difficulty Analysis */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Question Difficulty Analysis
                      </CardTitle>
                      <HelpButton helpKey="questionDifficulty" onClick={setActiveHelp} />
                    </div>
                    <CardDescription>Top 10 most challenging questions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto">
                      {(questionDifficulty || []).map((q: any, idx: number) => (
                        <div key={q.questionId} className="p-3 rounded-lg bg-muted/50 border border-border">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {q.category}
                                </span>
                              </div>
                              <p className="text-sm line-clamp-2">{q.questionText}</p>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${
                                q.successRate >= 70 ? 'text-success' : 
                                q.successRate >= 50 ? 'text-warning' : 'text-danger'
                              }`}>
                                {q.successRate}%
                              </div>
                              <div className="text-xs text-muted-foreground">{q.attempts} attempts</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Row 2: Student vs Squadron Average & Training Module Completion */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Student vs Squadron Average */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Student vs Squadron Average
                      </CardTitle>
                      <HelpButton helpKey="studentVsSquadron" onClick={setActiveHelp} />
                    </div>
                    <CardDescription>Individual performance compared to squadron</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {(studentVsSquadron || []).slice(0, 15).map((student: any) => (
                        <div key={student.userId} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{student.name}</div>
                            <div className="text-xs text-muted-foreground">{student.squadron}</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-semibold">{student.studentAverage}%</div>
                              <div className="text-xs text-muted-foreground">Student</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">{student.squadronAverage}%</div>
                              <div className="text-xs text-muted-foreground">Squadron</div>
                            </div>
                            <div className={`text-sm font-bold min-w-[50px] text-right ${
                              student.difference > 0 ? 'text-success' : 
                              student.difference < 0 ? 'text-danger' : 'text-muted-foreground'
                            }`}>
                              {student.difference > 0 ? '+' : ''}{student.difference}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Training Module Completion Progress */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Training Module Completion
                      </CardTitle>
                      <HelpButton helpKey="moduleCompletion" onClick={setActiveHelp} />
                    </div>
                    <CardDescription>Progress tracking across all modules</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(moduleCompletion || []).map((module: any) => (
                        <div key={module.moduleId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm">{module.moduleName}</div>
                            <div className="text-sm font-bold text-primary">{module.completionRate}%</div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${module.completionRate}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{module.studentsCompleted} completed</span>
                            <span>{module.studentsStarted} started</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Row 3: Certification Readiness Score & At-Risk Students */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Certification Readiness Score */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Medal className="h-5 w-5" />
                        Certification Readiness Score
                      </CardTitle>
                      <HelpButton helpKey="certificationReadiness" onClick={setActiveHelp} />
                    </div>
                    <CardDescription>Students ranked by overall readiness</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {(certificationReadiness || []).slice(0, 12).map((student: any, idx: number) => (
                        <div key={student.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <div className={`text-lg font-bold min-w-[40px] text-center ${
                            idx < 3 ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            #{idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{student.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {student.squadron} • {student.quizCount} quizzes • {student.scenarioCount} scenarios
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              student.status === 'ready' ? 'text-success' : 
                              student.status === 'near-ready' ? 'text-warning' : 'text-muted-foreground'
                            }`}>
                              {student.readinessScore}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">{student.status.replace('-', ' ')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* At-Risk Students Alert Table */}
                <Card className="border-danger/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-danger">
                        <XCircle className="h-5 w-5" />
                        At-Risk Students
                      </CardTitle>
                      <HelpButton helpKey="atRiskStudents" onClick={setActiveHelp} />
                    </div>
                    <CardDescription>Students requiring immediate attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto">
                      {(atRiskStudents || []).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto mb-2 text-success" />
                          <p>No at-risk students identified</p>
                        </div>
                      ) : (
                        (atRiskStudents || []).map((student: any) => (
                          <div key={student.userId} className={`p-3 rounded-lg border ${
                            student.riskLevel === 'high' ? 'bg-danger/5 border-danger/50' :
                            student.riskLevel === 'medium' ? 'bg-warning/5 border-warning/50' :
                            'bg-muted/50 border-border'
                          }`}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{student.name}</div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  {student.squadron} • {student.totalSubmissions} submissions
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {student.riskFactors.map((factor: string, idx: number) => (
                                    <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger">
                                      {factor}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                                student.riskLevel === 'high' ? 'bg-danger text-white' :
                                student.riskLevel === 'medium' ? 'bg-warning text-white' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {student.riskLevel}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-muted-foreground">Quiz: {student.avgQuizScore}%</span>
                              <span className="text-muted-foreground">Scenario: {student.avgScenarioScore}%</span>
                              <span className="text-muted-foreground">Last active: {student.daysSinceActivity}d ago</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Detailed Scoring Section */}
              <Separator className="my-8" />
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Detailed Score Analysis</h2>
                <p className="text-muted-foreground">Comprehensive view of performance across assessment types</p>
              </div>
              
              {/* Score Distribution Detailed View */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Detailed Score Analysis</CardTitle>
                    <HelpButton helpKey="detailedScoreAnalysis" onClick={setActiveHelp} />
                  </div>
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
        </>
      )}

      {/* Help Modal */}
      <HelpModal helpKey={activeHelp} onClose={() => setActiveHelp(null)} />
    </div>
  );
}