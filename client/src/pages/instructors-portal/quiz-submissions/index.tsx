import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import InstructorLayout from '@/components/InstructorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
  AreaChart,
  Area
} from "recharts";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  Users,
  Medal,
  CheckCircle, 
  XCircle, 
  FileText,
  TrendingUp,
  Award,
  Target,
  Calendar,
  Filter
} from 'lucide-react';

// Color constants for charts
const COLORS = {
  primary: "#FF9500",
  secondary: "#6B7280", 
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  squadrons: {
    "33SQN": "#FF9500",
    "35SQN": "#10B981", 
    "36SQN": "#3B82F6",
    "37SQN": "#8B5CF6",
    "AMG": "#F59E0B"
  },
  scoreRanges: {
    "0-49%": "#EF4444",
    "50-69%": "#F59E0B", 
    "70-89%": "#10B981",
    "90-100%": "#3B82F6"
  }
};

const SQUADRONS = ["33SQN", "35SQN", "36SQN", "37SQN", "AMG"];

interface QuizSubmission {
  id: number;
  quizId: number;
  userId: number;
  submissionDate: string;
  answers: Array<{ questionId: string; answeredOption: number }>;
  score: number;
  squadron: string;
  user?: {
    username: string;
    email: string;
  };
  quiz?: {
    title: string;
    description: string;
  };
}

