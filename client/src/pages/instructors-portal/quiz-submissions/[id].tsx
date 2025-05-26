import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Check, X, Clock, User, Calendar, Award, Building, CheckCircle, XCircle } from 'lucide-react';
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
  const [questionMarks, setQuestionMarks] = useState<Record<string, 'correct' | 'incorrect' | null>>({});

  // Fetch submission details
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<QuizSubmissionDetail[]>({
    queryKey: ['/api/instructor/quiz-submissions']
  });

  const submission = submissions.find(s => s.id === parseInt(id || ''));

  // Fetch quiz questions if we have a submission
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/quizzes', submission?.quizId, 'questions'],
    enabled: !!submission?.quizId,
    select: (data) => {
      console.log('Raw questions data:', data);
      return data || [];
    }
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

  const toggleQuestionMark = (questionId: string, mark: 'correct' | 'incorrect') => {
    setQuestionMarks(prev => ({
      ...prev,
      [questionId]: prev[questionId] === mark ? null : mark
    }));
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

  // Calculate instructor marks
  const instructorMarkedCorrect = Object.values(questionMarks).filter(mark => mark === 'correct').length;
  const instructorMarkedIncorrect = Object.values(questionMarks).filter(mark => mark === 'incorrect').length;
  const totalMarkedByInstructor = instructorMarkedCorrect + instructorMarkedIncorrect;

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

      {/* Instructor Review Progress */}
      {totalMarkedByInstructor > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Review Progress</CardTitle>
            <CardDescription>Track your manual marking of this submission</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-500">{instructorMarkedCorrect}</div>
                <div className="text-sm text-muted-foreground">Marked Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{instructorMarkedIncorrect}</div>
                <div className="text-sm text-muted-foreground">Marked Incorrect</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{totalQuestions - totalMarkedByInstructor}</div>
                <div className="text-sm text-muted-foreground">Not Reviewed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions and Answers */}
      <Card>
        <CardHeader>
          <CardTitle>Questions and Answers</CardTitle>
          <CardDescription>Review the student's responses to each question - use the toggle buttons to mark your assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Debug info */}
          <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded">
            <p>Debug: Found {questions.length} questions, {submission.answers.length} answers</p>
            <p>Questions: {questions.map(q => q.id).join(', ')}</p>
            <p>Answer IDs: {submission.answers.map(a => a.questionId).join(', ')}</p>
            <p>Quiz ID: {submission.quizId}</p>
          </div>
          
          {submission.answers.map((answer, index) => {
            const question = questions.find(q => q.id === answer.questionId);
            const isCorrect = isCorrectAnswer(answer.questionId, answer.answeredOption);
            
            console.log('Processing answer:', answer.questionId, 'Found question:', !!question);
            
            if (!question) {
              return (
                <div key={answer.questionId} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">
                      {index + 1}. Question {answer.questionId} (Original question text unavailable)
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Question Missing</Badge>
                      
                      {/* Instructor marking buttons - even for missing questions */}
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant={questionMarks[answer.questionId] === 'correct' ? "default" : "outline"}
                          onClick={() => toggleQuestionMark(answer.questionId, 'correct')}
                          className="h-8 w-8 p-0"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant={questionMarks[answer.questionId] === 'incorrect' ? "destructive" : "outline"}
                          onClick={() => toggleQuestionMark(answer.questionId, 'incorrect')}
                          className="h-8 w-8 p-0"
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 p-3 bg-gray-800 rounded">
                    <p className="text-sm text-muted-foreground">
                      Student's answer: {answer.answeredOption !== null ? `Selected option ${answer.answeredOption + 1}` : 'No answer provided'}
                    </p>
                    <p className="text-xs text-yellow-400 mt-1">
                      Original question data is no longer available, but you can still mark this answer as correct or incorrect based on your assessment.
                    </p>
                    <div className="mt-3 p-2 bg-blue-900/30 border border-blue-500/40 rounded">
                      <p className="text-sm font-medium text-blue-200 mb-1">📋 Correct Answer Reference:</p>
                      <p className="text-xs text-blue-300">
                        Question ID: {answer.questionId} - Check your instructor materials for the correct answer to this specific question.
                      </p>
                    </div>
                  </div>
                  
                  {index < submission.answers.length - 1 && <Separator />}
                </div>
              );
            }
            
            return (
              <div key={answer.questionId} className="space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium">
                    {index + 1}. {question.question}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant={isCorrect ? "default" : "destructive"}>
                      {isCorrect ? "Correct" : "Incorrect"}
                    </Badge>
                    
                    {/* Instructor marking buttons */}
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant={questionMarks[answer.questionId] === 'correct' ? "default" : "outline"}
                        onClick={() => toggleQuestionMark(answer.questionId, 'correct')}
                        className="h-8 w-8 p-0"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant={questionMarks[answer.questionId] === 'incorrect' ? "destructive" : "outline"}
                        onClick={() => toggleQuestionMark(answer.questionId, 'incorrect')}
                        className="h-8 w-8 p-0"
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 ml-4">
                  {/* Instructor Answer Key */}
                  <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-300">Instructor Answer Key</span>
                    </div>
                    <p className="text-sm text-blue-200">
                      <strong>Correct Answer:</strong> Option {question.correctAnswer + 1} - {question.options[question.correctAnswer]}
                    </p>
                    <p className="text-xs text-blue-300 mt-1">
                      Student selected: {answer.answeredOption !== null ? `Option ${answer.answeredOption + 1} - ${question.options[answer.answeredOption]}` : 'No answer'}
                    </p>
                  </div>

                  {question.options.map((option, optionIndex) => {
                    const isStudentAnswer = answer.answeredOption === optionIndex;
                    const isCorrectOption = question.correctAnswer === optionIndex;
                    
                    return (
                      <div 
                        key={optionIndex}
                        className={`p-2 rounded border ${
                          isStudentAnswer && isCorrectOption 
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-500/30' 
                            : isStudentAnswer && !isCorrectOption
                            ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-500/30'
                            : isCorrectOption
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-500/30'
                            : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{optionIndex + 1}. {option}</span>
                          <div className="flex space-x-1">
                            {isStudentAnswer && (
                              <Badge variant="outline" className="text-xs">
                                Student's Choice
                              </Badge>
                            )}
                            {isCorrectOption && (
                              <Badge variant="default" className="text-xs bg-blue-600">
                                ✓ Correct Answer
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {answer.answeredOption === null && (
                    <div className="p-2 rounded border bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600">
                      <span className="text-muted-foreground italic">No answer provided</span>
                    </div>
                  )}

                  {/* Enhanced Correct Answer Display for Instructors */}
                  <div className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-green-300">Correct Answer</span>
                    </div>
                    <p className="text-sm text-green-200">
                      <strong>Option {question.correctAnswer + 1}:</strong> {question.options[question.correctAnswer]}
                    </p>
                    <div className="mt-2 pt-2 border-t border-green-500/20">
                      <p className="text-xs text-green-300">
                        <strong>Student Response:</strong> {answer.answeredOption !== null ? 
                          `Option ${answer.answeredOption + 1}: ${question.options[answer.answeredOption]}` : 
                          'No answer provided'
                        }
                      </p>
                      <p className="text-xs text-green-300 mt-1">
                        <strong>Assessment:</strong> {isCorrect ? 
                          '✅ Student answer is correct' : 
                          '❌ Student answer is incorrect'
                        }
                      </p>
                    </div>
                  </div>
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