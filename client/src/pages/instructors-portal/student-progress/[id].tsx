import { useState } from "react";
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
import { useAuth } from "@/hooks/use-auth";

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
  const { user } = useAuth();
  
  const submissionId = parseInt(id);
  const [instructorFeedback, setInstructorFeedback] = useState("");
  const [markedAnswers, setMarkedAnswers] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch submission data
  const { data: submission, isLoading: isLoadingSubmission } = useQuery<ScenarioSubmission>({
    queryKey: [`/api/scenario-submissions/${submissionId}`],
    enabled: !isNaN(submissionId),
    onSuccess: (data) => {
      // Initialize feedback if it exists
      if (data.instructorFeedback) {
        setInstructorFeedback(data.instructorFeedback);
      }
      
      // Initialize marked answers if they exist
      if (data.markedAnswers) {
        try {
          const marked = JSON.parse(data.markedAnswers as string);
          if (typeof marked === 'object') {
            setMarkedAnswers(marked);
          }
        } catch (e) {
          console.error("Failed to parse marked answers:", e);
        }
      }
    }
  });
  
  // Fetch scenario data
  const { data: scenario } = useQuery<Scenario>({
    queryKey: ['/api/scenarios', submission?.scenarioId],
    enabled: !!submission?.scenarioId,
  });
  
  const questions = scenario?.questions as ScenarioQuestion[] || [];
  
  // Parse answers from submission
  const answers: AnswerResponse[] = [];
  try {
    if (submission?.answers) {
      const parsedAnswers = JSON.parse(submission.answers as string);
      if (Array.isArray(parsedAnswers)) {
        answers.push(...parsedAnswers);
      }
    }
  } catch (e) {
    console.error("Failed to parse answers:", e);
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
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      
      const payload = {
        instructorFeedback,
        markedAnswers: JSON.stringify(markedAnswers),
        status: "reviewed",
        score,
      };
      
      const response = await apiRequest("PATCH", `/api/scenario-submissions/${submissionId}`, payload);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenario-submissions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/scenario-submissions/${submissionId}`] });
      
      toast({
        title: "Review Saved",
        description: "Your feedback has been saved successfully",
      });
      
      // Navigate back to submissions list
      navigate("/instructors-portal/student-progress");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save review",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle saving review
  const handleSaveReview = () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    saveReviewMutation.mutate();
  };
  
  // Toggle answer correctness
  const toggleCorrectness = (questionId: string) => {
    setMarkedAnswers(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };
  
  // Calculate current score
  const correctAnswers = Object.values(markedAnswers).filter(Boolean).length;
  const totalQuestions = questions.length;
  const currentScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  
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
                                  {currentScore >= 70 ? "PASS" : "FAIL"}
                                </Label>
                                <div className={`w-3 h-3 rounded-full ${currentScore >= 70 ? "bg-green-500" : "bg-red-500"}`}></div>
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
                        className="bg-background border-border text-foreground"
                      />
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
                Cancel
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