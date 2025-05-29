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

export default function KC30ABasicsQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [, navigate] = useLocation();

  // Quiz questions for KC30-A Basics
  const questions: QuizQuestion[] = [
    {
      question: "What is the main cargo container type used in the KC30-A?",
      options: ["463L Pallets", "AMJ Containers", "LD3 Containers", "ISO Containers"],
      correctAnswer: 2,
      explanation: "The KC30-A primarily uses LD3 containers for cargo operations. These contoured containers are designed to fit the curved lower deck of the aircraft."
    },
    {
      question: "How many LD3 containers can be loaded in the standard KC30-A configuration?",
      options: ["8 containers", "14 containers", "18 containers", "22 containers"],
      correctAnswer: 1,
      explanation: "The KC30-A can accommodate 14 LD3 containers in its standard lower deck cargo configuration, arranged in a 2x7 layout (two rows of seven containers each)."
    },
    {
      question: "What unit of measurement is used for weight calculations in the KC30-A?",
      options: ["Pounds (lbs)", "Kilograms (kg)", "Short tons", "Long tons"],
      correctAnswer: 1,
      explanation: "Unlike some other military aircraft, the KC30-A uses kilograms (kg) as the standard unit of measurement for all weight calculations, which is important for loadmasters to remember when working with this platform."
    },
    {
      question: "What is the maximum cargo payload capacity of the KC30-A?",
      options: ["30,000 kg", "34,000 kg", "38,000 kg", "45,000 kg"],
      correctAnswer: 1,
      explanation: "The KC30-A has a maximum cargo payload capacity of approximately 34,000 kg. This capacity must be balanced with the aircraft's fuel load, especially on missions that involve aerial refueling operations."
    },
    {
      question: "What is the alternative cargo configuration available for the KC30-A?",
      options: [
        "Bulk Loading Only",
        "8-Position Pallet System",
        "24-Container System",
        "Military Module System"
      ],
      correctAnswer: 1,
      explanation: "As an alternative to the standard LD3 layout, the KC30-A can be configured with an 8-position pallet system. This configuration allows for larger, non-containerized loads to be transported."
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
            <h3 className="text-lg font-medium">KC30-A Basics Knowledge Assessment</h3>
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
                ? "Excellent work! You have a solid understanding of KC30-A cargo operations."
                : getScore() >= 60
                  ? "Good job! You've learned the fundamentals of the KC30-A, but there's still room for improvement."
                  : "You might need to review the KC30-A training materials before attempting the quiz again."}
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