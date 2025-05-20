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
import { useAuth } from "@/hooks/use-auth";
import SuccessAnimation from "@/components/SuccessAnimation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

export default function ScenarioPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);
  const { user } = useAuth();
  
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [expandedValue, setExpandedValue] = useState<string | undefined>(undefined);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedSquadron, setSelectedSquadron] = useState<string>("");
  const [showSquadronDialog, setShowSquadronDialog] = useState(false);
  
  const scenarioId = parseInt(id);

  const { data: scenario, isLoading } = useQuery<Scenario>({
    queryKey: [`/api/scenarios/${scenarioId}`],
    enabled: !isNaN(scenarioId),
  });

  const questions = scenario?.questions as ScenarioQuestion[] || [];
  const questionCount = questions.length;
  
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      if (!studentName || !studentId) {
        throw new Error("Student name and ID are required");
      }
      
      // Simplify to a basic string-based answers array for reliability
      // Include squadron information in the answers metadata
      // Sanitize input to prevent HTML/invalid JSON characters
      const sanitizedAnswers = Object.entries(answers).map(([questionId, answer]) => {
        // Basic sanitization to remove HTML and control characters that could break JSON
        const sanitizeText = (text: string) => {
          if (!text) return "";
          // Remove HTML tags and escape special characters
          return text.replace(/<[^>]*>?/gm, '')
                    .replace(/[\\"\u0000-\u001F\u007F-\u009F]/g, '');
        };
        
        return {
          questionId,
          answer: sanitizeText(String(answer)),
          notes: sanitizeText(notes[questionId] || "")
        };
      });
      
      const answersString = JSON.stringify(sanitizedAnswers);
      
      // Use a more basic payload with string-based answers
      // Make sure we have a valid scenario ID before submission
      if (!scenario) {
        throw new Error("Scenario data not found");
      }
      
      const payload = {
        scenarioId: scenario.id,
        userId: user.id,
        studentName,
        studentId,
        squadron: selectedSquadron,
        answers: answersString,
        status: "pending"
      };
      
      const response = await apiRequest({
        method: "POST",
        url: "/api/scenario-submissions",
        data: payload
      });
      
      // Calculate score for multiple choice questions
      const multipleChoiceQuestions = questions.filter(q => q.questionType === "multiple-choice" && q.correctAnswer);
      if (multipleChoiceQuestions.length > 0) {
        const correctAnswers = multipleChoiceQuestions.filter(q => 
          answers[q.id] === q.correctAnswer
        ).length;
        const scorePercentage = Math.round((correctAnswers / multipleChoiceQuestions.length) * 100);
        setScore(scorePercentage);
      } else {
        setScore(100); // Default if no scorable questions
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenario-submissions"] });
      // Show the success animation before showing results
      setShowSubmissionSuccess(true);
      // Results will be shown after animation completes
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit answers",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNotes = (questionId: string, text: string) => {
    setNotes(prev => ({
      ...prev,
      [questionId]: text
    }));
  };
  
  const submitAnswers = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to submit your answers",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    // Check if all questions have answers
    const allAnswered = questions.every(q => answers[q.id]);
    
    if (!allAnswered) {
      toast({
        title: "Incomplete",
        description: "Please answer all questions before submitting",
        variant: "destructive",
      });
      return;
    }
    
    // Show squadron selection dialog instead of submitting directly
    setShowSquadronDialog(true);
  };
  
  // Function to handle the final submission after squadron selection
  const handleFinalSubmit = () => {
    if (!selectedSquadron) {
      toast({
        title: "Squadron Required",
        description: "Please select your squadron before submitting",
        variant: "destructive",
      });
      return;
    }
    
    setShowSquadronDialog(false);
    submitMutation.mutate();
  };
  
  const finishScenario = () => {
    setShowResults(false);
    setLocation("/");
  };

  if (isLoading || !scenario) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Success Animation */}
      <SuccessAnimation 
        type="submission"
        show={showSubmissionSuccess}
        onComplete={() => {
          setShowSubmissionSuccess(false);
          setShowResults(true);
        }}
      />
      
      <Helmet>
        <title>{scenario.title} - LOADMworkflow</title>
        <meta name="description" content={scenario.description} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => setLocation("/")} className="text-primary hover:text-primary/80 mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h2 className="text-2xl font-bold text-foreground">{scenario.title}</h2>
          </div>

          {/* Scenario Context Banner */}
          <div className="relative rounded-xl overflow-hidden shadow-xl mb-8">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-orange-500/20 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                    <rect width="16" height="16" x="4" y="4" rx="2"/>
                    <rect width="6" height="6" x="9" y="9" rx="1"/>
                    <path d="M15 4v16"/>
                    <path d="M4 15h16"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Scenario: {scenario.title}
                </h3>
              </div>
              <p className="text-muted-foreground max-w-xl ml-11">
                {scenario.description}
              </p>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Questions</h3>
              <div className="text-sm text-muted-foreground">
                {Object.keys(answers).length} of {questionCount} answered
              </div>
            </div>
          </div>

          {/* Questions in Accordion */}
          <Accordion 
            type="single" 
            collapsible 
            className="w-full mb-8"
            value={expandedValue}
            onValueChange={setExpandedValue}
          >
            {questions.map((question, index) => (
              <AccordionItem key={question.id} value={question.id} className="border border-border rounded-md mb-4 overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center text-xs font-medium ${
                      answers[question.id] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Question {index + 1}</div>
                      <div className="text-sm text-muted-foreground">
                        {answers[question.id] ? "Answered" : "Unanswered"}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pt-2 pb-4">
                  <div className="mb-6">
                    <p className="mb-4">{question.question}</p>
                    
                    {question.questionType === "multiple-choice" ? (
                      <RadioGroup
                        value={answers[question.id] || ""}
                        onValueChange={(value) => handleAnswer(question.id, value)}
                        className="space-y-3"
                      >
                        {question.options.map((option, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={option}
                              id={`q${index}-option-${idx}`}
                              className="text-primary border-border"
                            />
                            <Label htmlFor={`q${index}-option-${idx}`} className="text-muted-foreground">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <Textarea
                        value={answers[question.id] || ""}
                        onChange={(e) => handleAnswer(question.id, e.target.value)}
                        placeholder="Enter your answer here"
                        rows={4}
                        className="bg-background border-border text-foreground"
                      />
                    )}
                  </div>

                  <div className="border-t border-border pt-4">
                    <h5 className="text-sm font-medium text-card-foreground mb-2">
                      Additional Notes
                    </h5>
                    <Textarea
                      value={notes[question.id] || ""}
                      onChange={(e) => handleNotes(question.id, e.target.value)}
                      placeholder="Enter any additional notes or observations"
                      rows={2}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Student Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>
                Please enter your information before submitting
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="studentName">Full Name</Label>
                <Input 
                  id="studentName"
                  placeholder="Enter your full name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="text-white font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input 
                  id="studentId"
                  placeholder="Enter your student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="text-white font-medium"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              variant="default"
              onClick={submitAnswers}
              className="min-w-[200px] bg-primary hover:bg-primary/90"
              disabled={submitMutation.isPending || !studentName || !studentId}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit All Answers
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          {(!studentName || !studentId) && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Student name and ID are required to submit your answers
            </p>
          )}
        </div>
      </div>

      {/* Squadron Selection Dialog */}
      <Dialog open={showSquadronDialog} onOpenChange={setShowSquadronDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Your Squadron</DialogTitle>
            <DialogDescription>
              Please select which squadron you are submitting this scenario to
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select 
              value={selectedSquadron} 
              onValueChange={setSelectedSquadron}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Squadron" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="33SQN">33SQN</SelectItem>
                <SelectItem value="35SQN">35SQN</SelectItem>
                <SelectItem value="36SQN">36SQN</SelectItem>
                <SelectItem value="37SQN">37SQN</SelectItem>
                <SelectItem value="AMG">AMG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSquadronDialog(false)} className="mr-2">
              Cancel
            </Button>
            <Button onClick={handleFinalSubmit} className="bg-primary hover:bg-primary/90">
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scenario Results</DialogTitle>
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
              Return to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}