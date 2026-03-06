import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Scenario, ScenarioQuestion, insertScenarioSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, BookOpen, CheckCircle, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const QUESTION_TYPES = [
  { value: "free-text", label: "Text (Free Response)" },
  { value: "multiple-choice", label: "Multiple Choice" },
  { value: "multiple-choice-quiz", label: "Multiple Choice (from Quiz Library)" },
  { value: "true-false", label: "True / False" },
] as const;

const QUIZ_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "dangerous-goods", label: "Dangerous Goods" },
  { value: "loadmaster-fundamentals", label: "Loadmaster Fundamentals" },
  { value: "emergency-procedures", label: "Emergency Procedures" },
  { value: "weight-balance", label: "Weight & Balance" },
  { value: "cargo-securing", label: "Cargo Securing" },
  { value: "aircraft-systems", label: "Aircraft Systems" },
  { value: "regulations", label: "Regulations" },
  { value: "equipment-handling", label: "Equipment Handling" },
];

type QuizLibraryQuestion = {
  id: string; question: string; options: string[]; correctAnswer: number; category: string; difficulty: string;
};

// Define form types
const scenarioFormSchema = insertScenarioSchema.extend({
  questions: z.array(
    z.object({
      id: z.string().min(1, "Question ID is required").default(""),
      question: z.string().min(1, "Question text is required"),
      questionType: z.enum(["multiple-choice", "free-text", "multiple-choice-quiz", "true-false"]),
      options: z.array(z.string()).min(0),
      correctAnswer: z.string().optional(),
    })
  ),
});

type ScenarioFormValues = z.infer<typeof scenarioFormSchema>;

