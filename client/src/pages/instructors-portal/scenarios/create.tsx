import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { insertScenarioSchema } from "@shared/schema";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, CheckCircle, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Define form types
const scenarioFormSchema = insertScenarioSchema.extend({
  questions: z.array(
    z.object({
      id: z.string().min(1, "Question ID is required"),
      question: z.string().min(1, "Question text is required"),
      options: z.array(z.string().min(1, "Option text is required")).min(2, "At least 2 options are required"),
      correctAnswer: z.string().min(1, "Correct answer is required"),
    })
  ),
});

type ScenarioFormValues = z.infer<typeof scenarioFormSchema>;

export default function CreateScenario() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isSuccess, setIsSuccess] = useState(false);

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

  // Create scenario mutation
  const createScenarioMutation = useMutation({
    mutationFn: async (data: ScenarioFormValues) => {
      // Update the numberOfQuestions field to match the actual number of questions
      data.numberOfQuestions = data.questions.length;
      
      const res = await apiRequest("POST", "/api/scenarios", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      setIsSuccess(true);
      toast({
        title: "Scenario created",
        description: "The scenario has been created successfully",
      });
      
      // After a short delay, go back to manage page
      setTimeout(() => {
        navigate("/instructors-portal/scenarios");
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create scenario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ScenarioFormValues) => {
    createScenarioMutation.mutate(data);
  };

  // Add a new question to the form
  const addQuestion = () => {
    const questions = form.getValues().questions || [];
    form.setValue("questions", [
      ...questions,
      {
        id: `q${questions.length + 1}`,
        question: "",
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
                <Button
                  type="button"
                  onClick={addQuestion}
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
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
                      name={`questions.${qIndex}.id`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question ID</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="q1" className="text-white font-medium" />
                          </FormControl>
                          <FormDescription>
                            A unique identifier for this question
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white"
                  disabled={createScenarioMutation.isPending}
                >
                  {createScenarioMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {createScenarioMutation.isPending ? "Creating..." : "Create Scenario"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </>
  );
}