export default function QuizAnalytics() {
  const [selectedSquadron, setSelectedSquadron] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all");

  const { data: submissions = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/instructor/quiz-submissions'],
    select: (data) => {
      console.log('Quiz submissions data:', data);
      return data || [];
    }
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    select: (data) => data || []
  });

  const { data: quizzes = [] } = useQuery<any[]>({
    queryKey: ['/api/quizzes'],
    select: (data) => data || []
  });

  // Enhanced submissions with user and quiz data
  const enhancedSubmissions = useMemo(() => {
    return submissions.map(submission => {
      const user = users.find((u: any) => u.id === submission.userId);
      const quiz = quizzes.find((q: any) => q.id === submission.quizId);
      
      return {
        ...submission,
        user: user || { username: submission.username, email: submission.email },
        quiz: quiz || { title: submission.quizTitle, description: submission.quizDescription }
      };
    });
  }, [submissions, users, quizzes]);

  // Filter submissions based on selected filters
  const filteredSubmissions = useMemo(() => {
    return enhancedSubmissions.filter(submission => {
      const matchesSquadron = selectedSquadron === 'all' || submission.squadron === selectedSquadron;
      
      let matchesTimeframe = true;
      if (selectedTimeframe !== 'all' && submission.submissionDate) {
        const submissionDate = new Date(submission.submissionDate);
        const now = new Date();
        const daysAgo = parseInt(selectedTimeframe);
        const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        matchesTimeframe = submissionDate >= cutoffDate;
      }
      
      return matchesSquadron && matchesTimeframe;
    });
  }, [enhancedSubmissions, selectedSquadron, selectedTimeframe]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (filteredSubmissions.length === 0) {
      return {
        totalSubmissions: 0,
        averageScore: 0,
        passRate: 0,
        squadronStats: [],
        scoreDistribution: [],
        topPerformers: [],
        quizPerformance: [],
        trends: []
      };
    }

    const totalSubmissions = filteredSubmissions.length;
    const averageScore = Math.round(
      filteredSubmissions.reduce((sum, sub) => sum + sub.score, 0) / totalSubmissions
    );
    const passRate = Math.round(
      (filteredSubmissions.filter(sub => sub.score >= 70).length / totalSubmissions) * 100
    );

    // Squadron performance
    const squadronStats = SQUADRONS.map(squadron => {
      const squadronSubs = filteredSubmissions.filter(sub => sub.squadron === squadron);
      const avgScore = squadronSubs.length > 0 
        ? Math.round(squadronSubs.reduce((sum, sub) => sum + sub.score, 0) / squadronSubs.length)
        : 0;
      const passRateSquadron = squadronSubs.length > 0
        ? Math.round((squadronSubs.filter(sub => sub.score >= 70).length / squadronSubs.length) * 100)
        : 0;
      
      return {
        name: squadron,
        submissions: squadronSubs.length,
        averageScore: avgScore,
        passRate: passRateSquadron,
        color: COLORS.squadrons[squadron as keyof typeof COLORS.squadrons]
      };
    }).filter(stat => stat.submissions > 0);

    // Score distribution
    const scoreRanges = [
      { name: "0-49%", min: 0, max: 49, color: COLORS.scoreRanges["0-49%"] },
      { name: "50-69%", min: 50, max: 69, color: COLORS.scoreRanges["50-69%"] },
      { name: "70-89%", min: 70, max: 89, color: COLORS.scoreRanges["70-89%"] },
      { name: "90-100%", min: 90, max: 100, color: COLORS.scoreRanges["90-100%"] }
    ];

    const scoreDistribution = scoreRanges.map(range => ({
      name: range.name,
      count: filteredSubmissions.filter(sub => sub.score >= range.min && sub.score <= range.max).length,
      color: range.color
    }));

    // Top performers
    const topPerformers = filteredSubmissions
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(sub => ({
        name: sub.user?.username || `User ${sub.userId}`,
        score: sub.score,
        squadron: sub.squadron,
        quizTitle: sub.quiz?.title || `Quiz ${sub.quizId}`
      }));

    // Quiz performance
    const quizPerformanceMap = new Map();
    filteredSubmissions.forEach(sub => {
      const quizTitle = sub.quiz?.title || `Quiz ${sub.quizId}`;
      if (!quizPerformanceMap.has(quizTitle)) {
        quizPerformanceMap.set(quizTitle, { scores: [], count: 0 });
      }
      quizPerformanceMap.get(quizTitle).scores.push(sub.score);
      quizPerformanceMap.get(quizTitle).count++;
    });

    const quizPerformance = Array.from(quizPerformanceMap.entries()).map(([title, data]) => ({
      name: title,
      averageScore: Math.round(data.scores.reduce((a: number, b: number) => a + b, 0) / data.count),
      attempts: data.count,
      passRate: Math.round((data.scores.filter((score: number) => score >= 70).length / data.count) * 100)
    }));

    return {
      totalSubmissions,
      averageScore,
      passRate,
      squadronStats,
      scoreDistribution,
      topPerformers,
      quizPerformance,
      trends: []
    };
  }, [filteredSubmissions]);

  if (isLoading) {
    return (
      <InstructorLayout title="Quiz Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout title="Quiz Analytics">
      <Helmet>
        <title>Quiz Analytics | Instructor Portal</title>
        <meta name="description" content="Comprehensive analytics and insights for quiz performance across squadrons" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Quiz Performance Analytics</h1>
            <p className="text-muted-foreground">Comprehensive insights into quiz performance across all squadrons</p>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedSquadron} onValueChange={setSelectedSquadron}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by squadron" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Squadrons</SelectItem>
                {SQUADRONS.map(squadron => (
                  <SelectItem key={squadron} value={squadron}>
                    {squadron === "33SQN" ? "33 Squadron" :
                     squadron === "35SQN" ? "35 Squadron" :
                     squadron === "36SQN" ? "36 Squadron" :
                     squadron === "37SQN" ? "37 Squadron" :
                     squadron}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Submissions</p>
                  <p className="text-3xl font-bold text-blue-700">{analyticsData.totalSubmissions}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Pass Rate</p>
                  <p className="text-3xl font-bold text-green-700">{analyticsData.passRate}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Average Score</p>
                  <p className="text-3xl font-bold text-orange-700">{analyticsData.averageScore}%</p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Active Squadrons</p>
                  <p className="text-3xl font-bold text-purple-700">{analyticsData.squadronStats.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="squadrons">Squadrons</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Score Distribution
                  </CardTitle>
                  <CardDescription>Distribution of quiz scores across all submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData.scoreDistribution.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.scoreDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, count, percent }) => `${name}: ${count} (${(percent * 100).toFixed(1)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {analyticsData.scoreDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Squadron Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Squadron Performance
                  </CardTitle>
                  <CardDescription>Average scores by squadron</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData.squadronStats.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.squadronStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="averageScore" fill={COLORS.primary} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="squadrons" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsData.squadronStats.map((squadron) => (
                <Card key={squadron.name} className="border-l-4" style={{ borderLeftColor: squadron.color }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{squadron.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Submissions</span>
                      <span className="font-bold">{squadron.submissions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average Score</span>
                      <span className="font-bold">{squadron.averageScore}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pass Rate</span>
                      <span className={`font-bold ${squadron.passRate >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {squadron.passRate}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Quiz Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Quiz Performance Breakdown
                </CardTitle>
                <CardDescription>Performance metrics for each quiz</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData.quizPerformance.length > 0 ? (
                  <div className="space-y-4">
                    {analyticsData.quizPerformance.map((quiz, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{quiz.name}</h4>
                          <Badge variant="outline">{quiz.attempts} attempts</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Average Score: </span>
                            <span className="font-medium">{quiz.averageScore}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pass Rate: </span>
                            <span className={`font-medium ${quiz.passRate >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                              {quiz.passRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No quiz performance data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5" />
                  Top Performers
                </CardTitle>
                <CardDescription>Highest scoring quiz submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData.topPerformers.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.topPerformers.map((performer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{performer.name}</p>
                            <p className="text-sm text-muted-foreground">{performer.quizTitle}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{performer.score}%</p>
                          <Badge variant="outline" className="text-xs">{performer.squadron}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No performance data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {/* Recent Submissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Quiz Submissions
                </CardTitle>
                <CardDescription>Latest quiz submissions from all students</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredSubmissions.length > 0 ? (
                  <div className="space-y-3">
                    {filteredSubmissions.slice(0, 10).map((submission) => (
                      <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${submission.score >= 70 ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="font-medium">{submission.user?.username || `User ${submission.userId}`}</p>
                            <p className="text-sm text-muted-foreground">{submission.quiz?.title || `Quiz ${submission.quizId}`}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${submission.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {submission.score}%
                          </p>
                          <Badge variant="outline" className="text-xs">{submission.squadron}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No submissions available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </InstructorLayout>
  );
}