import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Award } from "lucide-react";
import { useLocation } from "wouter";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function C130BasicsQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [, navigate] = useLocation();

  // Quiz questions for C-130 Basics
  const questions: QuizQuestion[] = [
    {
      question: "How many standard 463L pallet positions are available in the C-130 Hercules?",
      options: ["6 positions", "8 positions", "10 positions", "12 positions"],
      correctAnswer: 1,
      explanation: "The C-130 Hercules has 8 standard pallet positions for 463L pallets. These are typically arranged in a 2x4 configuration (two rows of four pallets each) in the cargo compartment."
    },
    {
      question: "What is the maximum cargo payload of the standard C-130H Hercules?",
      options: ["15,000 lbs", "20,000 lbs", "25,000 lbs", "30,000 lbs"],
      correctAnswer: 1,
      explanation: "The C-130H Hercules has a maximum cargo payload of approximately 20,000 lbs (9,000 kg). This capacity makes it a versatile medium-lift transport aircraft."
    },
    {
      question: "What specialized offload technique is unique to the C-130?",
      options: ["Rapid Gravity Delivery", "Combat Offload", "Tactical Jettison", "Sequential Evacuation"],
      correctAnswer: 1,
      explanation: "Combat Offload is a specialized technique unique to the C-130 where cargo is rapidly unloaded by applying aircraft brakes while allowing pallets to roll out the rear cargo ramp. This method is used in situations where a forklift or other material handling equipment is not available."
    },
    {
      question: "What is the standard width of the C-130's cargo compartment?",
      options: ["8 feet", "10 feet, 3 inches", "12 feet", "14 feet"],
      correctAnswer: 1,
      explanation: "The C-130's cargo compartment has a standard width of 10 feet, 3 inches (3.12 meters). This dimension is critical for cargo planning and determining what cargo can fit within the aircraft."
    },
    {
      question: "What is the forward restraint requirement for cargo in the C-130?",
      options: ["1.5G", "2G", "3G", "4G"],
      correctAnswer: 2,
      explanation: "For C-130 operations, forward restraint requirements specify that cargo must be secured to withstand 3G forces (three times the cargo weight). This ensures cargo remains secure during takeoff, landing, and potential emergency maneuvers."
    }
  ];

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    if (isCorrect) {
      setCorrectAnswers(correctAnswers + 1);
    }
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleFinishQuiz = () => {
    // Navigate back to training modules
    navigate("/training-modules");
  };

  const getScore = () => {
    return Math.round((correctAnswers / questions.length) * 100);
  };

  return (
    <div className="space-y-6">
      {!quizCompleted ? (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">C-130 Hercules Fundamentals Assessment</h3>
            <span className="text-sm text-muted-foreground">Question {currentQuestion + 1} of {questions.length}</span>
          </div>

          <Card className="border border-gray-800">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-md">
                  <p className="font-medium">{questions[currentQuestion].question}</p>
                </div>

                <RadioGroup
                  value={selectedAnswer !== null ? selectedAnswer.toString() : undefined}
                  onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                >
                  {questions[currentQuestion].options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 py-2">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>

                {showResult && (
                  <Alert variant={selectedAnswer === questions[currentQuestion].correctAnswer ? "default" : "destructive"} className="mt-4">
                    <div className="flex items-start">
                      {selectedAnswer === questions[currentQuestion].correctAnswer ? (
                        <CheckCircle className="h-4 w-4 mt-0.5 mr-2 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 mt-0.5 mr-2" />
                      )}
                      <div>
                        <AlertTitle>
                          {selectedAnswer === questions[currentQuestion].correctAnswer ? "Correct!" : "Incorrect"}
                        </AlertTitle>
                        <AlertDescription className="mt-1">
                          {questions[currentQuestion].explanation}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 pt-2">
              {!showResult ? (
                <Button 
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                >
                  Submit Answer
                </Button>
              ) : (
                <Button onClick={handleNextQuestion}>
                  {currentQuestion < questions.length - 1 ? "Next Question" : "See Results"}
                </Button>
              )}
            </CardFooter>
          </Card>
        </>
      ) : (
        <div className="text-center space-y-6">
          <div className="inline-flex flex-col items-center">
            <div className="relative">
              <Award className="h-24 w-24 text-yellow-500" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold">
                {getScore()}%
              </div>
            </div>
            <h2 className="text-2xl font-bold mt-4">Quiz Completed!</h2>
          </div>

          <div className="bg-card border border-gray-800 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-lg mb-2">Your score: {correctAnswers} out of {questions.length} correct</p>
            <p className="text-muted-foreground mb-4">
              {getScore() >= 80 
                ? "Excellent work! You have a strong understanding of C-130 fundamentals."
                : getScore() >= 60
                  ? "Good job! You've learned the basics of the C-130 Hercules, but there's still room for improvement."
                  : "You might need to review the C-130 training materials before attempting the quiz again."}
            </p>
            <Button 
              onClick={handleFinishQuiz} 
              className="w-full"
            >
              Return to Training Modules
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}