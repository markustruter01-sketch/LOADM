import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Scenario, ScenarioQuestion } from "@shared/schema";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [selectedSquadron, setSelectedSquadron] = useState("33SQN");
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
      // Use squadron from profile API — squadron is auto-populated and read-only
      const squadronValue = userSquadron && typeof userSquadron === 'object' && 'squadron' in userSquadron 
        ? ((userSquadron as any).squadron || "33SQN")
        : "33SQN";
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
    mutationFn: async (overrideType?: "training" | "assessment") => {
      console.log('🚀 MODERN SCENARIO SUBMISSION - Starting');
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      if (!scenario) {
        throw new Error("Scenario data not found");
      }

      // For training mode, studentId is not required - use user's account ID as fallback
      const effectiveStudentName = studentName.trim() || user.firstName || user.email || "Student";
      const effectiveStudentId = studentId.trim() || String(user.id);
      const effectiveSquadron = selectedSquadron || "33SQN";

      if (!effectiveStudentName || !effectiveStudentId) {
        throw new Error("Student name and ID are required");
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
        studentName: effectiveStudentName,
        studentId: effectiveStudentId,
        squadron: effectiveSquadron,
        timeSpent: 300,
        notes: `Scenario submission from ${effectiveStudentName}`,
        submissionType: overrideType || submissionType
      };

      console.log('📤 MODERN SUBMISSION - Sending payload:', payload);

      const response = await apiRequest({
        method: "POST",
        url: "/api/scenario-submissions",
        body: payload
      });

      // Calculate score for display
      const questions = scenario?.questions as ScenarioQuestion[] || [];
      const gradableQuestions = questions.filter(q =>
        ['multiple-choice', 'multiple-choice-quiz', 'true-false'].includes(q.questionType) && q.correctAnswer
      );
      if (gradableQuestions.length > 0) {
        const correctAnswers = gradableQuestions.filter(q => {
          const studentAnswer = answers[q.id];
          if (!studentAnswer) return false;
          // Support both index-based correctAnswer (new format) and text-based (legacy format)
          const correctIdx = parseInt(q.correctAnswer || "");
          if (!isNaN(correctIdx) && q.options && q.options[correctIdx]) {
            return studentAnswer === q.options[correctIdx];
          }
          return studentAnswer === q.correctAnswer;
        }).length;
        const scorePercentage = Math.round((correctAnswers / gradableQuestions.length) * 100);
        setScore(scorePercentage);
      } else {
        setScore(100);
      }

      console.log('✅ MODERN SUBMISSION - Success');
      return response;
    },
    onSuccess: (response, overrideType) => {
      console.log('🎉 MODERN SUBMISSION - Triggering success animation');
      
      const effectiveType = overrideType || submissionType;
      if (effectiveType === 'training') {
        queryClient.invalidateQueries({ queryKey: ["/api/user/activity-history"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/scenario-submissions"] });
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
      submitMutation.mutate('training');
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

  const generateResultsText = () => {
    if (!scenario) return "";
    const lines: string[] = [
      `SCENARIO RESULTS: ${scenario.title}`,
      `Student: ${studentName || user?.firstName || "Unknown"}`,
      `Score: ${score}%`,
      `Type: ${submissionType === 'training' ? 'Training (Private)' : 'Assessment (Instructor Review)'}`,
      `Date: ${new Date().toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
      `Squadron: ${selectedSquadron}`,
      "",
      "═".repeat(50),
      "",
    ];
    questions.forEach((q, i) => {
      const userAnswer = answers[q.id] || "No answer provided";
      const isCorrect = q.correctAnswer && answers[q.id] === q.correctAnswer;
      lines.push(`Q${i + 1}: ${q.question}`);
      lines.push(`  Your Answer: ${userAnswer}`);
      if (q.correctAnswer) {
        lines.push(`  Correct Answer: ${q.correctAnswer}`);
        lines.push(`  Result: ${isCorrect ? "✓ Correct" : "✗ Incorrect"}`);
      }
      if (notes[q.id]) lines.push(`  Notes: ${notes[q.id]}`);
      lines.push("");
    });
    lines.push("═".repeat(50));
    lines.push("Generated by LOADMworkflow - For training purposes only");
    return lines.join("\n");
  };

  const handlePrint = () => {
    if (!scenario) return;
    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${scenario.title} - Results</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #000; background: #fff; }
          h1 { font-size: 20px; border-bottom: 2px solid #f97316; padding-bottom: 8px; }
          .meta { display: flex; gap: 40px; background: #f3f4f6; padding: 12px; border-radius: 6px; margin: 16px 0; }
          .meta-item label { font-size: 11px; color: #6b7280; display: block; }
          .meta-item span { font-weight: bold; font-size: 14px; }
          .question { margin: 16px 0; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; }
          .question h3 { font-size: 13px; margin: 0 0 8px; }
          .answer { background: #f9fafb; padding: 8px; border-radius: 4px; font-size: 13px; }
          .correct { background: #d1fae5; padding: 8px; border-radius: 4px; font-size: 13px; margin-top: 4px; }
          .incorrect { color: #dc2626; font-size: 12px; }
          .notes { font-style: italic; color: #6b7280; font-size: 12px; margin-top: 4px; }
          .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>Scenario Results: ${scenario.title}</h1>
        <div class="meta">
          <div class="meta-item"><label>Student</label><span>${studentName || user?.firstName || "Unknown"}</span></div>
          <div class="meta-item"><label>Score</label><span>${score}%</span></div>
          <div class="meta-item"><label>Type</label><span>${submissionType === 'training' ? 'Training' : 'Assessment'}</span></div>
          <div class="meta-item"><label>Date</label><span>${new Date().toLocaleDateString('en-AU')}</span></div>
          <div class="meta-item"><label>Squadron</label><span>${selectedSquadron}</span></div>
        </div>
        ${questions.map((q, i) => {
          const userAnswer = answers[q.id] || "No answer provided";
          const isCorrect = q.correctAnswer && answers[q.id] === q.correctAnswer;
          return `
            <div class="question">
              <h3>Q${i + 1}: ${q.question}</h3>
              <div class="answer"><strong>Your Answer:</strong> ${userAnswer}</div>
              ${q.correctAnswer ? `<div class="correct"><strong>Correct Answer:</strong> ${q.correctAnswer} ${isCorrect ? "✓" : "<span class='incorrect'>✗ Incorrect</span>"}</div>` : ""}
              ${notes[q.id] ? `<div class="notes"><strong>Notes:</strong> ${notes[q.id]}</div>` : ""}
            </div>
          `;
        }).join("")}
        <div class="footer">Generated by LOADMworkflow &bull; For training purposes only</div>
      </body>
      </html>
    `;
    const pw = window.open("", "_blank");
    if (pw) {
      pw.document.write(printHtml);
      pw.document.close();
      pw.focus();
      pw.print();
    }
  };

  const handleDownload = () => {
    if (!scenario) return;
    const content = generateResultsText();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scenario.title.replace(/[^a-z0-9]/gi, "-")}-results-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!scenario) return;
    const text = generateResultsText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${scenario.title} - Scenario Results`,
          text,
        });
      } catch (err) {
        // User cancelled or share failed - fall back to clipboard
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard", description: "Results copied — paste to share." });
      }
    } else {
      // Desktop fallback — copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard", description: "Results copied — paste to share with your instructor." });
      } catch {
        toast({ title: "Share unavailable", description: "Use Print or Download to share your results.", variant: "destructive" });
      }
    }
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
          if (isTrainingMode) {
            setShowResults(true);
          } else {
            setLocation("/scenarios");
          }
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
                  
                  {(question.questionType === "multiple-choice" || question.questionType === "multiple-choice-quiz" || question.questionType === "true-false") && question.options ? (
                    <RadioGroup
                      value={answers[question.id] || ""}
                      onValueChange={(value) => setAnswers(prev => ({ ...prev, [question.id]: value }))}
                    >
                      {question.options.filter((o: string) => o).map((option: string, optionIndex: number) => (
                        <div key={optionIndex} className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                          answers[question.id] === option
                            ? "border-orange-500/60 bg-orange-900/10"
                            : "border-border hover:border-orange-500/30"
                        }`}>
                          <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} className="accent-orange-500" />
                          <Label htmlFor={`${question.id}-${optionIndex}`} className="cursor-pointer flex-1">
                            {question.questionType === "true-false" ? option : (
                              <span><span className="font-semibold text-orange-400 mr-2">{String.fromCharCode(65 + optionIndex)}.</span>{option}</span>
                            )}
                          </Label>
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
                </SelectContent>
              </Select>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto pt-10">
          <DialogHeader>
            <div className="flex justify-between items-center mb-2">
              <DialogTitle className="text-2xl font-bold">Scenario Results</DialogTitle>
              <div className="flex gap-2 no-print">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                  Print
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Save / Download
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                  AirDrop / Share
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
                    {['multiple-choice', 'multiple-choice-quiz', 'true-false'].includes(question.questionType) && question.correctAnswer && (
                      (() => {
                        const studentAns = answers[question.id];
                        const correctIdx = parseInt(question.correctAnswer || "");
                        const correctText = (!isNaN(correctIdx) && question.options?.[correctIdx])
                          ? question.options[correctIdx]
                          : question.correctAnswer;
                        const isRight = studentAns === correctText;
                        return (
                          <Badge variant="outline" className={isRight ? "border-green-500 text-green-500 bg-green-500/10" : "border-red-500 text-red-500 bg-red-500/10"}>
                            {isRight ? "✓ Correct" : "✗ Incorrect"}
                          </Badge>
                        );
                      })()
                    )}
                  </div>
                  <div className="ml-8 space-y-2">
                    <div className="p-3 rounded bg-muted/50">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Your Answer:</p>
                      <p>{answers[question.id] || "No answer provided"}</p>
                    </div>
                    {question.correctAnswer && (() => {
                      const studentAns = answers[question.id];
                      const correctIdx = parseInt(question.correctAnswer || "");
                      const correctText = (!isNaN(correctIdx) && question.options?.[correctIdx])
                        ? question.options[correctIdx]
                        : question.correctAnswer;
                      if (studentAns === correctText) return null;
                      return (
                        <div className="p-3 rounded bg-green-500/10 border border-green-500/20">
                          <p className="text-sm font-medium text-green-600 mb-1">Correct Answer:</p>
                          <p>{correctText}</p>
                        </div>
                      );
                    })()}
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