import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { ArrowLeft, Clock, Calendar, Users, User, CheckCircle2 } from "lucide-react";
import RecommendationButton from "@/components/RecommendationButton";
import type { Recommendation } from "@/lib/recommendations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InstructorLayout from "../../../components/InstructorLayout";
import { useToast } from "@/hooks/use-toast";

export default function QuizDetails() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/instructors-portal/quizzes/:id');
  const quizId = params?.id;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch quiz details
  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: [`/api/quizzes/${quizId}`],
    queryFn: ({ queryKey, signal }) => fetch(queryKey[0], { signal }).then(res => {
      if (!res.ok) throw new Error('Failed to fetch quiz');
      return res.json();
    }),
    enabled: !!quizId
  });

  // Fetch quiz submissions
  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: [`/api/quizzes/${quizId}/submissions`],
    queryFn: ({ queryKey, signal }) => fetch(queryKey[0], { signal }).then(res => {
      if (!res.ok) throw new Error('Failed to fetch submissions');
      return res.json();
    }),
    enabled: !!quizId
  });

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No date';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Helper function to get category labels
  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      'dangerous-goods': 'Dangerous Goods',
      'loadmaster-fundamentals': 'Fundamentals',
      'emergency-procedures': 'Emergency',
      'weight-balance': 'Weight & Balance',
      'cargo-securing': 'Cargo Securing',
      'aircraft-systems': 'Aircraft Systems',
      'regulations': 'Regulations',
      'equipment-handling': 'Equipment',
    };
    
    return categoryMap[category] || category;
  };

  // Calculate statistics
  const stats = {
    totalAttempts: submissions?.length || 0,
    averageScore: submissions?.length 
      ? Math.round(submissions.reduce((acc: number, sub: any) => acc + sub.score, 0) / submissions.length) 
      : 0,
    passRate: submissions?.length 
      ? Math.round((submissions.filter((sub: any) => sub.score >= 70).length / submissions.length) * 100) 
      : 0
  };

  // Group submissions by squadron
  const submissionsBySquadron = submissions?.reduce((acc: any, sub: any) => {
    const squadron = sub.squadron || 'Unspecified';
    if (!acc[squadron]) acc[squadron] = [];
    acc[squadron].push(sub);
    return acc;
  }, {}) || {};

  const squadronRecommendations = useMemo((): Recommendation[] => {
    const entries = Object.entries(submissionsBySquadron) as [string, any[]][];
    if (entries.length < 2) return [];
    const results: Recommendation[] = [];
    const squadronAvgs = entries.map(([sq, subs]) => ({
      squadron: sq,
      avg: Math.round(subs.reduce((a: number, s: any) => a + s.score, 0) / subs.length),
      count: subs.length
    }));
    const best = Math.max(...squadronAvgs.map(s => s.avg));
    const worst = squadronAvgs.reduce((a, b) => a.avg < b.avg ? a : b);
    if (best - worst.avg > 15) {
      results.push({ priority: 'high', category: 'performance', title: `${worst.squadron} trailing by ${best - worst.avg} points`, body: `${worst.squadron} averages ${worst.avg}% on this quiz compared to the best squadron at ${best}%. Consider targeted revision for ${worst.squadron}.`, action: `Schedule a review session for ${worst.squadron} on this quiz's topics.` });
    }
    for (const sq of squadronAvgs) {
      if (sq.avg < 70) {
        results.push({ priority: sq.avg < 50 ? 'critical' : 'high', category: 'performance', title: `${sq.squadron} below passing threshold (${sq.avg}%)`, body: `${sq.squadron} averages ${sq.avg}% across ${sq.count} attempts on this quiz.`, action: `Provide additional training resources on this quiz's categories for ${sq.squadron}.` });
      }
    }
    return results;
  }, [submissionsBySquadron]);

  const questionRecommendations = useMemo((): Recommendation[] => {
    if (!submissions || submissions.length === 0) return [];
    const questionStats: Record<string, { correct: number; total: number; text: string }> = {};
    for (const sub of submissions) {
      if (!sub.answers) continue;
      const answers = typeof sub.answers === 'string' ? JSON.parse(sub.answers) : sub.answers;
      if (!Array.isArray(answers)) continue;
      for (const ans of answers) {
        const key = ans.questionText || ans.question;
        if (!key) continue;
        if (!questionStats[key]) questionStats[key] = { correct: 0, total: 0, text: key };
        questionStats[key].total++;
        if (ans.isCorrect || ans.correct) questionStats[key].correct++;
      }
    }
    const results: Recommendation[] = [];
    const entries = Object.values(questionStats).filter(q => q.total >= 3);
    const failing = entries.filter(q => (q.correct / q.total) < 0.5);
    if (failing.length === 0) return [];
    const veryHard = failing.filter(q => (q.correct / q.total) < 0.25);
    for (const q of veryHard) {
      const pct = Math.round((q.correct / q.total) * 100);
      const truncated = q.text.length > 80 ? q.text.substring(0, 80) + '...' : q.text;
      results.push({ priority: 'critical', category: 'question', title: `Question failing nearly all students (${pct}% success)`, body: `"${truncated}" — only ${pct}% of ${q.total} attempts are correct. Review for clarity or incorrect answer key.`, action: 'Verify the correct answer and check if this topic is adequately covered in training materials.' });
    }
    const moderate = failing.filter(q => (q.correct / q.total) >= 0.25);
    if (moderate.length > 0) {
      const list = moderate.slice(0, 3).map(q => {
        const pct = Math.round((q.correct / q.total) * 100);
        const t = q.text.length > 60 ? q.text.substring(0, 60) + '...' : q.text;
        return `• "${t}" (${pct}% success, ${q.total} attempts)`;
      }).join('\n');
      results.push({ priority: 'high', category: 'question', title: `${moderate.length} question${moderate.length > 1 ? 's' : ''} with <50% success`, body: `The following questions have low success rates:\n${list}`, action: 'Consider rewording these questions or providing more training on the associated topics.' });
    }
    return results;
  }, [submissions]);

  if (quizLoading) {
    return (
      <InstructorLayout title="Quiz Details">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </InstructorLayout>
    );
  }

  if (!quiz) {
    return (
      <InstructorLayout title="Quiz Details">
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Quiz not found</h2>
          <p className="text-muted-foreground">The quiz you're looking for does not exist or has been deleted.</p>
          <Button 
            className="mt-4" 
            onClick={() => setLocation('/instructors-portal/quizzes')}
          >
            Back to Quizzes
          </Button>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout title="Quiz Details">
      <Helmet>
        <title>{quiz.title} - Quiz Details | LOADMworkflow</title>
        <meta name="description" content={`Details and submissions for ${quiz.title} quiz`} />
      </Helmet>

      <div className="container mb-6">
        <Button 
          variant="outline" 
          className="mb-4" 
          onClick={() => setLocation('/instructors-portal/quizzes')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quizzes
        </Button>

        <div className="bg-card border border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">{quiz.title}</h1>
              <p className="text-muted-foreground mt-1">{quiz.description}</p>
            </div>
            <Badge className={quiz.is_active ? "bg-green-500" : "bg-gray-500"}>
              {quiz.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{formatDate(quiz.createdAt)}</p>
              </div>
            </div>
            {quiz.expiresAt && (
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="text-sm font-medium">{formatDate(quiz.expiresAt)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="text-sm font-medium">{quiz.createdBy?.username || 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="text-sm font-medium">{quiz.questionCount}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {quiz.categories && quiz.categories.map((category: string, index: number) => (
                <Badge key={index} variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                  {getCategoryLabel(category)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              onClick={() => setLocation(`/instructors-portal/quizzes/edit/${quizId}`)}
              variant="outline"
            >
              Edit Quiz
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => setLocation(`/quizzes/${quizId}`)}
            >
              Preview Quiz
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Total Attempts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalAttempts}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Average Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.averageScore}%</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Pass Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.passRate}%</div>
                </CardContent>
              </Card>
            </div>

            {Object.keys(submissionsBySquadron).length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Squadron Performance</CardTitle>
                    <RecommendationButton recommendations={squadronRecommendations} context="Quiz Squadron Performance" />
                  </div>
                  <CardDescription>Average scores by squadron</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(submissionsBySquadron).map(([squadron, subs]: [string, any]) => {
                      const avgScore = Math.round(subs.reduce((acc: number, sub: any) => acc + sub.score, 0) / subs.length);
                      return (
                        <div key={squadron} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Badge variant="outline" className="mr-2">{squadron}</Badge>
                            <span>{subs.length} submissions</span>
                          </div>
                          <div className="font-semibold">{avgScore}%</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="submissions">
            {submissionsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : submissions && submissions.length > 0 ? (
              <div className="bg-card border border-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="px-4 py-3 text-left text-sm font-medium">Student</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Squadron</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Score</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((submission: any) => (
                        <tr key={submission.id} className="border-b border-gray-800">
                          <td className="px-4 py-3 text-sm">{submission.user?.username || 'Unknown'}</td>
                          <td className="px-4 py-3 text-sm">{submission.squadron || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">{formatDate(submission.submissionDate)}</td>
                          <td className="px-4 py-3 text-sm font-medium">{submission.score}%</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge className={submission.score >= 70 ? "bg-green-500" : "bg-red-500"}>
                              {submission.score >= 70 ? "Pass" : "Fail"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setLocation(`/instructors-portal/quizzes/${quizId}/submissions/${submission.id}`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Submissions Yet</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    No students have attempted this quiz yet. Share the quiz link with students to start collecting submissions.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Quiz Questions</CardTitle>
                  <RecommendationButton recommendations={questionRecommendations} context="Quiz Questions" />
                </div>
                <CardDescription>
                  This quiz contains {quiz.questionCount} randomly selected questions from the following categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quiz.categories && quiz.categories.map((category: string, index: number) => (
                    <div key={index} className="p-4 bg-card/50 rounded-lg border border-gray-800">
                      <h3 className="text-lg font-medium mb-2">{getCategoryLabel(category)}</h3>
                      <p className="text-muted-foreground text-sm">
                        Questions are randomly selected from the {getCategoryLabel(category)} category each time the quiz is taken.
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </InstructorLayout>
  );
}