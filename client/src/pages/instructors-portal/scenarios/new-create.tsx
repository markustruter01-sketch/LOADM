import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
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
import { ArrowLeft, CheckCircle, Loader2, Plus, Trash2 } from "lucide-react";

// Define a simple form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  passingThreshold: z.number().min(0).max(100).default(70),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string().min(1, "Question text is required"),
      questionType: z.enum(["multiple-choice", "free-text"]),
      options: z.array(z.string()),
      correctAnswer: z.string().optional(),
    })
  ),
});

export default function CreateScenario() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set up form
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      passingThreshold: 70, // Default 70% passing threshold
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
    resolver: zodResolver(formSchema),
  });

  // Functions to manage questions
  const addQuestion = () => {
    const questions = form.getValues().questions || [];
    form.setValue("questions", [
      ...questions,
      {
        id: `q${questions.length + 1}`,
        question: "",
        questionType: "free-text" as const,
        options: ["", ""],
        correctAnswer: "",
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    const questions = form.getValues().questions;
    if (questions && questions.length > 1) {
      form.setValue(
        "questions",
        questions.filter((_: any, i: number) => i !== index)
      );
    } else {
      toast({
        title: "Cannot remove question",
        description: "A scenario must have at least one question",
        variant: "destructive",
      });
    }
  };

  // Very simple submit function
  const onSubmit = (data: any) => {
    setIsSubmitting(true);
    
    // Add the number of questions field
    const submitData = {
      ...data,
      numberOfQuestions: data.questions.length
    };
    
    // Log what we're submitting
    // Process scenario data for submission
    
    // Make the API call
    fetch("/api/scenarios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(submitData),
      credentials: "include"
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }
      return response.json();
    })
    .then(result => {
      toast({
        title: "Success!",
        description: "Scenario created successfully"
      });
      // Navigate back to scenarios list
      navigate("/instructors-portal/scenarios");
    })
    .catch(error => {
      console.error("Error creating scenario:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create scenario",
        variant: "destructive"
      });
    })
    .finally(() => {
      setIsSubmitting(false);
    });
  };

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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="passingThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passing Threshold (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 70)}
                          className="text-white font-medium w-full" 
                        />
                      </FormControl>
                      <FormDescription>
                        Students must get this percentage of questions correct to pass the scenario
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch(`questions.${qIndex}.questionType`) === "multiple-choice" && (
                    <FormField
                      control={form.control}
                      name={`questions.${qIndex}.correctAnswer`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correct Answer (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter the correct answer"
                              className="text-white font-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch(`questions.${qIndex}.questionType`) === "free-text" && (
                    <FormField
                      control={form.control}
                      name={`questions.${qIndex}.correctAnswer`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sample Answer (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Enter a sample answer for grading reference"
                              rows={3}
                              className="text-white font-medium"
                            />
                          </FormControl>
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
      </div>
    </>
  );
}