import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Scenario, 
  ScenarioSubmission, 
  ScenarioQuestion 
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, CheckCircle, Loader2, XCircle, BarChart4 } from "lucide-react";
import { format } from 'date-fns';
import { useIsolatedAuth } from "@/auth-isolated/auth-context";

interface AnswerResponse {
  questionId: string;
  answer: string;
  notes: string;
  isCorrect?: boolean;
}

export default function SubmissionReview() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useIsolatedAuth();
  
  const submissionId = parseInt(id);
  const [instructorFeedback, setInstructorFeedback] = useState("");
  const [markedAnswers, setMarkedAnswers] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualPassFail, setManualPassFail] = useState<boolean | null>(null);
  
  // Fetch submission data
  const { data: submission, isLoading: isLoadingSubmission } = useQuery<ScenarioSubmission>({
    queryKey: [`/api/scenario-submissions/${submissionId}`],
    enabled: !isNaN(submissionId),
    onSuccess: (data) => {
      // Initialize feedback if it exists
      if (data.instructorFeedback) {
        setInstructorFeedback(data.instructorFeedback);
      }
      
      // Initialize pass/fail status if it exists
      if (data.passed !== null) {
        setManualPassFail(data.passed);
      }
      
      // Initialize marked answers if they exist
      if (data.markedAnswers) {
        try {
          const marked = JSON.parse(data.markedAnswers as string);
          if (typeof marked === 'object') {
            setMarkedAnswers(marked);
          }
        } catch (e) {
          // Silent fail and continue with empty marked answers
        }
      } else {
        // Reset marked answers if none exist
        setMarkedAnswers({});
      }
    }
  });
  
  // Fetch scenario data
  const { data: scenario } = useQuery<Scenario>({
    queryKey: ['/api/scenarios', submission?.scenarioId],
    enabled: !!submission?.scenarioId,
  });
  
  const questions = scenario?.questions as ScenarioQuestion[] || [];
  
  // Parse answers from submission - new improved approach
  const answers: AnswerResponse[] = [];
  console.log('🔍 DEBUG: Raw submission data:', submission);
  console.log('🔍 DEBUG: submission.answers:', submission?.answers);
  console.log('🔍 DEBUG: typeof submission.answers:', typeof submission?.answers);
  
  try {
    if (submission?.answers) {
      // Direct approach to handle the string format we're receiving from the server
      if (typeof submission.answers === 'string') {
        // Force creation of dummy answers for the scenario if nothing is available
        // This ensures instructors can always provide feedback
        if (questions.length > 0 && !submission.answers.trim()) {
          questions.forEach(q => {
            answers.push({
              questionId: q.id,
              answer: "(No answer provided)",
              notes: ""
            });
          });
        } else {
          try {
            // Parse the JSON string
            const parsed = JSON.parse(submission.answers);
            if (Array.isArray(parsed)) {
              parsed.forEach(item => {
                if (item && typeof item === 'object' && 'questionId' in item) {
                  answers.push({
                    questionId: item.questionId,
                    answer: item.answer || '',
                    notes: item.notes || ''
                  });
                }
              });
            }
          } catch (parseError) {
            console.error("Error parsing answers:", parseError);
          }
        }
      } else if (Array.isArray(submission.answers)) {
        // Handle case where it's already an array
        submission.answers.forEach(item => {
          if (typeof item === 'object' && item !== null && 'questionId' in item) {
            answers.push({
              questionId: item.questionId,
              answer: item.answer || '',
              notes: item.notes || ''
            });
          }
        });
      }
      
      // If we still have no answers but have questions in the scenario, create placeholders
      if (answers.length === 0 && questions.length > 0) {
        questions.forEach(q => {
          answers.push({
            questionId: q.id,
            answer: "(No answer provided)",
            notes: ""
          });
        });
      }
    }
  } catch (e) {
    console.error("Failed to process answers:", e);
    
    // Fallback: Create placeholder answers based on the scenario questions
    if (questions.length > 0) {
      questions.forEach(q => {
        answers.push({
          questionId: q.id,
          answer: "(Error loading answer)",
          notes: ""
        });
      });
    }
  }
  
  // Save review mutation
  const saveReviewMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Calculate score based on marked answers
      const totalQuestions = questions.length;
      const correctAnswers = Object.values(markedAnswers).filter(Boolean).length;
      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      
      console.log(`Calculated score: ${score}% (${correctAnswers}/${totalQuestions} correct)`);
      
      // Use manual pass/fail if provided, otherwise calculate based on threshold
      const passingThreshold = scenario?.passingThreshold || 70; // Default to 70% if not set
      const passed = manualPassFail !== null ? manualPassFail : score >= passingThreshold;
      
      // Validate that pass/fail has been explicitly set
      if (manualPassFail === null) {
        throw new Error("Please mark the submission as Pass or Fail before submitting the review");
      }
      
      const payload = {
        instructorFeedback,
        markedAnswers: markedAnswers, // The server will handle JSON stringification if needed
        status: "reviewed",
        score,
        passed,
      };
      
      const response = await apiRequest({
        method: "PATCH", 
        url: `/api/scenario-submissions/${submissionId}`, 
        data: payload
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenario-submissions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/scenario-submissions/${submissionId}`] });
      
      toast({
        title: "Review Saved",
        description: `Your feedback has been saved successfully. The submission has been marked as ${manualPassFail ? 'Pass' : 'Fail'}.`,
      });
      
      // Navigate back to submissions list
      navigate("/instructors-portal/student-progress");
    },
    onError: (error: Error) => {
      // Special handling for missing pass/fail decision
      if (error.message.includes("mark the submission as Pass or Fail")) {
        toast({
          title: "Action Required",
          description: "Please mark the submission as Pass or Fail before submitting your review.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to save review",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });
  
  // Handle saving review with pass/fail validation
  const handleSaveReview = () => {
    if (isSubmitting) return;
    
    // Validate that pass/fail decision has been made
    if (manualPassFail === null) {
      toast({
        title: "Action Required",
        description: "Please mark the submission as Pass or Fail before submitting your review.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    saveReviewMutation.mutate();
  };
  
  // Toggle answer correctness with improved reactivity
  const toggleCorrectness = (questionId: string) => {
    setMarkedAnswers(prev => {
      const newState = {
        ...prev,
        [questionId]: !prev[questionId]
      };
      
      return newState;
    });
  };
  
  // Calculate current score and make it reactive to changes in real-time
  const correctAnswers = useMemo(() => {
    return Object.values(markedAnswers).filter(Boolean).length || 0;
  }, [markedAnswers]);
  
  const totalQuestions = questions.length || 0;
  
  const currentScore = useMemo(() => {
    return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  }, [correctAnswers, totalQuestions]);
  
  // Score calculation is now reactive to marking changes
  
  if (isLoadingSubmission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (!submission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h3 className="text-xl font-medium mb-2">Submission Not Found</h3>
          <p className="text-muted-foreground mb-6">The requested submission could not be found</p>
          <Link href="/instructors-portal/student-progress">
            <Button>Return to Student Progress</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Review Submission - LOADMworkflow</title>
        <meta name="description" content="Review and grade student scenario submissions" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="flex items-center mb-6">
          <Link href="/instructors-portal/student-progress">
            <Button variant="ghost" className="text-primary hover:text-primary/80 mr-4 p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-foreground">Review Submission</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student & Scenario Info */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Name</h3>
                  <p className="font-medium">{submission.studentName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Student ID</h3>
                  <p className="font-medium">{submission.studentId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Submission Date</h3>
                  <p className="font-medium">
                    {submission.submissionDate ? 
                      format(new Date(submission.submissionDate), 'MMM d, yyyy h:mm a') : 
                      'Unknown date'}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Scenario</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-medium text-lg mb-2">{scenario?.title}</h3>
                <p className="text-muted-foreground">{scenario?.description}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Current Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-6">
                <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-muted mb-4">
                  <span className="text-3xl font-bold">{currentScore}%</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {correctAnswers} correct out of {totalQuestions} questions
                </p>
                
                {/* Pass/Fail indicator based on custom threshold */}
                {submission?.status === "reviewed" && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center gap-2">
                      {(() => {
                        const passingThreshold = scenario?.passingThreshold || 70;
                        const passed = currentScore >= passingThreshold;
                        return (
                          <>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              passed 
                                ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400" 
                                : "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"
                            }`}>
                              {passed ? "PASS" : "FAIL"}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              Threshold: {passingThreshold}%
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Student Answers & Grading */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="review">
              <TabsList className="mb-6">
                <TabsTrigger value="review">Review Answers</TabsTrigger>
                <TabsTrigger value="feedback">Instructor Feedback</TabsTrigger>
              </TabsList>
              
              <TabsContent value="review" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Answers</CardTitle>
                    <CardDescription>Review and mark answers as correct or incorrect</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {answers.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-2">No answers found in this submission</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Visual marking guide */}
                        <div className="flex justify-between items-center px-3 py-3 bg-muted rounded-md mb-4">
                          <div className="text-sm font-medium">Mark each answer as correct or incorrect</div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 rounded-full bg-green-500"></div>
                              <span className="text-sm">Correct</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 rounded-full bg-red-500"></div>
                              <span className="text-sm">Incorrect</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Answer list */}
                        <div className="space-y-4">
                          {answers.map((answer, index) => {
                            const question = questions.find(q => q.id === answer.questionId);
                            const isCorrect = markedAnswers[answer.questionId] || false;
                            
                            return (
                              <div key={answer.questionId} className="border border-border rounded-md overflow-hidden">
                                <div className="flex items-center justify-between p-4 bg-card">
                                  <div className="flex items-center">
                                    <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center text-xs font-medium ${
                                      isCorrect 
                                        ? "bg-green-500 text-white" 
                                        : "bg-red-500 text-white"
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <div>
                                      <h4 className="font-medium">{question?.question || `Question ${index + 1}`}</h4>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <Label htmlFor={`mark-${answer.questionId}`} className="font-medium text-sm">
                                      {isCorrect ? "Correct" : "Incorrect"}
                                    </Label>
                                    <Switch
                                      id={`mark-${answer.questionId}`}
                                      checked={isCorrect}
                                      onCheckedChange={() => toggleCorrectness(answer.questionId)}
                                    />
                                  </div>
                                </div>
                                <div className="p-4 border-t border-border">
                                  <div className="space-y-4">
                                    <div>
                                      <h5 className="text-sm font-medium text-muted-foreground mb-2">Student's Answer:</h5>
                                      <div className="bg-muted p-3 rounded-md">
                                        {answer.answer || <span className="text-muted-foreground italic">No answer provided</span>}
                                      </div>
                                    </div>
                                    
                                    {question?.questionType === "multiple-choice" && question?.correctAnswer && (
                                      <div>
                                        <h5 className="text-sm font-medium text-muted-foreground mb-2">Expected Answer:</h5>
                                        <div className="bg-muted/50 p-3 rounded-md">
                                          {question.correctAnswer}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {answer.notes && (
                                      <div>
                                        <h5 className="text-sm font-medium text-muted-foreground mb-2">Student Notes:</h5>
                                        <div className="bg-muted/50 p-3 rounded-md text-muted-foreground">
                                          {answer.notes}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Overall assessment */}
                        <div className="bg-card border border-border rounded-md p-4 mt-8">
                          <h4 className="font-medium mb-4">Overall Assessment</h4>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">
                                {correctAnswers} out of {totalQuestions} correct ({currentScore}%)
                              </div>
                              <div className="flex items-center space-x-2">
                                <Label htmlFor="pass-fail" className="font-medium">
                                  {currentScore >= (scenario?.passingThreshold || 70) ? "PASS" : "FAIL"}
                                </Label>
                                <div className={`w-3 h-3 rounded-full ${currentScore >= (scenario?.passingThreshold || 70) ? "bg-green-500" : "bg-red-500"}`}></div>
                              </div>
                            </div>
                            <div className="text-xl font-bold">
                              {currentScore}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="feedback" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Provide Feedback</CardTitle>
                    <CardDescription>Enter feedback for the student on their submission</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-4">
                            <CheckCircle className="text-green-500" />
                            <span className="font-medium">Strengths</span>
                          </div>
                          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                            <li>Clear understanding of key concepts</li>
                            <li>Good attention to detail</li>
                            <li>Well-structured responses</li>
                          </ul>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-4">
                            <XCircle className="text-red-500" />
                            <span className="font-medium">Areas for Improvement</span>
                          </div>
                          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                            <li>Review technical terminology</li>
                            <li>Consider safety regulations</li>
                            <li>Focus on procedural sequence</li>
                          </ul>
                        </div>
                      </div>
                      
                      <Label htmlFor="instructorFeedback" className="font-medium">
                        Detailed Feedback
                      </Label>
                      <Textarea
                        id="instructorFeedback"
                        placeholder="Provide detailed feedback for the student..."
                        rows={8}
                        value={instructorFeedback}
                        onChange={(e) => setInstructorFeedback(e.target.value)}
                        className="bg-background border-border text-foreground mb-6"
                      />
                      
                      <div className="bg-muted p-4 rounded-md">
                        <h4 className="font-semibold text-lg mb-3">Final Assessment Decision</h4>
                        <p className="text-muted-foreground mb-4">
                          Please mark this submission explicitly as Pass or Fail. This decision will be used for analytics.
                        </p>
                        
                        <div className="flex space-x-10">
                          <div 
                            className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors ${
                              manualPassFail === true ? 'bg-green-100 dark:bg-green-900' : 'hover:bg-muted-foreground/10'
                            }`}
                            onClick={() => setManualPassFail(true)}
                          >
                            <div className={`w-6 h-6 rounded-full ${
                              manualPassFail === true ? 'bg-green-500' : 'border-2 border-muted-foreground'
                            } flex items-center justify-center`}>
                              {manualPassFail === true && (
                                <CheckCircle className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <span className={`${manualPassFail === true ? 'font-semibold' : ''}`}>
                              Pass
                            </span>
                          </div>
                          
                          <div 
                            className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors ${
                              manualPassFail === false ? 'bg-red-100 dark:bg-red-900' : 'hover:bg-muted-foreground/10'
                            }`}
                            onClick={() => setManualPassFail(false)}
                          >
                            <div className={`w-6 h-6 rounded-full ${
                              manualPassFail === false ? 'bg-red-500' : 'border-2 border-muted-foreground'
                            } flex items-center justify-center`}>
                              {manualPassFail === false && (
                                <XCircle className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <span className={`${manualPassFail === false ? 'font-semibold' : ''}`}>
                              Fail
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => navigate("/instructors-portal/student-progress")}
                className="mr-2"
              >
                Back to Submissions
              </Button>
              <Button
                onClick={handleSaveReview}
                className="bg-primary hover:bg-primary/90"
                disabled={saveReviewMutation.isPending}
              >
                {saveReviewMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Save Review</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}