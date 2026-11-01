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

export default function C17BasicsQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [, navigate] = useLocation();

  // Quiz questions for C-17 Basics
  const questions: QuizQuestion[] = [
    {
      question: "What is the maximum payload capacity of the C-17 Globemaster III?",
      options: ["120,000 lbs", "140,000 lbs", "164,900 lbs", "200,000 lbs"],
      correctAnswer: 2,
      explanation: "The C-17 Globemaster III has a maximum payload capacity of 164,900 pounds (approximately 74,800 kg)."
    },
    {
      question: "How many standard 463L pallet positions are available in the C-17?",
      options: ["12 positions", "15 positions", "18 positions", "24 positions"],
      correctAnswer: 2,
      explanation: "The C-17 can accommodate 18 standard 463L pallets in its main cargo compartment, arranged in a 2x9 configuration."
    },
    {
      question: "What is the width of the C-17's cargo compartment?",
      options: ["12 feet", "18 feet", "20 feet", "24 feet"],
      correctAnswer: 1,
      explanation: "The C-17's cargo compartment has a width of approximately 18 feet (5.49 meters), providing ample space for oversized cargo."
    },
    {
      question: "What unique capability does the C-17 have compared to smaller tactical airlifters?",
      options: [
        "It can land on aircraft carriers",
        "It can transport main battle tanks",
        "It can fly at supersonic speeds",
        "It can operate with just a single pilot"
      ],
      correctAnswer: 1,
      explanation: "The C-17 can transport main battle tanks and other heavy military equipment that smaller tactical airlifters cannot, making it a true strategic airlifter."
    },
    {
      question: "What is the minimum runway length required for a C-17 at maximum payload?",
      options: ["3,000 feet", "5,000 feet", "7,600 feet", "10,000 feet"],
      correctAnswer: 2,
      explanation: "A C-17 at maximum payload requires approximately 7,600 feet (2,316 meters) of runway for takeoff, though it can operate from shorter runways with reduced loads."
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
            <h3 className="text-lg font-medium">C-17 Basics Knowledge Assessment</h3>
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
                ? "Excellent work! You have a solid understanding of C-17 basics."
                : getScore() >= 60
                  ? "Good job! You've learned the fundamentals of the C-17, but there's still room for improvement."
                  : "You might need to review the C-17 training materials before attempting the quiz again."}
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