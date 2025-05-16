import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Scenario, ScenarioQuestion } from "@shared/schema";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
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
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  
  const scenarioId = parseInt(id);

  const { data: scenario, isLoading } = useQuery<Scenario>({
    queryKey: [`/api/scenarios/${scenarioId}`],
    enabled: !isNaN(scenarioId),
  });

  const questions = scenario?.questions as ScenarioQuestion[] || [];
  const questionCount = questions.length;
  const currentQ = questions[currentQuestion];
  
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Calculate score
      let correctAnswers = 0;
      questions.forEach((q) => {
        if (answers[q.id] === q.correctAnswer) {
          correctAnswers++;
        }
      });
      
      const score = Math.round((correctAnswers / questionCount) * 100);
      setScore(score);
      
      const submissionData = {
        scenarioId,
        answers,
        notes,
        score,
      };
      
      const res = await apiRequest("POST", "/api/scenario-submissions", submissionData);
      return await res.json();
    },
    onSuccess: () => {
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
  
  const nextQuestion = () => {
    if (currentQuestion < questionCount - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please login to submit your answers",
          variant: "destructive",
        });
        setLocation("/auth");
        return;
      }
      
      submitMutation.mutate();
    }
  };
  
  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };
  
  const finishScenario = () => {
    setShowResults(false);
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-destructive mb-4">Scenario not found</h2>
            <Button variant="outline" onClick={() => setLocation("/")} className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{scenario.title} - LOADMdocs</title>
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

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground text-sm">Progress</span>
              <span className="text-muted-foreground text-sm">
                {currentQuestion + 1} of {questionCount} questions
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${((currentQuestion + 1) / questionCount) * 100}%` }}
              ></div>
            </div>
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

          {/* Question Card */}
          {currentQ && (
            <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
              <h4 className="text-lg font-semibold text-card-foreground mb-3">
                Question {currentQuestion + 1} of {questionCount}
              </h4>
              <p className="text-muted-foreground mb-6">{currentQ.question}</p>

              {currentQ.questionType === "multiple-choice" ? (
                <RadioGroup
                  value={answers[currentQ.id] || ""}
                  onValueChange={(value) => handleAnswer(currentQ.id, value)}
                  className="space-y-3 mb-6"
                >
                  {currentQ.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option}
                        id={`option-${index}`}
                        className="text-primary border-border"
                      />
                      <Label htmlFor={`option-${index}`} className="text-muted-foreground">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Textarea
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                  placeholder="Enter your answer here"
                  rows={4}
                  className="bg-background border-border text-foreground mb-6"
                />
              )}

              <div className="border-t border-border pt-4">
                <h5 className="text-sm font-medium text-card-foreground mb-2">
                  Additional Notes
                </h5>
                <Textarea
                  value={notes[currentQ.id] || ""}
                  onChange={(e) => handleNotes(currentQ.id, e.target.value)}
                  placeholder="Enter any additional notes or observations"
                  rows={2}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className="text-muted-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={nextQuestion}
              disabled={!answers[currentQ?.id] || submitMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : currentQuestion < questionCount - 1 ? (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Submit
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          
          {/* Results Dialog */}
          <Dialog open={showResults} onOpenChange={setShowResults}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Scenario Results</DialogTitle>
                <DialogDescription>
                  You have completed the {scenario.title} scenario.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-primary mb-2">{score}%</div>
                  <p className="text-muted-foreground">
                    {score >= 80 ? "Excellent work!" : score >= 60 ? "Good job!" : "More practice needed."}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Response Summary:</h4>
                  <ul className="text-sm space-y-1">
                    {questions.map((q, index) => (
                      <li key={index} className="flex items-start">
                        <div className={`w-5 h-5 rounded-full mr-2 flex items-center justify-center ${answers[q.id] === q.correctAnswer ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {answers[q.id] === q.correctAnswer ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <span className="text-xs">✕</span>
                          )}
                        </div>
                        <span className="text-muted-foreground">Question {index + 1}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={finishScenario} className="bg-primary hover:bg-primary/90 text-white">
                  Return Home
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
