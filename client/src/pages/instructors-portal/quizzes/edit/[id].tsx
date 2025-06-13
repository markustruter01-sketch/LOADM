import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, 
  FormLabel, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Popover, PopoverContent, PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import InstructorLayout from "../../../../components/InstructorLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useIsolatedAuth } from "@/auth-isolated/auth-context";

// Define the quiz categories
const quizCategories = [
  {
    id: "dangerous-goods",
    label: "Dangerous Goods"
  },
  {
    id: "loadmaster-fundamentals",
    label: "Loadmaster Fundamentals"
  },
  {
    id: "emergency-procedures",
    label: "Emergency Procedures"
  },
  {
    id: "weight-balance",
    label: "Weight & Balance"
  },
  {
    id: "cargo-securing",
    label: "Cargo Securing"
  },
  {
    id: "aircraft-systems",
    label: "Aircraft Systems"
  },
  {
    id: "regulations",
    label: "Regulations"
  },
  {
    id: "equipment-handling",
    label: "Equipment Handling"
  }
];

// Form validation schema
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().optional(),
  questionCount: z.number().min(1, "Must include at least 1 question").max(50, "Maximum 50 questions"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  isActive: z.boolean(),
  expires: z.date().optional().nullable()
});

export default function EditQuizPage() {
  const [, params] = useRoute('/instructors-portal/quizzes/edit/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useIsolatedAuth();
  const quizId = params?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch quiz details
  const { data: quiz, isLoading } = useQuery({
    queryKey: [`/api/quizzes/${quizId}`],
    queryFn: ({ queryKey, signal }) => fetch(queryKey[0], { signal }).then(res => {
      if (!res.ok) throw new Error('Failed to fetch quiz');
      return res.json();
    }),
    enabled: !!quizId
  });

  // Initialize form with quiz data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      questionCount: 10,
      categories: [],
      isActive: true,
      expires: null
    }
  });

  // Update form when quiz data is loaded
  useEffect(() => {
    if (quiz) {
      form.reset({
        title: quiz.title,
        description: quiz.description || "",
        questionCount: quiz.questionCount,
        categories: quiz.categories || [],
        isActive: quiz.is_active,
        expires: quiz.expiresAt ? new Date(quiz.expiresAt) : null
      });
    }
  }, [quiz, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      console.log("🔧 QUIZ EDIT DEBUG: Starting quiz update for ID:", quizId);
      console.log("🔧 QUIZ EDIT DEBUG: Form data:", data);
      console.log("🔧 QUIZ EDIT DEBUG: User:", user);
      
      if (!user || !user.id) {
        console.error("🔧 QUIZ EDIT DEBUG: No authenticated user");
        toast({
          title: "Authentication error",
          description: "You must be logged in to edit a quiz",
          variant: "destructive"
        });
        return;
      }
      
      const updateData = {
        title: data.title,
        description: data.description || "",
        questionCount: data.questionCount,
        categories: data.categories,
        isActive: data.isActive,
        expiresAt: data.expires ? data.expires.toISOString() : null
      };
      
      console.log("🔧 QUIZ EDIT DEBUG: Update data to send:", updateData);
      
      // Add explicit debugging for the request
      console.log("🔧 QUIZ EDIT DEBUG: Making PUT request to:", `/api/quizzes/${quizId}`);
      console.log("🔧 QUIZ EDIT DEBUG: Request method: PUT");
      console.log("🔧 QUIZ EDIT DEBUG: Request data stringified:", JSON.stringify(updateData));
      
      const response = await apiRequest({
        url: `/api/quizzes/${quizId}`,
        method: 'PUT',
        data: updateData
      });
      
      console.log("🔧 QUIZ EDIT DEBUG: Update response:", response);
      
      toast({
        title: "Quiz updated",
        description: "The quiz has been successfully updated.",
      });
      
      // Invalidate quiz queries
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}`] });
      
      // Navigate back to quiz details
      setLocation(`/instructors-portal/quizzes/${quizId}`);
    } catch (error) {
      console.error("Error updating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to update the quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <InstructorLayout title="Edit Quiz">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </InstructorLayout>
    );
  }

  if (!quiz) {
    return (
      <InstructorLayout title="Edit Quiz">
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Quiz not found</h2>
          <p className="text-muted-foreground">The quiz you're trying to edit does not exist or has been deleted.</p>
          <Button 
            className="mt-4" 
            onClick={() => setLocation('/instructors-portal/quizzes')}
          >
            Back to Quizzes
          </Button>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout title="Edit Quiz">
      <Helmet>
        <title>Edit Quiz | LOADMworkflow</title>
        <meta name="description" content="Edit a quiz for loadmaster training" />
      </Helmet>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button 
          variant="outline" 
          className="mb-6" 
          onClick={() => setLocation(`/instructors-portal/quizzes/${quizId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quiz Details
        </Button>

        <div className="bg-card rounded-lg border border-gray-800 p-6">
          <h1 className="text-2xl font-bold mb-6 text-foreground">Edit Quiz</h1>
          
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
                      Provide a clear and descriptive title for the quiz.
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
                        placeholder="Enter quiz description (optional)" 
                        className="resize-none" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide additional information about the quiz (optional).
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
                        <Input 
                          type="number" 
                          min={1} 
                          max={50} 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        How many questions should be in the quiz? (1-50)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expires"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiry Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>No expiry date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div className="p-2 flex items-center border-b border-gray-800">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium">Expiry date</h4>
                              <p className="text-xs text-muted-foreground">The quiz will no longer be accessible after this date.</p>
                            </div>
                            {field.value && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => field.onChange(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When should this quiz expire? Leave blank for no expiry.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Question Categories</FormLabel>
                      <FormDescription>
                        Select categories from which questions will be randomly selected.
                      </FormDescription>
                    </div>
                    <div className="space-y-2">
                      {quizCategories.map((category) => (
                        <div 
                          key={category.id} 
                          className="flex items-center space-x-2 bg-card/50 rounded-md p-2 border border-gray-800"
                        >
                          <input
                            type="checkbox"
                            id={category.id}
                            checked={field.value?.includes(category.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const updatedCategories = checked
                                ? [...field.value, category.id]
                                : field.value.filter((value) => value !== category.id);
                              field.onChange(updatedCategories);
                            }}
                            className="form-checkbox h-4 w-4 text-primary rounded border-gray-600 focus:ring-primary"
                          />
                          <label 
                            htmlFor={category.id}
                            className="text-sm font-medium flex-1 cursor-pointer"
                          >
                            {category.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value.map((categoryId) => (
                          <Badge key={categoryId} variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                            {quizCategories.find((c) => c.id === categoryId)?.label || categoryId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Quiz Status</FormLabel>
                      <FormDescription>
                        Active quizzes can be taken by students.
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

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setLocation(`/instructors-portal/quizzes/${quizId}`)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </InstructorLayout>
  );
}