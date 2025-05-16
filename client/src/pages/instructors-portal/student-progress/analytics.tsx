import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Scenario, ScenarioSubmission } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function ScenarioAnalytics() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("all");
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  
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
      const score = sub.score || 0;
      if (score < 50) scoreGroups["0-49%"]++;
      else if (score < 70) scoreGroups["50-69%"]++;
      else if (score < 90) scoreGroups["70-89%"]++;
      else scoreGroups["90-100%"]++;
    });
    
    // Transform for charts
    const chartData = Object.entries(scoreGroups).map(([range, count]) => ({
      range,
      count
    }));
    
    // Pie chart data - correct vs incorrect
    const correctCount = filteredSubmissions.reduce((sum, sub) => {
      const score = sub.score || 0;
      return sum + (score >= 70 ? 1 : 0);
    }, 0);
    
    const incorrectCount = filteredSubmissions.length - correctCount;
    
    const pieData = [
      { name: "Pass", value: correctCount },
      { name: "Fail", value: incorrectCount }
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
    
    const progressData = Object.entries(groupedByMonth).map(([month, scores]) => {
      const total = scores.reduce((sum, score) => sum + score, 0);
      const average = scores.length > 0 ? Math.round(total / scores.length) : 0;
      
      return {
        month,
        average,
        count: scores.length
      };
    });
    
    setChartData(chartData);
    setPieData(pieData);
    setProgressData(progressData);
    
  }, [submissions, selectedScenarioId]);
  
  // Analytics summary 
  const totalSubmissions = submissions?.length || 0;
  const averageScore = submissions && submissions.length > 0
    ? submissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / submissions.length
    : 0;
  const passRate = submissions && submissions.length > 0
    ? (submissions.filter(sub => (sub.score || 0) >= 70).length / submissions.length) * 100
    : 0;
  
  // Color constants
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const PIE_COLORS = ['#4CAF50', '#F44336'];
  
  return (
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
            onValueChange={setSelectedScenarioId}
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
      </CardContent>
    </Card>
  );
}