export default function EditScenario() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { id } = useParams();
  const scenarioId = parseInt(id);
  const [isSuccess, setIsSuccess] = useState(false);

  // Quiz library state
  const [quizLibrary, setQuizLibrary] = useState<QuizLibraryQuestion[]>([]);
  const [quizPickerOpen, setQuizPickerOpen] = useState<number | null>(null);
  const [quizSearch, setQuizSearch] = useState("");
  const [quizCategoryFilter, setQuizCategoryFilter] = useState("all");

  useEffect(() => {
    fetch("/api/quiz-questions", { credentials: "include" })
      .then(r => r.json())
      .then(data => setQuizLibrary(Array.isArray(data) ? data : []))
      .catch(() => setQuizLibrary([]));
  }, []);

  // Set up form
  const form = useForm<ScenarioFormValues>({
    resolver: zodResolver(scenarioFormSchema),
    defaultValues: {
      title: "",
      description: "",
      numberOfQuestions: 1,
      questions: [
        {
          id: "q1",
          question: "",
          options: ["", ""],
          correctAnswer: "",
        },
      ],
    },
  });

  // Fetch scenario data
  const { data: scenario, isLoading: isLoadingScenario } = useQuery<Scenario>({
    queryKey: [`/api/scenarios/${scenarioId}`],
    enabled: !isNaN(scenarioId),
  });

  // Populate form when scenario data is loaded
  useEffect(() => {
    if (scenario) {
      // Transform the questions from any to ScenarioQuestion[]
      const questions = scenario.questions as ScenarioQuestion[];
      
      form.reset({
        title: scenario.title,
        description: scenario.description,
        numberOfQuestions: scenario.numberOfQuestions,
        questions,
      });
    }
  }, [scenario, form]);

  // Update scenario mutation
  const updateScenarioMutation = useMutation({
    mutationFn: async (data: ScenarioFormValues) => {
      // Update the numberOfQuestions field to match the actual number of questions
      data.numberOfQuestions = data.questions.length;
      
      const res = await apiRequest({
        method: "PUT",
        url: `/api/scenarios/${scenarioId}`,
        data: data
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      queryClient.invalidateQueries({ queryKey: [`/api/scenarios/${scenarioId}`] });
      setIsSuccess(true);
      toast({
        title: "Scenario updated",
        description: "The scenario has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update scenario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission with direct fetch
  const onSubmit = (data: ScenarioFormValues) => {
    // Check for missing correct answers
    const hasMissingCorrectAnswers = data.questions.some(q => !q.correctAnswer);
    
    if (hasMissingCorrectAnswers) {
      toast({
        title: "Warning: Missing Correct Answers",
        description: "Some questions are missing correct answers. These will be optional for users to complete.",
        variant: "destructive",
      });
    }
    
    // Update the numberOfQuestions field
    data.numberOfQuestions = data.questions.length;
    
    // Show loading state
    const originalButtonText = document.querySelector('button[type="submit"]')?.textContent;
    if (document.querySelector('button[type="submit"]')) {
      document.querySelector('button[type="submit"]')!.innerHTML = '<div class="animate-spin mr-2">↻</div> Saving...';
      document.querySelector('button[type="submit"]')!.setAttribute('disabled', 'true');
    }
    
    // Make direct fetch request
    fetch(`/api/scenarios/${scenarioId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data),
      credentials: "include"
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }
      return response.json();
    })
    .then(updatedScenario => {
      // Update queries
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      queryClient.invalidateQueries({ queryKey: [`/api/scenarios/${scenarioId}`] });
      
      // Show success message
      setIsSuccess(true);
      toast({
        title: "Scenario updated",
        description: "The scenario has been updated successfully",
      });
      
      // Navigate back to scenarios list immediately
      navigate("/instructors-portal/scenarios");
    })
    .catch(error => {
      console.error("Error updating scenario:", error);
      toast({
        title: "Failed to update scenario",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    })
    .finally(() => {
      // Reset button state
      if (document.querySelector('button[type="submit"]') && originalButtonText) {
        document.querySelector('button[type="submit"]')!.innerHTML = originalButtonText;
        document.querySelector('button[type="submit"]')!.removeAttribute('disabled');
      }
    });
  };

  // Add a new question to the form
  const addQuestion = () => {
    const questions = form.getValues().questions || [];
    form.setValue("questions", [
      ...questions,
      {
        id: `q${questions.length + 1}`,
        question: "",
        questionType: "free-text",
        options: ["", ""],
        correctAnswer: "",
      },
    ]);
  };

  // Remove a question from the form
  const removeQuestion = (index: number) => {
    const questions = form.getValues().questions;
    if (questions && questions.length > 1) {
      form.setValue(
        "questions",
        questions.filter((_, i) => i !== index)
      );
    } else {
      toast({
        title: "Cannot remove question",
        description: "A scenario must have at least one question",
        variant: "destructive",
      });
    }
  };

  // Add a new option to a question
  const addOption = (questionIndex: number) => {
    const questions = form.getValues().questions;
    const options = questions[questionIndex].options || [];
    
    if (options.length < 6) { // Limit to 6 options
      const updatedQuestions = [...questions];
      updatedQuestions[questionIndex].options = [...options, ""];
      form.setValue("questions", updatedQuestions);
    }
  };

  // Remove an option from a question
  const removeOption = (questionIndex: number, optionIndex: number) => {
    const questions = form.getValues().questions;
    const options = questions[questionIndex].options || [];
    
    if (options.length > 2) { // Keep at least 2 options
      const updatedQuestions = [...questions];
      updatedQuestions[questionIndex].options = options.filter((_, i) => i !== optionIndex);
      
      // If removed option was the correct answer, reset correct answer
      if (questions[questionIndex].correctAnswer === options[optionIndex]) {
        updatedQuestions[questionIndex].correctAnswer = "";
      }
      
      form.setValue("questions", updatedQuestions);
    } else {
      toast({
        title: "Cannot remove option",
        description: "A question must have at least two options",
        variant: "destructive",
      });
    }
  };

  // Handle back button click
  const handleBackClick = () => {
    navigate("/instructors-portal/scenarios");
  };

  const applyLibraryQuestion = (qIndex: number, libQ: QuizLibraryQuestion) => {
    form.setValue(`questions.${qIndex}.question`, libQ.question);
    form.setValue(`questions.${qIndex}.options`, libQ.options.slice(0, 4).concat(Array(4).fill("")).slice(0, 4));
    form.setValue(`questions.${qIndex}.correctAnswer`, libQ.correctAnswer.toString());
    setQuizPickerOpen(null);
    setQuizSearch("");
  };

  const filteredLibraryQuestions = quizLibrary.filter(q => {
    const matchesCategory = quizCategoryFilter === "all" || q.category === quizCategoryFilter;
    const matchesSearch = !quizSearch || q.question.toLowerCase().includes(quizSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const difficultyColour = (d: string) =>
    d === "easy" ? "bg-green-900/40 text-green-300 border-green-700" :
    d === "hard" ? "bg-red-900/40 text-red-300 border-red-700" :
    "bg-yellow-900/40 text-yellow-300 border-yellow-700";

  if (isLoadingScenario) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!scenario && !isLoadingScenario) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Scenario Not Found</CardTitle>
            <CardDescription>
              The scenario you're looking for doesn't exist or you don't have permission to edit it.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleBackClick}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Scenarios
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Edit Scenario - LOADMworkflow</title>
        <meta name="description" content="Edit training scenarios for loadmaster training" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="text-primary hover:text-primary/80 mr-4 p-2"
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">Edit Scenario</h2>
        </div>

        {isSuccess ? (
          <Card className="mb-6 border-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                <CardTitle>Scenario Updated Successfully</CardTitle>
              </div>
              <CardDescription>
                Your changes have been saved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={() => setIsSuccess(false)} variant="outline" className="mr-2">
                Continue Editing
              </Button>
              <Button onClick={handleBackClick}>
                Return to Scenario Management
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Form {...form}>
            <form className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scenario Details</CardTitle>
                  <CardDescription>
                    Edit the details of your training scenario
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter scenario title" className="text-white font-medium" />
                        </FormControl>
                        <FormDescription>
                          A concise title for the training scenario
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Provide a detailed description of the scenario"
                            rows={3}
                            className="text-white font-medium"
                          />
                        </FormControl>
                        <FormDescription>
                          Describe what knowledge or skills this scenario will test
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-foreground">Questions</h3>
              </div>

              {form.watch("questions")?.map((question, qIndex) => (
                <Card key={qIndex} className="border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">Question {qIndex + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-destructive hover:text-destructive/90"
                        disabled={form.watch("questions").length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">


                    <FormField
                      control={form.control}
                      name={`questions.${qIndex}.question`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Text</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Enter the question"
                              rows={2}
                              className="text-white font-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`questions.${qIndex}.questionType`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Type</FormLabel>
                          <Select
                            onValueChange={v => {
                              field.onChange(v);
                              form.setValue(`questions.${qIndex}.options`, ["", "", "", ""]);
                              form.setValue(`questions.${qIndex}.correctAnswer`, "");
                              if (v === "multiple-choice-quiz") setQuizPickerOpen(qIndex);
                              else setQuizPickerOpen(null);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="text-white font-medium">
                                <SelectValue placeholder="Select question type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {QUESTION_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Choose how students will answer this question</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* ── Free Text ── */}
                    {form.watch(`questions.${qIndex}.questionType`) === "free-text" && (
                      <FormField control={form.control} name={`questions.${qIndex}.correctAnswer`} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sample Answer (Instructor Reference)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Enter the model answer for grading reference" rows={3} className="text-white font-medium" />
                          </FormControl>
                          <FormDescription>Used as reference during manual grading</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {/* ── Multiple Choice (custom) ── */}
                    {form.watch(`questions.${qIndex}.questionType`) === "multiple-choice" && (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <FormLabel>Answer Options</FormLabel>
                            <Button type="button" variant="ghost" size="sm" onClick={() => addOption(qIndex)} className="text-xs" disabled={question.options.length >= 6}>
                              <Plus className="h-3 w-3 mr-1" />Add Option
                            </Button>
                          </div>
                          {question.options.map((_, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <FormField control={form.control} name={`questions.${qIndex}.options.${oIndex}`} render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <div className="flex items-center gap-2">
                                      <Input {...field} placeholder={`Option ${oIndex + 1}`} className="text-white font-medium" />
                                      <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(qIndex, oIndex)} className="h-8 w-8 text-destructive hover:text-destructive/90" disabled={question.options.length <= 2}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </div>
                          ))}
                        </div>
                        <FormField control={form.control} name={`questions.${qIndex}.correctAnswer`} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correct Answer</FormLabel>
                            <FormControl>
                              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
                                {question.options.map((option, oIndex) => (
                                  <div key={oIndex} className="flex items-center space-x-2">
                                    <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-option-${oIndex}`} />
                                    <Label htmlFor={`q${qIndex}-option-${oIndex}`} className={!option ? "text-muted-foreground" : ""}>
                                      {option || `Option ${oIndex + 1} (enter text first)`}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </>
                    )}

                    {/* ── True / False ── */}
                    {form.watch(`questions.${qIndex}.questionType`) === "true-false" && (
                      <>
                        {(() => {
                          const opts = form.watch(`questions.${qIndex}.options`);
                          if (opts[0] !== "True" || opts[1] !== "False") {
                            form.setValue(`questions.${qIndex}.options`, ["True", "False", "", ""]);
                          }
                          return null;
                        })()}
                        <div className="space-y-2">
                          <FormLabel>Correct Answer</FormLabel>
                          <div className="flex gap-4">
                            {["True", "False"].map((label, idx) => (
                              <label key={label} className={`flex items-center gap-2 cursor-pointer px-5 py-3 rounded-lg border transition-colors ${
                                form.watch(`questions.${qIndex}.correctAnswer`) === idx.toString()
                                  ? "border-orange-500 bg-orange-900/20 text-orange-300"
                                  : "border-border text-muted-foreground hover:border-orange-500/50"
                              }`}>
                                <input type="radio" name={`tf-edit-${qIndex}`} value={idx.toString()}
                                  checked={form.watch(`questions.${qIndex}.correctAnswer`) === idx.toString()}
                                  onChange={e => { if (e.target.checked) form.setValue(`questions.${qIndex}.correctAnswer`, idx.toString()); }}
                                  className="accent-orange-500" />
                                {label}
                              </label>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── Multiple Choice from Quiz Library ── */}
                    {form.watch(`questions.${qIndex}.questionType`) === "multiple-choice-quiz" && (
                      <div className="space-y-4">
                        {form.watch(`questions.${qIndex}.question`) ? (
                          <div className="rounded-lg border border-orange-500/40 bg-orange-900/10 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-white">{form.watch(`questions.${qIndex}.question`)}</p>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setQuizPickerOpen(qIndex)} className="text-orange-400 hover:text-orange-300 text-xs shrink-0">Change</Button>
                            </div>
                            <div className="space-y-1">
                              {form.watch(`questions.${qIndex}.options`)?.filter(Boolean).map((opt, oIdx) => (
                                <div key={oIdx} className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${
                                  form.watch(`questions.${qIndex}.correctAnswer`) === oIdx.toString() ? "bg-green-900/30 text-green-300" : "text-gray-400"
                                }`}>
                                  <span className="font-semibold w-4">{String.fromCharCode(65 + oIdx)}.</span>
                                  {opt}
                                  {form.watch(`questions.${qIndex}.correctAnswer`) === oIdx.toString() && <CheckCircle className="h-3 w-3 ml-auto text-green-400" />}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Button type="button" variant="outline" className="w-full border-dashed border-orange-500/40 text-orange-400 hover:bg-orange-900/20" onClick={() => setQuizPickerOpen(qIndex)}>
                            <BookOpen className="mr-2 h-4 w-4" />Browse Quiz Library
                          </Button>
                        )}
                        {quizPickerOpen === qIndex && (
                          <div className="rounded-lg border border-[#444] bg-[#1a1a1a] p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-white flex items-center gap-2"><BookOpen className="h-4 w-4 text-orange-400" />Quiz Library</h4>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setQuizPickerOpen(null)} className="text-gray-400 h-6 w-6 p-0"><X className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
                                <Input value={quizSearch} onChange={e => setQuizSearch(e.target.value)} placeholder="Search questions..." className="pl-8 h-8 text-sm bg-[#252525] border-[#444]" />
                              </div>
                              <Select value={quizCategoryFilter} onValueChange={setQuizCategoryFilter}>
                                <SelectTrigger className="w-48 h-8 text-sm bg-[#252525] border-[#444]"><SelectValue /></SelectTrigger>
                                <SelectContent>{QUIZ_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                              {filteredLibraryQuestions.length === 0 ? (
                                <p className="text-center text-gray-500 text-sm py-6">No questions match your search</p>
                              ) : filteredLibraryQuestions.map(libQ => (
                                <button key={libQ.id} type="button" onClick={() => applyLibraryQuestion(qIndex, libQ)}
                                  className="w-full text-left p-3 rounded-lg border border-[#333] bg-[#242424] hover:border-orange-500/50 hover:bg-orange-900/10 transition-colors">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <p className="text-sm text-white leading-snug">{libQ.question}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${difficultyColour(libQ.difficulty)}`}>{libQ.difficulty}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 bg-[#333] px-2 py-0.5 rounded">{QUIZ_CATEGORIES.find(c => c.value === libQ.category)?.label || libQ.category}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-gray-600 text-center">{filteredLibraryQuestions.length} questions available</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-between">
                <Button
                  type="button"
                  onClick={addQuestion}
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleBackClick} 
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => onSubmit(form.getValues())}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    </>
  );
}