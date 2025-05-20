import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { ArrowLeft, Clock, Calendar, Users, User, CheckCircle2 } from "lucide-react";
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
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
            <Badge className={quiz.isActive ? "bg-green-500" : "bg-gray-500"}>
              {quiz.isActive ? "Active" : "Inactive"}
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
              onClick={() => setLocation(`/instructors-portal/quizzes/${quizId}/preview`)}
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
                  <CardTitle>Squadron Performance</CardTitle>
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
                <CardTitle>Quiz Questions</CardTitle>
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