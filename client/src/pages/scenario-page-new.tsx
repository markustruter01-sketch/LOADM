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
import { useAuth } from "@/hooks/use-auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  const { user } = useAuth();
  
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [expandedValue, setExpandedValue] = useState<string | undefined>(undefined);
  
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
      
      const payload = {
        scenarioId,
        userId: user.id,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
          notes: notes[questionId] || ""
        }))
      };
      
      const response = await apiRequest("POST", "/api/scenario-submissions", payload);
      
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
      setShowResults(true);
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
          <div className="relative rounded-xl overflow-hidden shadow-xl mb-8 h-48">
            <img
              src="https://pixabay.com/get/g6a2272a7a8db962bb9c0785fa61ec6059ba077c8a70ca935201dbd65e9850f594bbded54de005975f7cf116008f8b083eaefe8f8bb6ae27fb22b9e6d5262cb99_1280.jpg"
              alt="Air freight logistics"
              className="w-full h-full object-cover"
            />
            <div className="gradient-overlay flex items-end">
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Scenario: {scenario.title}
                </h3>
                <p className="text-muted-foreground max-w-xl">
                  {scenario.description}
                </p>
              </div>
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

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              variant="default"
              onClick={submitAnswers}
              className="min-w-[200px] bg-primary hover:bg-primary/90"
              disabled={submitMutation.isPending}
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
        </div>
      </div>

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