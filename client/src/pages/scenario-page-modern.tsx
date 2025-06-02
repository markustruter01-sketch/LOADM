import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Scenario, ScenarioQuestion } from "@shared/schema";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useIsolatedAuth } from "@/auth-isolated/auth-context";
import SuccessAnimation from "@/components/SuccessAnimation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function ModernScenarioPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useIsolatedAuth();
  const { toast } = useToast();

  // State management
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedSquadron, setSelectedSquadron] = useState("");
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
        notes: `Scenario submission from ${studentName}`
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
    onSuccess: () => {
      console.log('🎉 MODERN SUBMISSION - Triggering success animation');
      queryClient.invalidateQueries({ queryKey: ["/api/scenario-submissions"] });
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

                  {/* Notes section */}
                  <div className="mt-4">
                    <Label htmlFor={`notes-${question.id}`} className="text-sm text-muted-foreground">
                      Additional Notes (Optional)
                    </Label>
                    <Textarea
                      id={`notes-${question.id}`}
                      placeholder="Add any additional notes..."
                      value={notes[question.id] || ""}
                      onChange={(e) => setNotes(prev => ({ ...prev, [question.id]: e.target.value }))}
                      className="mt-1 min-h-[60px]"
                    />
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
                  <SelectItem value="33">33 Squadron</SelectItem>
                  <SelectItem value="35">35 Squadron</SelectItem>
                  <SelectItem value="36">36 Squadron</SelectItem>
                  <SelectItem value="37">37 Squadron</SelectItem>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scenario Complete</DialogTitle>
            <DialogDescription>
              You have completed the "{scenario.title}" scenario
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex justify-center items-center mb-4">
              <div className="bg-muted rounded-full h-32 w-32 flex items-center justify-center">
                <div className="text-2xl font-bold">{score}%</div>
              </div>
            </div>
            <p className="text-center mb-6">
              Thank you for completing this training scenario.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={finishScenario} className="w-full">
              Return to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}