import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useIsolatedAuth } from "@/auth-isolated/auth-context";
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
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, BookOpen, CheckCircle, Loader2, Plus, Search, Trash2, X } from "lucide-react";

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

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  passingThreshold: z.number().min(0).max(100).default(70),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string().min(1, "Question text is required"),
      questionType: z.enum(["multiple-choice", "free-text", "multiple-choice-quiz", "true-false"]),
      options: z.array(z.string()),
      correctAnswer: z.string().optional(),
    })
  ),
});

type QuizLibraryQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: string;
};

export default function CreateScenario() {
  const { toast } = useToast();
  const { user } = useIsolatedAuth();
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quiz library state
  const [quizLibrary, setQuizLibrary] = useState<QuizLibraryQuestion[]>([]);
  const [quizLibraryLoading, setQuizLibraryLoading] = useState(false);
  const [quizPickerOpen, setQuizPickerOpen] = useState<number | null>(null); // question index
  const [quizSearch, setQuizSearch] = useState("");
  const [quizCategoryFilter, setQuizCategoryFilter] = useState("all");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, []);

  // Fetch quiz library once on mount
  useEffect(() => {
    setQuizLibraryLoading(true);
    fetch("/api/quiz-questions", { credentials: "include" })
      .then(r => r.json())
      .then(data => setQuizLibrary(Array.isArray(data) ? data : []))
      .catch(() => setQuizLibrary([]))
      .finally(() => setQuizLibraryLoading(false));
  }, []);

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      passingThreshold: 70,
      questions: [
        {
          id: "q1",
          question: "",
          questionType: "free-text" as const,
          options: ["", "", "", ""],
          correctAnswer: "",
        },
      ],
    },
    resolver: zodResolver(formSchema),
  });

  const addQuestion = () => {
    const questions = form.getValues().questions || [];
    form.setValue("questions", [
      ...questions,
      {
        id: `q${Date.now()}`,
        question: "",
        questionType: "free-text" as const,
        options: ["", "", "", ""],
        correctAnswer: "",
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    const questions = form.getValues().questions;
    if (questions && questions.length > 1) {
      form.setValue("questions", questions.filter((_: any, i: number) => i !== index));
    } else {
      toast({ title: "Cannot remove question", description: "A scenario must have at least one question", variant: "destructive" });
    }
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

  const onSubmit = (data: any) => {
    setIsSubmitting(true);
    const submitData = { ...data, numberOfQuestions: data.questions.length };
    fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitData),
      credentials: "include",
    })
      .then(r => { if (!r.ok) throw new Error(`Server error (${r.status})`); return r.json(); })
      .then(() => {
        toast({ title: "Success!", description: "Scenario created successfully" });
        navigate("/instructors-portal/scenarios");
      })
      .catch(err => {
        toast({ title: "Error", description: err.message || "Failed to create scenario", variant: "destructive" });
      })
      .finally(() => setIsSubmitting(false));
  };

  const difficultyColour = (d: string) =>
    d === "easy" ? "bg-green-900/40 text-green-300 border-green-700" :
    d === "hard" ? "bg-red-900/40 text-red-300 border-red-700" :
    "bg-yellow-900/40 text-yellow-300 border-yellow-700";

  return (
    <>
      <Helmet>
        <title>Create Scenario - LOADMworkflow</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="flex items-center mb-6">
          <Link href="/instructors-portal">
            <Button variant="ghost" className="text-primary hover:text-primary/80 mr-4 p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-foreground">Create New Scenario</h2>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Scenario Details */}
            <Card>
              <CardHeader>
                <CardTitle>Scenario Details</CardTitle>
                <CardDescription>Enter the basic information for your training scenario</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input {...field} placeholder="Enter scenario title" className="text-white font-medium" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Provide a detailed description of the scenario" rows={3} className="text-white font-medium" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="passingThreshold" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Threshold (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="100" {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 70)}
                        className="text-white font-medium w-full" />
                    </FormControl>
                    <FormDescription>Students must get this percentage of questions correct to pass the scenario</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-foreground">Questions</h3>
            </div>

            {form.watch("questions")?.map((question, qIndex) => {
              const qType = form.watch(`questions.${qIndex}.questionType`);
              return (
                <Card key={qIndex} className="border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">Question {qIndex + 1}</CardTitle>
                      <Button type="button" variant="ghost" size="sm"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-destructive hover:text-destructive/90"
                        disabled={form.watch("questions").length <= 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">

                    {/* Question Type selector — first so instructor picks type before writing */}
                    <FormField control={form.control} name={`questions.${qIndex}.questionType`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Type</FormLabel>
                        <Select onValueChange={v => {
                          field.onChange(v);
                          // Reset question data when type changes
                          form.setValue(`questions.${qIndex}.question`, "");
                          form.setValue(`questions.${qIndex}.options`, ["", "", "", ""]);
                          form.setValue(`questions.${qIndex}.correctAnswer`, "");
                          if (v === "multiple-choice-quiz") setQuizPickerOpen(qIndex);
                          else setQuizPickerOpen(null);
                        }} value={field.value}>
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
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* ── Free Text ── */}
                    {qType === "free-text" && (
                      <>
                        <FormField control={form.control} name={`questions.${qIndex}.question`} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Text</FormLabel>
                            <FormControl><Textarea {...field} placeholder="Enter the question" rows={2} className="text-white font-medium" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`questions.${qIndex}.correctAnswer`} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sample Answer (Optional)</FormLabel>
                            <FormControl><Textarea {...field} placeholder="Enter a sample answer for grading reference" rows={3} className="text-white font-medium" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </>
                    )}

                    {/* ── Multiple Choice (custom) ── */}
                    {qType === "multiple-choice" && (
                      <>
                        <FormField control={form.control} name={`questions.${qIndex}.question`} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Text</FormLabel>
                            <FormControl><Textarea {...field} placeholder="Enter the question" rows={2} className="text-white font-medium" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="space-y-4">
                          <FormLabel>Answer Options</FormLabel>
                          <div className="space-y-3">
                            {[0, 1, 2, 3].map(optIdx => (
                              <div key={optIdx} className="flex items-center gap-3">
                                <input type="radio" id={`q${qIndex}-opt${optIdx}`}
                                  name={`questions.${qIndex}.correctAnswer`}
                                  value={optIdx.toString()}
                                  checked={form.watch(`questions.${qIndex}.correctAnswer`) === optIdx.toString()}
                                  onChange={e => { if (e.target.checked) form.setValue(`questions.${qIndex}.correctAnswer`, optIdx.toString()); }}
                                  className="h-4 w-4 accent-orange-500" />
                                <label htmlFor={`q${qIndex}-opt${optIdx}`} className="text-sm font-semibold text-orange-400 w-5">
                                  {String.fromCharCode(65 + optIdx)}
                                </label>
                                <FormField control={form.control} name={`questions.${qIndex}.options.${optIdx}`} render={({ field }) => (
                                  <FormItem className="flex-1 mb-0">
                                    <FormControl>
                                      <Input {...field} placeholder={`Option ${String.fromCharCode(65 + optIdx)}`} className="text-white font-medium" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer</p>
                        </div>
                      </>
                    )}

                    {/* ── True / False ── */}
                    {qType === "true-false" && (
                      <>
                        <FormField control={form.control} name={`questions.${qIndex}.question`} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Statement</FormLabel>
                            <FormControl><Textarea {...field} placeholder="Enter a statement for students to judge as True or False" rows={2} className="text-white font-medium" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="space-y-2">
                          <FormLabel>Correct Answer</FormLabel>
                          <div className="flex gap-4">
                            {["True", "False"].map((label, idx) => (
                              <label key={label} className={`flex items-center gap-2 cursor-pointer px-5 py-3 rounded-lg border transition-colors ${
                                form.watch(`questions.${qIndex}.correctAnswer`) === idx.toString()
                                  ? "border-orange-500 bg-orange-900/20 text-orange-300"
                                  : "border-border text-muted-foreground hover:border-orange-500/50"
                              }`}>
                                <input type="radio" name={`tf-${qIndex}`} value={idx.toString()}
                                  checked={form.watch(`questions.${qIndex}.correctAnswer`) === idx.toString()}
                                  onChange={e => { if (e.target.checked) form.setValue(`questions.${qIndex}.correctAnswer`, idx.toString()); }}
                                  className="accent-orange-500" />
                                {label}
                              </label>
                            ))}
                          </div>
                        </div>
                        {/* Store True/False options for grading */}
                        {(() => {
                          const currentOpts = form.watch(`questions.${qIndex}.options`);
                          if (currentOpts[0] !== "True" || currentOpts[1] !== "False") {
                            form.setValue(`questions.${qIndex}.options`, ["True", "False", "", ""]);
                          }
                          return null;
                        })()}
                      </>
                    )}

                    {/* ── Multiple Choice from Quiz Library ── */}
                    {qType === "multiple-choice-quiz" && (
                      <div className="space-y-4">
                        {/* Show selected question (if already populated) */}
                        {form.watch(`questions.${qIndex}.question`) ? (
                          <div className="rounded-lg border border-orange-500/40 bg-orange-900/10 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-white">{form.watch(`questions.${qIndex}.question`)}</p>
                              <Button type="button" variant="ghost" size="sm"
                                onClick={() => setQuizPickerOpen(qIndex)}
                                className="text-orange-400 hover:text-orange-300 text-xs shrink-0">
                                Change
                              </Button>
                            </div>
                            <div className="space-y-1">
                              {form.watch(`questions.${qIndex}.options`)?.filter(Boolean).map((opt, oIdx) => (
                                <div key={oIdx} className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${
                                  form.watch(`questions.${qIndex}.correctAnswer`) === oIdx.toString()
                                    ? "bg-green-900/30 text-green-300" : "text-gray-400"
                                }`}>
                                  <span className="font-semibold w-4">{String.fromCharCode(65 + oIdx)}.</span>
                                  {opt}
                                  {form.watch(`questions.${qIndex}.correctAnswer`) === oIdx.toString() && (
                                    <CheckCircle className="h-3 w-3 ml-auto text-green-400" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Button type="button" variant="outline"
                            className="w-full border-dashed border-orange-500/40 text-orange-400 hover:bg-orange-900/20"
                            onClick={() => setQuizPickerOpen(qIndex)}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Browse Quiz Library
                          </Button>
                        )}

                        {/* Quiz library picker panel */}
                        {quizPickerOpen === qIndex && (
                          <div className="rounded-lg border border-[#444] bg-[#1a1a1a] p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-orange-400" />
                                Quiz Library
                              </h4>
                              <Button type="button" variant="ghost" size="sm"
                                onClick={() => setQuizPickerOpen(null)}
                                className="text-gray-400 h-6 w-6 p-0">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Filters */}
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
                                <Input value={quizSearch} onChange={e => setQuizSearch(e.target.value)}
                                  placeholder="Search questions..." className="pl-8 h-8 text-sm bg-[#252525] border-[#444]" />
                              </div>
                              <Select value={quizCategoryFilter} onValueChange={setQuizCategoryFilter}>
                                <SelectTrigger className="w-48 h-8 text-sm bg-[#252525] border-[#444]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {QUIZ_CATEGORIES.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Results */}
                            {quizLibraryLoading ? (
                              <div className="flex justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                {filteredLibraryQuestions.length === 0 ? (
                                  <p className="text-center text-gray-500 text-sm py-6">No questions match your search</p>
                                ) : (
                                  filteredLibraryQuestions.map(libQ => (
                                    <button key={libQ.id} type="button"
                                      onClick={() => applyLibraryQuestion(qIndex, libQ)}
                                      className="w-full text-left p-3 rounded-lg border border-[#333] bg-[#242424] hover:border-orange-500/50 hover:bg-orange-900/10 transition-colors">
                                      <div className="flex items-start justify-between gap-2 mb-2">
                                        <p className="text-sm text-white leading-snug">{libQ.question}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${difficultyColour(libQ.difficulty)}`}>
                                          {libQ.difficulty}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs text-gray-500 bg-[#333] px-2 py-0.5 rounded">
                                          {QUIZ_CATEGORIES.find(c => c.value === libQ.category)?.label || libQ.category}
                                        </span>
                                        <span className="text-xs text-gray-600">{libQ.options.length} options</span>
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                            <p className="text-xs text-gray-600 text-center">{filteredLibraryQuestions.length} questions available</p>
                          </div>
                        )}
                      </div>
                    )}

                  </CardContent>
                </Card>
              );
            })}

            <div className="flex justify-between">
              <Button type="button" onClick={addQuestion} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-white" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Creating..." : "Create Scenario"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
