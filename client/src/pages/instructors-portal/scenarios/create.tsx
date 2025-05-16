import { useState, useCallback } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { insertScenarioSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import { ArrowLeft, CheckCircle, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Define form types
const scenarioFormSchema = insertScenarioSchema.extend({
  questions: z.array(
    z.object({
      id: z.string().min(1, "Question ID is required").default(""),
      question: z.string().min(1, "Question text is required"),
      questionType: z.enum(["multiple-choice", "free-text"]),
      options: z.array(z.string().min(1, "Option text is required")).min(2, "At least 2 options are required"),
      correctAnswer: z.string().optional(),
    })
  ),
});

type ScenarioFormValues = z.infer<typeof scenarioFormSchema>;

export default function CreateScenario() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const queryClient = useQueryClient();

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
          questionType: "free-text",
          options: ["", ""],
          correctAnswer: "",
        },
      ],
    },
  });

  // Handle form submission directly without using react-query mutation
  const onSubmit = useCallback(async (data: ScenarioFormValues) => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Make sure we're authenticated
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create scenarios.",
          variant: "destructive",
        });
        return;
      }

      // Check if any questions are missing correct answers
      const missingAnswers = data.questions.some(q => !q.correctAnswer?.trim());
      
      if (missingAnswers) {
        // Show warning but still allow submission
        toast({
          title: "Warning",
          description: "Some questions don't have correct answers specified. Students won't receive automatic scoring.",
          variant: "destructive",
        });
      }
      
      // Ensure numberOfQuestions field is accurate
      data.numberOfQuestions = data.questions.length;
      
      console.log("Creating scenario:", data);
      
      // Direct fetch with credentials included
      const response = await fetch("/api/scenarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include"
      });
      
      console.log("Server response status:", response.status);
      
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = `Server error (${response.status})`;
        
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || "Failed to create scenario";
          console.error("Error data:", errorData);
        } else {
          const text = await response.text();
          console.error("Error response:", text);
        }
        
        throw new Error(errorMessage);
      }
      
      const newScenario = await response.json();
      console.log("Scenario created:", newScenario);
      
      // Update query cache
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      
      // Show success state
      setIsSuccess(true);
      toast({
        title: "Success!",
        description: "The scenario has been created successfully",
      });
      
      // Navigate back after delay
      setTimeout(() => {
        navigate("/instructors-portal/scenarios");
      }, 1500);
      
    } catch (error) {
      console.error("Error creating scenario:", error);
      toast({
        title: "Failed to create scenario",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, toast, queryClient, navigate, isSubmitting]);

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

  return (
    <>
      <Helmet>
        <title>Create Scenario - LOADMworkflow</title>
        <meta name="description" content="Create new training scenarios for loadmaster training" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="flex items-center mb-6">
          <Link href="/instructors-portal/scenarios">
            <Button variant="ghost" className="text-primary hover:text-primary/80 mr-4 p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-foreground">Create New Scenario</h2>
        </div>

        {isSuccess ? (
          <Card className="mb-6 border-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                <CardTitle>Scenario Created Successfully</CardTitle>
              </div>
              <CardDescription>
                Your scenario has been created and is now available for students.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/instructors-portal/scenarios">
                <Button>Return to Scenario Management</Button>
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scenario Details</CardTitle>
                  <CardDescription>
                    Enter the basic information for your training scenario
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="text-white font-medium">
                                <SelectValue placeholder="Select question type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                              <SelectItem value="free-text">Free Text Input</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose how students will answer this question
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Conditional display based on question type */}
                    {form.watch(`questions.${qIndex}.questionType`) === "multiple-choice" ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <FormLabel>Answer Options</FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => addOption(qIndex)}
                              className="text-xs"
                              disabled={question.options.length >= 6}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Option
                            </Button>
                          </div>

                          {question.options.map((_, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <FormField
                                control={form.control}
                                name={`questions.${qIndex}.options.${oIndex}`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <div className="flex items-center gap-2">
                                        <Input {...field} placeholder={`Option ${oIndex + 1}`} className="text-white font-medium" />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeOption(qIndex, oIndex)}
                                          className="h-8 w-8 text-destructive hover:text-destructive/90"
                                          disabled={question.options.length <= 2}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ))}
                        </div>

                        <FormField
                          control={form.control}
                          name={`questions.${qIndex}.correctAnswer`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Correct Answer</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="flex flex-col space-y-2"
                                >
                                  {question.options.map((option, oIndex) => (
                                    <div key={oIndex} className="flex items-center space-x-2">
                                      <RadioGroupItem
                                        value={option}
                                        id={`q${qIndex}-option-${oIndex}`}
                                        disabled={!option}
                                      />
                                      <Label
                                        htmlFor={`q${qIndex}-option-${oIndex}`}
                                        className={!option ? "text-muted-foreground" : ""}
                                      >
                                        {option || `Option ${oIndex + 1} (enter text first)`}
                                      </Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                              <FormDescription>
                                Select the correct answer for this question
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      <FormField
                        control={form.control}
                        name={`questions.${qIndex}.correctAnswer`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correct Answer (Instructor Reference)</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Enter the model answer for this free text question"
                                rows={3}
                                className="text-white font-medium"
                              />
                            </FormControl>
                            <FormDescription>
                              This will be used as a reference for grading free text answers
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? "Creating..." : "Create Scenario"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </>
  );
}