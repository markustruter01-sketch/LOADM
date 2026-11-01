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

export default function C27JBasicsQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [, navigate] = useLocation();

  // Quiz questions for C-27J Basics
  const questions: QuizQuestion[] = [
    {
      question: "What is the maximum payload capacity of the C-27J Spartan?",
      options: ["8,500 kg", "11,300 kg", "15,000 kg", "18,000 kg"],
      correctAnswer: 1,
      explanation: "The C-27J Spartan has a maximum cargo payload of approximately 11,300 kg (24,910 lbs). This capacity allows it to transport a significant amount of cargo while still maintaining the ability to operate from austere airfields."
    },
    {
      question: "How many standard 463L pallets can be carried in the C-27J Spartan?",
      options: ["3 pallets", "6 pallets", "9 pallets", "12 pallets"],
      correctAnswer: 1,
      explanation: "The C-27J Spartan can carry up to 6 standard 463L pallets in its cargo compartment. These are typically arranged in a 2x3 configuration (two rows of three pallets each)."
    },
    {
      question: "What is a key operational advantage of the C-27J Spartan?",
      options: [
        "Intercontinental range",
        "Operation from short, unprepared airfields",
        "Supersonic cruise capability",
        "All-weather stealth capabilities"
      ],
      correctAnswer: 1,
      explanation: "The C-27J's primary advantage is its ability to operate from short, unprepared airfields. This capability allows it to deliver cargo to forward operating locations that may not be accessible to larger transport aircraft."
    },
    {
      question: "What is the standard cargo floor length of the C-27J Spartan?",
      options: ["6.6 meters", "9.1 meters", "11.3 meters", "14.2 meters"],
      correctAnswer: 1,
      explanation: "The C-27J has a cargo floor length of 9.1 meters (29.8 feet). This dimension is critical for cargo planning and determining what cargo can be transported within the aircraft."
    },
    {
      question: "Which of the following mission types is the C-27J Spartan specifically optimized for?",
      options: [
        "Strategic airlift between major bases",
        "Tactical transport to forward locations",
        "Primary aerial refueling platform",
        "Long-range passenger transport"
      ],
      correctAnswer: 1,
      explanation: "The C-27J is specifically optimized for tactical transport missions to forward locations. It bridges the gap between helicopters and larger transport aircraft, offering capabilities that make it ideal for delivering cargo and personnel to locations with limited infrastructure."
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
            <h3 className="text-lg font-medium">C-27J Spartan Fundamentals Assessment</h3>
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
                ? "Excellent work! You have a strong understanding of C-27J Spartan fundamentals."
                : getScore() >= 60
                  ? "Good job! You've learned the basics of the C-27J Spartan, but there's still room for improvement."
                  : "You might need to review the C-27J training materials before attempting the quiz again."}
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