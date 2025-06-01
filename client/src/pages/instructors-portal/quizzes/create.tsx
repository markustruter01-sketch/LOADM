import { useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, Save, Plus, Minus } from "lucide-react";
import { QuestionCategory } from "@shared/quiz-questions";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "../../../components/ui/date-picker";
import InstructorLayout from "../../../components/InstructorLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Define category options for the dropdown
const categoryOptions = [
  { id: "dangerous-goods", label: "Dangerous Goods" },
  { id: "loadmaster-fundamentals", label: "Loadmaster Fundamentals" },
  { id: "emergency-procedures", label: "Emergency Procedures" },
  { id: "weight-balance", label: "Weight & Balance" },
  { id: "cargo-securing", label: "Cargo Securing" },
  { id: "aircraft-systems", label: "Aircraft Systems" },
  { id: "regulations", label: "Regulations" },
  { id: "equipment-handling", label: "Equipment Handling" }
];

// Quiz form schema with validation
const quizFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  questionCount: z.number().min(1, "Must have at least 1 question").max(50, "Maximum 50 questions"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  isActive: z.boolean().default(true),
  expiresAt: z.date().optional().nullable()
});

type QuizFormValues = z.infer<typeof quizFormSchema>;

export default function CreateQuiz() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Initialize form with default values
  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: "",
      description: "",
      questionCount: 10,
      categories: [],
      isActive: true,
      expiresAt: null
    }
  });

  const onSubmit = async (data: QuizFormValues) => {
    try {
      if (!user?.id) {
        toast({
          title: "Authentication error",
          description: "You must be logged in to create a quiz",
          variant: "destructive"
        });
        return;
      }

      const quizData = {
        ...data,
        createdById: user.id
      };

      await apiRequest("/api/quizzes", {
        method: "POST",
        body: quizData
      });

      toast({
        title: "Quiz created",
        description: "Your pop quiz has been created successfully."
      });

      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      setLocation("/instructors-portal/quizzes");
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to create the quiz. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <InstructorLayout title="Create Pop Quiz">
      <Helmet>
        <title>Create Pop Quiz - Instructor Portal | LOADMworkflow</title>
        <meta name="description" content="Create a new pop quiz for loadmaster training" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/instructors-portal/quizzes")}
            className="text-orange-500 hover:text-orange-600 hover:bg-orange-50/10 mr-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Create Pop Quiz</h1>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quiz Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter quiz title" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive title for your quiz
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter quiz description"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide additional details about this quiz
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="questionCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Questions</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-r-none"
                              onClick={() => {
                                const currentValue = field.value || 0;
                                if (currentValue > 1) {
                                  field.onChange(currentValue - 1);
                                }
                              }}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              className="rounded-none text-center"
                              min={1}
                              max={50}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-l-none"
                              onClick={() => {
                                const currentValue = field.value || 0;
                                if (currentValue < 50) {
                                  field.onChange(currentValue + 1);
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Number of questions to include (1-50)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Expiry Date (Optional)</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value ?? undefined}
                            setDate={field.onChange}
                            disabled={false}
                          />
                        </FormControl>
                        <FormDescription>
                          When the quiz will no longer be available
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="categories"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Categories</FormLabel>
                        <FormDescription>
                          Select categories to include in this quiz
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryOptions.map((category) => (
                          <FormField
                            key={category.id}
                            control={form.control}
                            name="categories"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={category.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 p-2 rounded-md hover:bg-muted/40"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(category.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, category.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== category.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal text-sm cursor-pointer">
                                    {category.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Activate Quiz</FormLabel>
                        <FormDescription>
                          Make this quiz immediately available to students
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/instructors-portal/quizzes")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Save className="mr-2 h-4 w-4" />
                    Create Quiz
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </InstructorLayout>
  );
}