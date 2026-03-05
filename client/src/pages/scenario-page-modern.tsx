import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Scenario, ScenarioQuestion } from "@shared/schema";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useIsolatedAuth } from "@/auth-isolated/auth-context";
import SuccessAnimation from "@/components/SuccessAnimation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionDialog } from "@/components/PermissionDialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function ModernScenarioPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useIsolatedAuth();
  const { toast } = useToast();
  const { checkPermission, showPermissionError, showPermissionDialog, setShowPermissionDialog, permissionAction } = usePermissions();

  // State management
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({});
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedSquadron, setSelectedSquadron] = useState("AMG");
  const [isTrainingMode, setIsTrainingMode] = useState(false);

  // Check if we are in training mode based on URL or state
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'training') {
      setIsTrainingMode(true);
      setSubmissionType('training');
    }
  }, []);

  // Fetch user squadron data
  const { data: userSquadron } = useQuery({
    queryKey: ["/api/user/squadron"],
    enabled: !!user,
  });

  // Auto-fill form data when user data is available
  useEffect(() => {
    if (user) {
      setStudentName(user.firstName || "");
      // Use squadron from profile API, fallback to AMG only if no squadron is set
      const squadronValue = userSquadron && typeof userSquadron === 'object' && 'squadron' in userSquadron 
        ? (userSquadron as any).squadron 
        : "AMG";
      setSelectedSquadron(squadronValue);
      console.log('🏷️ AUTO-FILL: Setting squadron to:', squadronValue, 'from user profile');
    }
  }, [user, userSquadron]);
  const [submissionType, setSubmissionType] = useState<"training" | "assessment">("assessment");
  const [score, setScore] = useState(0);

  // Fetch scenario data
  const { data: scenario, isLoading } = useQuery<Scenario>({
    queryKey: [`/api/scenarios/${id}`],
    enabled: !!id,
  });

  // Modern submission mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      console.log('🚀 MODERN SCENARIO SUBMISSION - Starting');
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      if (!scenario) {
        throw new Error("Scenario data not found");
      }

      if (!studentName.trim() || !studentId.trim() || !selectedSquadron) {
        throw new Error("Student name, ID, and squadron are required");
      }

      // Format answers according to modern backend schema
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer: answer || "",
        notes: notes[questionId] || ""
      }));

      console.log('📋 MODERN SUBMISSION - Formatted answers:', formattedAnswers.length);

      const payload = {
        scenarioId: scenario.id,
        answers: formattedAnswers,
        studentName: studentName.trim(),
        studentId: studentId.trim(),
        squadron: selectedSquadron,
        timeSpent: 300,
        notes: `Scenario submission from ${studentName}`,
        submissionType: submissionType
      };

      console.log('📤 MODERN SUBMISSION - Sending payload:', payload);

      const response = await apiRequest({
        method: "POST",
        url: "/api/scenario-submissions",
        body: payload
      });

      // Calculate score for display
      const questions = scenario?.questions as ScenarioQuestion[] || [];
      const multipleChoiceQuestions = questions.filter(q => q.questionType === "multiple-choice" && q.correctAnswer);
      if (multipleChoiceQuestions.length > 0) {
        const correctAnswers = multipleChoiceQuestions.filter(q => 
          answers[q.id] === q.correctAnswer
        ).length;
        const scorePercentage = Math.round((correctAnswers / multipleChoiceQuestions.length) * 100);
        setScore(scorePercentage);
      } else {
        setScore(100);
      }

      console.log('✅ MODERN SUBMISSION - Success');
      return response;
    },
    onSuccess: (response) => {
      console.log('🎉 MODERN SUBMISSION - Triggering success animation');
      
      if (submissionType === 'training') {
        // Training submissions only invalidate user activity history
        queryClient.invalidateQueries({ queryKey: ["/api/user/activity-history"] });
        toast({
          title: "Training Complete",
          description: response.message || "Training scenario completed successfully. Results saved to your activity history.",
        });
      } else {
        // Assessment submissions invalidate instructor portal data
        queryClient.invalidateQueries({ queryKey: ["/api/scenario-submissions"] });
        toast({
          title: "Assessment Submitted",
          description: "Your assessment has been submitted for instructor review.",
        });
      }
      
      setShowSubmissionDialog(false);
      setShowSuccessAnimation(true);
    },
    onError: (error: Error) => {
      console.error('❌ MODERN SUBMISSION - Error:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "An error occurred during submission",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Scenario Not Found</h1>
          <Button onClick={() => setLocation("/scenarios")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scenarios
          </Button>
        </div>
      </div>
    );
  }

  const questions = scenario?.questions as ScenarioQuestion[] || [];
  const allAnswered = questions.every(q => answers[q.id]);

  const handleSubmitClick = () => {
    console.log('🔘 MODERN SCENARIO - Submit button clicked');
    
    if (!checkPermission('canSubmit')) {
      showPermissionError('submit assessments');
      return;
    }
    
    if (!user) {
      console.log('❌ No user - redirecting to auth');
      toast({
        title: "Authentication Required",
        description: "Please login to submit your answers",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    if (!allAnswered) {
      console.log('❌ Not all questions answered');
      toast({
        title: "Incomplete Submission",
        description: "Please answer all questions before submitting",
        variant: "destructive",
      });
      return;
    }
    
    if (isTrainingMode) {
      console.log('🚀 TRAINING MODE - Skipping submission type dialog');
      setSubmissionType('training');
      handleFinalSubmit();
      return;
    }

    console.log('✅ Opening submission dialog');
    setShowSubmissionDialog(true);
  };

  const handleFinalSubmit = () => {
    console.log('🚀 MODERN SCENARIO - Final submit triggered');
    submitMutation.mutate();
  };

  const finishScenario = () => {
    setShowResults(false);
    setLocation("/");
  };

  return (
    <>
      {/* Modern Success Animation */}
      <SuccessAnimation 
        type="submission"
        show={showSuccessAnimation}
        onComplete={() => {
          console.log('🎬 Success animation completed');
          setShowSuccessAnimation(false);
          setShowResults(true);
        }}
      />
      
      <Helmet>
        <title>{scenario.title} - LOADMworkflow</title>
        <meta name="description" content={scenario.description} />
      </Helmet>

      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/scenarios")}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{scenario.title}</h1>
              <p className="text-muted-foreground mt-2">{scenario.description}</p>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Questions ({questions.length})</CardTitle>
              <CardDescription>
                Answer all questions to complete this scenario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="border-b pb-6 last:border-b-0">
                  <h3 className="font-semibold mb-3">
                    {index + 1}. {question.question}
                  </h3>
                  
                  {question.questionType === "multiple-choice" && question.options ? (
                    <RadioGroup
                      value={answers[question.id] || ""}
                      onValueChange={(value) => setAnswers(prev => ({ ...prev, [question.id]: value }))}
                    >
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} />
                          <Label htmlFor={`${question.id}-${optionIndex}`}>{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <Textarea
                      placeholder="Enter your answer..."
                      value={answers[question.id] || ""}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  )}

                  {/* Collapsible Notes section */}
                  <div className="mt-4">
                    <Collapsible 
                      open={notesOpen[question.id] || false} 
                      onOpenChange={(open) => setNotesOpen(prev => ({ ...prev, [question.id]: open }))}
                    >
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
                        >
                          {notesOpen[question.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          Additional Notes (Optional)
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <Textarea
                          id={`notes-${question.id}`}
                          placeholder="Add any additional notes..."
                          value={notes[question.id] || ""}
                          onChange={(e) => setNotes(prev => ({ ...prev, [question.id]: e.target.value }))}
                          className="min-h-[60px]"
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handleSubmitClick}
              disabled={!allAnswered || submitMutation.isPending}
              size="lg"
              className="min-w-[200px]"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Submit All Answers
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Submission Dialog */}
      <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Submission</DialogTitle>
            <DialogDescription>
              Please provide your details to complete the scenario submission
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="student-name">Student Name</Label>
              <Input
                id="student-name"
                placeholder="Enter your full name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="student-id">Student ID</Label>
              <Input
                id="student-id"
                placeholder="Enter your student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="squadron">Squadron</Label>
              <Select value={selectedSquadron} onValueChange={setSelectedSquadron}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your squadron" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="33SQN">33 Squadron</SelectItem>
                  <SelectItem value="35SQN">35 Squadron</SelectItem>
                  <SelectItem value="36SQN">36 Squadron</SelectItem>
                  <SelectItem value="37SQN">37 Squadron</SelectItem>
                  <SelectItem value="AMG">AMG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Submission Type</Label>
              <RadioGroup value={submissionType} onValueChange={(value: "training" | "assessment") => setSubmissionType(value)} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="training" id="training" />
                  <Label htmlFor="training" className="cursor-pointer">
                    <div>
                      <div className="font-medium">Training</div>
                      <div className="text-sm text-muted-foreground">Practice mode - results stay private</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="assessment" id="assessment" />
                  <Label htmlFor="assessment" className="cursor-pointer">
                    <div>
                      <div className="font-medium">Assessment</div>
                      <div className="text-sm text-muted-foreground">Evaluation mode - submitted for instructor review</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSubmissionDialog(false)}
              disabled={submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFinalSubmit}
              disabled={!studentName.trim() || !studentId.trim() || !selectedSquadron || submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Scenario"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center mb-2">
              <DialogTitle className="text-2xl font-bold">Scenario Results</DialogTitle>
              <div className="flex gap-2 no-print">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                  Print
                </Button>
                <Button variant="outline" size="sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Save / Download
                </Button>
                <Button variant="outline" size="sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  AirDrop
                </Button>
              </div>
            </div>
            <DialogDescription>
              {submissionType === 'training' ? 
                `Review your answers for "${scenario.title}". These results were not submitted to an instructor.` :
                `Your assessment for "${scenario.title}" has been submitted for instructor review.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="bg-muted p-4 rounded-lg flex justify-between items-center mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Student Name</p>
                <p className="text-lg font-bold">{studentName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score</p>
                <p className="text-lg font-bold text-orange-500">{score}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <Badge variant="outline" className="capitalize">{submissionType}</Badge>
              </div>
            </div>

            <div className="space-y-8">
              {questions.map((question, index) => (
                <div key={question.id} className="border-b pb-6 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold flex gap-3">
                      <span className="text-muted-foreground">{index + 1}.</span>
                      {question.question}
                    </h4>
                    {question.questionType === "multiple-choice" && (
                      <Badge variant={answers[question.id] === question.correctAnswer ? "success" : "destructive"}>
                        {answers[question.id] === question.correctAnswer ? "Correct" : "Incorrect"}
                      </Badge>
                    )}
                  </div>
                  <div className="ml-8 space-y-2">
                    <div className="p-3 rounded bg-muted/50">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Your Answer:</p>
                      <p>{answers[question.id] || "No answer provided"}</p>
                    </div>
                    {question.correctAnswer && answers[question.id] !== question.correctAnswer && (
                      <div className="p-3 rounded bg-green-500/10 border border-green-500/20">
                        <p className="text-sm font-medium text-green-600 mb-1">Correct Answer:</p>
                        <p>{question.correctAnswer}</p>
                      </div>
                    )}
                    {notes[question.id] && (
                      <div className="p-3 rounded border border-border italic text-sm text-muted-foreground">
                        <span className="font-bold not-italic">Notes:</span> {notes[question.id]}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="no-print">
            <Button onClick={finishScenario} className="w-full">
              Return to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <PermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        action={permissionAction}
      />
    </>
  );
}