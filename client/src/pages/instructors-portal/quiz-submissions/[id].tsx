import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Check, X, Clock, User, Calendar, Award, Building } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface QuizSubmissionDetail {
  id: number;
  quizId: number;
  userId: number;
  submissionDate: string;
  answers: Array<{ questionId: string; answeredOption: number | null }>;
  score: number;
  squadron: string;
  username: string;
  email: string;
  quizTitle: string;
  quizDescription: string;
  status?: 'pending' | 'passed' | 'failed';
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export default function QuizSubmissionDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reviewStatus, setReviewStatus] = useState<'pass' | 'fail' | null>(null);

  // Fetch submission details
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<QuizSubmissionDetail[]>({
    queryKey: ['/api/instructor/quiz-submissions']
  });

  const submission = submissions.find(s => s.id === parseInt(id || ''));

  // Fetch quiz questions if we have a submission
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/quizzes', submission?.quizId, 'questions'],
    enabled: !!submission?.quizId
  });

  // Mark submission mutation
  const markSubmission = useMutation({
    mutationFn: async (status: 'pass' | 'fail') => {
      return apiRequest(`/api/quiz-submissions/${id}/mark`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Quiz submission marked as ${reviewStatus}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/instructor/quiz-submissions'] });
      setLocation('/instructors-portal/quiz-submissions');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update submission status",
        variant: "destructive"
      });
    }
  });

  const handleMarkSubmission = (status: 'pass' | 'fail') => {
    setReviewStatus(status);
    markSubmission.mutate(status);
  };

  if (submissionsLoading || questionsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Submission Not Found</h3>
            <p className="text-muted-foreground mb-4">The quiz submission you're looking for doesn't exist.</p>
            <Link href="/instructors-portal/quiz-submissions">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Submissions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getAnswerText = (questionId: string, answeredOption: number | null) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || answeredOption === null) return 'No answer provided';
    return question.options[answeredOption] || 'Invalid answer';
  };

  const isCorrectAnswer = (questionId: string, answeredOption: number | null) => {
    const question = questions.find(q => q.id === questionId);
    return question && answeredOption === question.correctAnswer;
  };

  const totalQuestions = submission.answers.length;
  const correctAnswers = submission.answers.filter(answer => 
    isCorrectAnswer(answer.questionId, answer.answeredOption)
  ).length;
  const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/instructors-portal/quiz-submissions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Submissions
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Quiz Submission Review</h1>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={() => handleMarkSubmission('pass')}
            disabled={markSubmission.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Mark as Pass
          </Button>
          <Button 
            onClick={() => handleMarkSubmission('fail')}
            disabled={markSubmission.isPending}
            variant="destructive"
          >
            <X className="h-4 w-4 mr-2" />
            Mark as Fail
          </Button>
        </div>
      </div>

      {/* Submission Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>{submission.quizTitle}</span>
          </CardTitle>
          <CardDescription>{submission.quizDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{submission.username}</p>
                <p className="text-xs text-muted-foreground">{submission.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Squadron</p>
                <Badge variant="outline">{submission.squadron}</Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Submitted</p>
                <p className="text-xs text-muted-foreground">{formatDate(submission.submissionDate)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Score</p>
                <p className="text-xs">
                  {correctAnswers}/{totalQuestions} ({percentage.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions and Answers */}
      <Card>
        <CardHeader>
          <CardTitle>Questions and Answers</CardTitle>
          <CardDescription>Review the student's responses to each question</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {submission.answers.map((answer, index) => {
            const question = questions.find(q => q.id === answer.questionId);
            const isCorrect = isCorrectAnswer(answer.questionId, answer.answeredOption);
            
            if (!question) return null;
            
            return (
              <div key={answer.questionId} className="space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium">
                    {index + 1}. {question.question}
                  </h4>
                  <Badge variant={isCorrect ? "default" : "destructive"}>
                    {isCorrect ? "Correct" : "Incorrect"}
                  </Badge>
                </div>
                
                <div className="space-y-2 ml-4">
                  {question.options.map((option, optionIndex) => {
                    const isStudentAnswer = answer.answeredOption === optionIndex;
                    const isCorrectOption = question.correctAnswer === optionIndex;
                    
                    return (
                      <div 
                        key={optionIndex}
                        className={`p-2 rounded border ${
                          isStudentAnswer && isCorrectOption 
                            ? 'bg-green-50 border-green-200' 
                            : isStudentAnswer && !isCorrectOption
                            ? 'bg-red-50 border-red-200'
                            : isCorrectOption
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          <div className="flex space-x-1">
                            {isStudentAnswer && (
                              <Badge variant="outline" className="text-xs">
                                Student's Answer
                              </Badge>
                            )}
                            {isCorrectOption && (
                              <Badge variant="default" className="text-xs">
                                Correct Answer
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {answer.answeredOption === null && (
                    <div className="p-2 rounded border bg-gray-50 border-gray-200">
                      <span className="text-muted-foreground italic">No answer provided</span>
                    </div>
                  )}
                </div>
                
                {index < submission.answers.length - 1 && <Separator />}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}