import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import InstructorLayout from '@/components/InstructorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, User, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'wouter';

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

export default function QuizSubmissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [squadronFilter, setSquadronFilter] = useState('all');

  const { data: submissions = [], isLoading } = useQuery<QuizSubmission[]>({
    queryKey: ['/api/quiz-submissions'],
    select: (data) => data || []
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users']
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['/api/quizzes']
  });

  // Enhance submissions with user and quiz data
  const enhancedSubmissions = submissions.map(submission => ({
    ...submission,
    user: users.find((u: any) => u.id === submission.userId),
    quiz: quizzes.find((q: any) => q.id === submission.quizId)
  }));

  // Filter submissions
  const filteredSubmissions = enhancedSubmissions.filter(submission => {
    const matchesSearch = !searchTerm || 
      submission.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.quiz?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSquadron = squadronFilter === 'all' || submission.squadron === squadronFilter;
    
    return matchesSearch && matchesSquadron;
  });

  const squadrons = ['AMG', '33SQN', '35SQN', '36SQN', '37SQN'];

  if (isLoading) {
    return (
      <InstructorLayout title="Quiz Submissions">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout title="Quiz Submissions">
      <Helmet>
        <title>Quiz Submissions | Instructor Portal</title>
        <meta name="description" content="Review and manage quiz submissions from students" />
      </Helmet>

      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filter Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by student name, email, or quiz title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={squadronFilter} onValueChange={setSquadronFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by squadron" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Squadrons</SelectItem>
                    {squadrons.map(squadron => (
                      <SelectItem key={squadron} value={squadron}>{squadron}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Total Submissions</p>
                  <p className="text-2xl font-bold">{filteredSubmissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div className="ml-2">
                  <p className="text-sm font-medium">High Scores (≥70%)</p>
                  <p className="text-2xl font-bold text-green-500">
                    {filteredSubmissions.filter(s => s.score >= 70).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-500" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Low Scores (&lt;70%)</p>
                  <p className="text-2xl font-bold text-red-500">
                    {filteredSubmissions.filter(s => s.score < 70).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Avg Score</p>
                  <p className="text-2xl font-bold">
                    {filteredSubmissions.length > 0 
                      ? Math.round(filteredSubmissions.reduce((sum, s) => sum + s.score, 0) / filteredSubmissions.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {filteredSubmissions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Quiz Submissions Found</h3>
                <p className="text-muted-foreground">
                  {submissions.length === 0 
                    ? "No students have submitted any quizzes yet."
                    : "No submissions match your current filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {submission.user?.username || `User ${submission.userId}`}
                        </span>
                        <Badge variant="outline">{submission.squadron}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {submission.quiz?.title || `Quiz ${submission.quizId}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(submission.submissionDate).toLocaleDateString()} at{' '}
                          {new Date(submission.submissionDate).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          submission.score >= 70 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {submission.score}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {submission.answers?.length || 0} questions
                        </div>
                      </div>
                      
                      <Link href={`/instructors-portal/quiz-submissions/${submission.id}`}>
                        <Button size="sm">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </InstructorLayout>
  );
}