import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { ArrowLeft, HelpCircle, AlertCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function QuizPage() {
  const [, params] = useRoute('/quizzes/:id');
  const [, setLocation] = useLocation();
  const quizId = params?.id;
  const { toast } = useToast();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [squadron, setSquadron] = useState<string>("AMG");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<string, {correct: boolean, correctAnswer: string, yourAnswer: string}>>({});
  const [submissionQuestions, setSubmissionQuestions] = useState<any[]>([]);

  const { data: quiz, isLoading } = useQuery({
    queryKey: [`/api/quizzes/${quizId}`],
    queryFn: ({ queryKey, signal }) => fetch(queryKey[0], { signal }).then(res => {
      if (!res.ok) throw new Error('Failed to fetch quiz');
      return res.json();
    }),
    enabled: !!quizId
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: [`/api/quizzes/${quizId}/questions`],
    queryFn: ({ queryKey, signal }) => 
      fetch(queryKey[0], { signal })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch quiz questions');
          return res.json();
        }),
    enabled: !!quizId
  });

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to submit a quiz.",
        variant: "destructive"
      });
      setLocation('/auth');
      return;
    }

    if (Object.keys(answers).length < (questions?.length || 0)) {
      toast({
        title: "Incomplete quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      // Convert answers from record to array format expected by the server
      const answersArray = Object.entries(answers).map(([questionId, answeredOption]) => ({
        questionId,
        answeredOption: parseInt(answeredOption) // Ensure it's always a number
      }));
      
      const response = await apiRequest({
        url: `/api/quizzes/${quizId}/submit`,
        method: 'POST',
        data: {
          userId: user.id,
          answers: answersArray,
          squadron
        }
      });

      setScore(response.score);
      setFeedback(response.feedback || {});
      
      // Store the submission questions for detailed feedback display
      if (response.questions) {
        setSubmissionQuestions(response.questions);
      }
      
      setQuizSubmitted(true);
      
      toast({
        title: "Quiz submitted",
        description: `Your score: ${response.score}%`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}`] });
      
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || questionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!quiz || !questions) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card border border-gray-800 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Quiz not found</h2>
          <p className="text-muted-foreground mb-6">This quiz doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  if (!quiz.isActive) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card border border-gray-800 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-semibold mb-2">Quiz unavailable</h2>
          <p className="text-muted-foreground mb-6">This quiz is currently not active. Please check back later or contact your instructor.</p>
          <Button onClick={() => setLocation('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  if (quizSubmitted) {
    const isPassed = score !== null && score >= 70;
    
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Helmet>
          <title>Quiz Results | LOADMworkflow</title>
          <meta name="description" content="Your quiz results" />
        </Helmet>
        
        <Button 
          variant="outline" 
          className="mb-6" 
          onClick={() => setLocation('/scenarios')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Scenarios
        </Button>
        
        <Card className="mb-8 border-gray-800">
          <CardHeader className={isPassed ? "bg-green-500/10" : "bg-red-500/10"}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">{quiz.title} - Results</CardTitle>
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isPassed ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
              }`}>
                {isPassed ? (
                  <><Check className="h-4 w-4 mr-1" /> Passed</>
                ) : (
                  <><X className="h-4 w-4 mr-1" /> Failed</>
                )}
              </div>
            </div>
            <CardDescription>
              Quiz completed {new Date().toLocaleDateString()} | Squadron: {squadron}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-8 text-center">
              <div className="text-6xl font-bold mb-2">{score}%</div>
              <p className="text-sm text-muted-foreground">
                {isPassed 
                  ? "Congratulations! You've passed this quiz." 
                  : "You didn't pass this quiz. The passing score is 70%."
                }
              </p>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-2">Question Feedback</h3>
              
              {submissionQuestions.length > 0 ? (
                // Use the enhanced questions data from submission response
                submissionQuestions.map((item: any, index: number) => {
                  return (
                    <div 
                      key={item.questionId} 
                      className={`p-4 rounded-lg border ${
                        item.isCorrect 
                          ? "border-green-500/30 bg-green-500/10" 
                          : "border-red-500/30 bg-red-500/10"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-1 ${item.isCorrect ? "text-green-500" : "text-red-500"}`}>
                          {item.isCorrect ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium mb-2">Question {index + 1}: {item.questionText}</p>
                          <div className="mb-2">
                            <p className="text-sm font-medium">
                              Your answer: {item.yourAnswer}
                            </p>
                            {!item.isCorrect && (
                              <p className="text-sm font-medium text-green-500">
                                Correct answer: {item.correctAnswer}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Fallback to using questions if submission data is not available
                questions.map((question: any, index: number) => {
                  const questionFeedback = feedback?.[question.id] || {};
                  const isCorrect = !!questionFeedback.correct;
                  
                  return (
                    <div 
                      key={question.id} 
                      className={`p-4 rounded-lg border ${
                        isCorrect 
                          ? "border-green-500/30 bg-green-500/10" 
                          : "border-red-500/30 bg-red-500/10"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-1 ${isCorrect ? "text-green-500" : "text-red-500"}`}>
                          {isCorrect ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium mb-2">Question {index + 1}: {question.question}</p>
                          <div className="mb-2">
                            <p className="text-sm font-medium">
                              Your answer: {questionFeedback.yourAnswer || (question.options && question.options[Number(answers[question.id])])}
                            </p>
                            {!isCorrect && (
                              <p className="text-sm font-medium text-green-500">
                                Correct answer: {questionFeedback.correctAnswer || "Not available"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setLocation('/scenarios')}>
              Back to Scenarios
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => {
                setAnswers({});
                setQuizSubmitted(false);
                setScore(null);
                setFeedback({});
              }}
            >
              Retry Quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>{quiz.title} | LOADMworkflow</title>
        <meta name="description" content={`Take the ${quiz.title} quiz to test your knowledge`} />
      </Helmet>
      
      <Button 
        variant="outline" 
        className="mb-6" 
        onClick={() => setLocation('/scenarios')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Scenarios
      </Button>
      
      <Card className="mb-8 border-gray-800">
        <CardHeader className="bg-orange-500/10 border-b border-gray-800">
          <CardTitle className="text-2xl font-bold">{quiz.title}</CardTitle>
          <CardDescription>
            {quiz.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {!user ? (
            <div className="text-center p-6">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
              <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
              <p className="text-muted-foreground mb-6">
                You need to be logged in to take this quiz.
              </p>
              <Button 
                onClick={() => setLocation('/auth?redirect=' + encodeURIComponent(window.location.pathname))}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Log In
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-card p-4 rounded-lg border border-gray-800 mb-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Quiz Information</p>
                    <ul className="text-sm text-muted-foreground">
                      <li>• {quiz.questionCount} questions</li>
                      <li>• Passing score: 70%</li>
                      {quiz.expiresAt && (
                        <li>• Expires: {new Date(quiz.expiresAt).toLocaleDateString()}</li>
                      )}
                    </ul>
                  </div>
                  <div className="min-w-[200px]">
                    <p className="text-sm font-medium mb-1">Your Squadron</p>
                    <Select
                      value={squadron}
                      onValueChange={setSquadron}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Squadron" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AMG">AMG</SelectItem>
                        <SelectItem value="33SQN">33SQN</SelectItem>
                        <SelectItem value="35SQN">35SQN</SelectItem>
                        <SelectItem value="36SQN">36SQN</SelectItem>
                        <SelectItem value="37SQN">37SQN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {questions.map((question: any, index: number) => (
                  <Card key={question.id} className="border-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        Question {index + 1}: {question.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={answers[question.id] || ""}
                        onValueChange={(value) => handleAnswerChange(question.id, value)}
                      >
                        <div className="space-y-3">
                          {question.options.map((option: string) => (
                            <div key={option} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                              <Label 
                                htmlFor={`${question.id}-${option}`}
                                className="text-base cursor-pointer"
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {Object.keys(answers).length} of {questions?.length || 0} questions answered
          </div>
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isSubmitting || !user || Object.keys(answers).length < (questions?.length || 0)}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}