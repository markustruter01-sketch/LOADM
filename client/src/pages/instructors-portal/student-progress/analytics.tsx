import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Scenario, ScenarioSubmission } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CartesianGrid
} from "recharts";
import { Loader2, BrainCircuit, AlertCircle } from "lucide-react";

export default function ScenarioAnalytics() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("all");
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [selectedScenarioName, setSelectedScenarioName] = useState<string>("All Scenarios");
  const [insufficientDataOpen, setInsufficientDataOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch all scenarios for dropdown
  const { data: scenarios } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
  });
  
  // Fetch submissions for analytics
  const { data: submissions } = useQuery<ScenarioSubmission[]>({
    queryKey: ["/api/scenario-submissions"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  useEffect(() => {
    if (!submissions) return;
    
    // Filter submissions based on selected scenario
    const filteredSubmissions = selectedScenarioId === "all" 
      ? submissions 
      : submissions.filter(sub => sub.scenarioId === parseInt(selectedScenarioId));
    
    // Group submissions by score for chart
    const scoreGroups = {
      "0-49%": 0,
      "50-69%": 0,
      "70-89%": 0,
      "90-100%": 0
    };
    
    filteredSubmissions.forEach(sub => {
      // For reviewed submissions, use calculated score based on marked answers
      if (sub.markedAnswers && typeof sub.markedAnswers === 'string') {
        try {
          const markedAnswers = JSON.parse(sub.markedAnswers);
          const correctCount = Object.values(markedAnswers).filter(Boolean).length;
          
          // Estimate total questions based on marked answers object keys
          const totalQuestions = Object.keys(markedAnswers).length;
          
          if (totalQuestions > 0) {
            const calculatedScore = Math.round((correctCount / totalQuestions) * 100);
            
            // Assign to appropriate score group
            if (calculatedScore < 50) scoreGroups["0-49%"]++;
            else if (calculatedScore < 70) scoreGroups["50-69%"]++;
            else if (calculatedScore < 90) scoreGroups["70-89%"]++;
            else scoreGroups["90-100%"]++;
            
            return; // Skip the fallback calculation below
          }
        } catch (e) {
          console.error("Error parsing marked answers:", e);
        }
      }
      
      // Fallback to using score if available
      const score = sub.score || 0;
      if (score < 50) scoreGroups["0-49%"]++;
      else if (score < 70) scoreGroups["50-69%"]++;
      else if (score < 90) scoreGroups["70-89%"]++;
      else scoreGroups["90-100%"]++;
    });
    
    // Transform for charts
    const newChartData = Object.entries(scoreGroups).map(([range, count]) => ({
      range,
      count
    }));
    
    // Find the scenarios for the submissions to get their passing thresholds
    const scenarioMap = new Map<number, Scenario>();
    scenarios?.forEach(scenario => {
      scenarioMap.set(scenario.id, scenario);
    });
    
    // Pie chart data - pass vs fail based on custom thresholds
    const passCount = filteredSubmissions.reduce((sum, sub) => {
      // Directly use the passed value if available (this will be set by the instructor when they mark the submission)
      if (typeof sub.passed === 'boolean') {
        return sum + (sub.passed ? 1 : 0);
      }
      
      // As a fallback, calculate based on score and threshold
      const score = sub.score || 0;
      const scenario = scenarioMap.get(sub.scenarioId);
      const passingThreshold = scenario?.passingThreshold || 70; // Default to 70% if not set
      
      return sum + (score >= passingThreshold ? 1 : 0);
    }, 0);
    
    const failCount = filteredSubmissions.length - passCount;
    
    const newPieData = [
      { name: "Pass", value: passCount },
      { name: "Fail", value: failCount }
    ];
    
    // Progress over time (by month)
    const groupedByMonth: Record<string, number[]> = {};
    
    filteredSubmissions.forEach(sub => {
      if (!sub.submissionDate) return;
      
      const date = new Date(sub.submissionDate);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!groupedByMonth[monthYear]) {
        groupedByMonth[monthYear] = [];
      }
      
      groupedByMonth[monthYear].push(sub.score || 0);
    });
    
    const newProgressData = Object.entries(groupedByMonth).map(([month, scores]) => {
      const total = scores.reduce((sum, score) => sum + score, 0);
      const average = scores.length > 0 ? Math.round(total / scores.length) : 0;
      
      return {
        month,
        average,
        count: scores.length
      };
    });
    
    setChartData(newChartData);
    setPieData(newPieData);
    setProgressData(newProgressData);
    
  }, [submissions, selectedScenarioId, scenarios]);
  
  // Get submissions filtered by the selected scenario and with valid scores
  const filteredSubmissions = submissions 
    ? (selectedScenarioId === "all" 
      ? submissions 
      : submissions.filter(sub => sub.scenarioId === parseInt(selectedScenarioId)))
    : [];
    
  // Statistics are calculated based on filtered submission data
    
  // Analytics summary based on filtered submissions
  const totalSubmissions = filteredSubmissions.length || 0;
  
  // Calculate average score from submissions with marked answers or scores
  const submissionsWithScores = filteredSubmissions.filter(sub => {
    // First check if we have marked answers we can calculate from
    if (sub.markedAnswers && typeof sub.markedAnswers === 'string') {
      try {
        const markedAnswers = JSON.parse(sub.markedAnswers);
        const totalQuestions = Object.keys(markedAnswers).length;
        return totalQuestions > 0;
      } catch (e) {
        // If parsing fails, fall back to score check
      }
    }
    
    // Fall back to direct score check
    return sub.score !== undefined && sub.score !== null && !isNaN(Number(sub.score));
  });
  
  // Calculate average score considering both marked answers and direct scores
  const averageScore = submissionsWithScores.length > 0
    ? submissionsWithScores.reduce((sum, sub) => {
        // First try to calculate from marked answers
        if (sub.markedAnswers && typeof sub.markedAnswers === 'string') {
          try {
            const markedAnswers = JSON.parse(sub.markedAnswers);
            const correctCount = Object.values(markedAnswers).filter(Boolean).length;
            const totalQuestions = Object.keys(markedAnswers).length;
            
            if (totalQuestions > 0) {
              return sum + Math.round((correctCount / totalQuestions) * 100);
            }
          } catch (e) {
            // If parsing fails, fall back to direct score
          }
        }
        
        // Fall back to direct score
        return sum + Number(sub.score || 0);
      }, 0) / submissionsWithScores.length
    : 0;
    
  // Find the scenarios for the submissions to get their passing thresholds
  const scenarioMap = scenarios?.reduce((map, scenario) => {
    map.set(scenario.id, scenario);
    return map;
  }, new Map<number, Scenario>()) || new Map();
  
  // Calculate pass rate based on each submission's passing threshold or the passed flag
  const passRate = filteredSubmissions.length > 0
    ? (filteredSubmissions.filter(sub => {
        if (typeof sub.passed === 'boolean') {
          return sub.passed; // Use the instructor-set passed flag if available
        }
        const score = sub.score || 0;
        const scenario = scenarioMap.get(sub.scenarioId);
        const passingThreshold = scenario?.passingThreshold || 70;
        return score >= passingThreshold;
      }).length / filteredSubmissions.length) * 100
    : 0;
  
  // AI Insights mutation
  const getAiInsightsMutation = useMutation({
    mutationFn: async () => {
      const filteredSubmissions = selectedScenarioId === "all" 
        ? submissions || []
        : (submissions || []).filter(sub => sub.scenarioId === parseInt(selectedScenarioId));
      
      // Check if there's enough data for analysis
      if (filteredSubmissions.length < 2) {
        throw new Error("Insufficient data: At least 2-3 submissions are required for meaningful analysis");
      }

      const analyticsData = {
        scenarioName: selectedScenarioName,
        selectedScenarioId: selectedScenarioId,
        totalSubmissions: filteredSubmissions.length,
        averageScore: averageScore,
        passRate: passRate,
        scoreDistribution: chartData,
        passFailRatio: pieData
      };

      try {
        const response = await apiRequest({
          method: "POST", 
          url: "/api/analytics/insights", 
          data: analyticsData
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate analytics insights");
        }
        const data = await response.json();
        return data.insight;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Failed to generate analytics insights");
      }
    },
    onSuccess: (insight: string) => {
      setAiInsight(insight);
      toast({
        title: "AI Analysis Generated",
        description: "Performance data has been analyzed.",
      });
    },
    onError: (error: Error) => {
      // Display modal dialog for insufficient data
      if (error.message.includes("Insufficient data")) {
        setInsufficientDataOpen(true);
      } else {
        toast({
          title: "AI Analysis Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });

  // Color constants
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const PIE_COLORS = ['#4CAF50', '#F44336'];
  
  return (
    <>
      {/* Insufficient Data Dialog */}
      <Dialog open={insufficientDataOpen} onOpenChange={setInsufficientDataOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <span>Insufficient Data for Analysis</span>
            </DialogTitle>
            <DialogDescription>
              At least 2-3 submissions are required to generate meaningful insights.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => setInsufficientDataOpen(false)}
              className="bg-primary hover:bg-primary/90"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
          <CardDescription>Track student performance across scenarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Label htmlFor="scenarioFilter" className="min-w-[80px]">Scenario:</Label>
            <Select
              value={selectedScenarioId}
              onValueChange={(value) => {
                setSelectedScenarioId(value);
                if (value === "all") {
                  setSelectedScenarioName("All Scenarios");
                } else {
                  const scenario = scenarios?.find(s => s.id.toString() === value);
                  if (scenario) {
                    setSelectedScenarioName(scenario.title);
                  }
                }
              }}
            >
              <SelectTrigger id="scenarioFilter" className="w-full max-w-sm">
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scenarios</SelectItem>
                {scenarios?.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id.toString()}>
                    {scenario.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSubmissions}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{passRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="distribution">
            <TabsList className="mb-4">
              <TabsTrigger value="distribution">Score Distribution</TabsTrigger>
              <TabsTrigger value="passrate">Pass/Fail Rate</TabsTrigger>
              <TabsTrigger value="progress">Progress Over Time</TabsTrigger>
            </TabsList>
            
            <TabsContent value="distribution" className="pt-4">
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#FF9500" name="Number of Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="passrate" className="pt-4">
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="progress" className="pt-4">
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={progressData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="average" 
                      stroke="#FF9500" 
                      name="Average Score" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* AI Diagnostics Section */}
          <Card className="mt-8">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    AI Performance Diagnostics
                  </CardTitle>
                  <CardDescription>
                    Get AI-powered insights and recommendations based on performance data
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => getAiInsightsMutation.mutate()}
                  disabled={getAiInsightsMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {getAiInsightsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>Run Diagnosis</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {aiInsight ? (
                <div className="bg-card/50 p-4 rounded-md border border-border text-foreground">
                  {aiInsight}
                </div>
              ) : (
                <div className="bg-card/50 p-4 rounded-md border border-border text-muted-foreground text-center">
                  {getAiInsightsMutation.isPending ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <p>Click "Run Diagnosis" to generate AI insights based on the performance data</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </>
  );
}