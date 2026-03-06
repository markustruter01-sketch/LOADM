import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Scenario, ScenarioQuestion, insertScenarioSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, ClipboardList, Edit, Loader2, Plus, Save, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Define form types
const scenarioFormSchema = insertScenarioSchema.extend({
  questions: z.array(
    z.object({
      id: z.string().min(1, "Question ID is required"),
      question: z.string().min(1, "Question text is required"),
      questionType: z.enum(["multiple-choice", "free-text"]).default("multiple-choice"),
      options: z.array(z.string()).default(["", ""]),
      correctAnswer: z.string().optional(),
    })
  ),
});

type ScenarioFormValues = z.infer<typeof scenarioFormSchema>;

export default function ScenarioManagement() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<number | null>(null);

  // Fetch all scenarios
  const { data: scenarios, isLoading } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
  });

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
          questionType: "multiple-choice" as const,
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
      toast({
        title: "Scenario created",
        description: "The scenario has been created successfully",
      });
      setIsCreating(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create scenario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update scenario mutation
  const updateScenarioMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ScenarioFormValues }) => {
      // Update the numberOfQuestions field to match the actual number of questions
      data.numberOfQuestions = data.questions.length;
      
      const res = await apiRequest("PUT", `/api/scenarios/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      toast({
        title: "Scenario updated",
        description: "The scenario has been updated successfully",
      });
      setEditingScenario(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update scenario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete scenario mutation
  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/scenarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      toast({
        title: "Scenario deleted",
        description: "The scenario has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setScenarioToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete scenario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ScenarioFormValues) => {
    if (editingScenario) {
      updateScenarioMutation.mutate({ id: editingScenario.id, data });
    } else {
      createScenarioMutation.mutate(data);
    }
  };

  // Add a new question to the form
  const addQuestion = () => {
    const questions = form.getValues().questions || [];
    form.setValue("questions", [
      ...questions,
      {
        id: `q${questions.length + 1}`,
        question: "",
        questionType: "multiple-choice" as const,
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

  // Handle edit scenario
  const handleEditScenario = (scenario: Scenario) => {
    setEditingScenario(scenario);
    
    // Transform the questions from any to ScenarioQuestion[] and set form values
    const questions = scenario.questions as ScenarioQuestion[];
    
    form.reset({
      title: scenario.title,
      description: scenario.description,
      numberOfQuestions: scenario.numberOfQuestions,
      questions,
    });
  };

  // Handle delete scenario
  const handleDeleteScenario = (id: number) => {
    setScenarioToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const confirmDelete = () => {
    if (scenarioToDelete) {
      deleteScenarioMutation.mutate(scenarioToDelete);
    }
  };

  // Handle dialog close and reset form
  const handleDialogClose = () => {
    if (!createScenarioMutation.isPending && !updateScenarioMutation.isPending) {
      form.reset();
      setIsCreating(false);
      setEditingScenario(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Scenario Management - LOADMdocs</title>
        <meta name="description" content="Manage training scenarios for LOADMdocs - create, edit, and delete scenarios." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/admin">
              <a className="text-primary hover:text-primary/80 mr-4">
                <ArrowLeft className="h-5 w-5" />
              </a>
            </Link>
            <h2 className="text-2xl font-bold">Scenario Management</h2>
          </div>
          <Dialog open={isCreating} onOpenChange={(open) => {
            setIsCreating(open);
            if (!open) handleDialogClose();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create Scenario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Training Scenario</DialogTitle>
                <DialogDescription>
                  Create a new training scenario with questions and answers.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Scenario title" />
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
                            placeholder="Provide a brief description of the scenario"
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Questions</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                      </Button>
                    </div>

                    {form.watch("questions")?.map((question, qIndex) => (
                      <Card key={qIndex} className="border border-border">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium">Question {qIndex + 1}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(qIndex)}
                              className="text-destructive hover:text-destructive/90"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4 space-y-4">
                          <FormField
                            control={form.control}
                            name={`questions.${qIndex}.id`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Question ID</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="unique_id" />
                                </FormControl>
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
                                  <Textarea {...field} placeholder="Enter the question" rows={2} />
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
                                  value={field.value || "multiple-choice"}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select question type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                    <SelectItem value="free-text">Free Text</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {form.watch(`questions.${qIndex}.questionType`) !== "free-text" && (
                            <>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <FormLabel>Options</FormLabel>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addOption(qIndex)}
                                    className="text-xs"
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
                                              <Input {...field} placeholder={`Option ${oIndex + 1}`} />
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
                                      <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={field.value}
                                        onChange={field.onChange}
                                      >
                                        <option value="">Select correct answer</option>
                                        {question.options.map((option, oIndex) => (
                                          <option key={oIndex} value={option} disabled={!option.trim()}>
                                            {option || `Option ${oIndex + 1} (empty)`}
                                          </option>
                                        ))}
                                      </select>
                                    </FormControl>
                                    <FormDescription>
                                      Select which option is the correct answer
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}

                          {form.watch(`questions.${qIndex}.questionType`) === "free-text" && (
                            <FormField
                              control={form.control}
                              name={`questions.${qIndex}.correctAnswer`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Model Answer (Instructor Reference)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      value={field.value || ""}
                                      placeholder="Enter the model answer for grading reference"
                                      rows={3}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Used as a reference when grading free text answers
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/90 text-white"
                      disabled={createScenarioMutation.isPending}
                    >
                      {createScenarioMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Create Scenario
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Scenario Dialog */}
          <Dialog open={editingScenario !== null} onOpenChange={(open) => {
            if (!open) {
              setEditingScenario(null);
              handleDialogClose();
            }
          }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Training Scenario</DialogTitle>
                <DialogDescription>
                  Update the training scenario, questions, and answers.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Scenario title" />
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
                            placeholder="Provide a brief description of the scenario"
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Questions</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                      </Button>
                    </div>

                    {form.watch("questions")?.map((question, qIndex) => (
                      <Card key={qIndex} className="border border-border">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium">Question {qIndex + 1}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(qIndex)}
                              className="text-destructive hover:text-destructive/90"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4 space-y-4">
                          <FormField
                            control={form.control}
                            name={`questions.${qIndex}.id`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Question ID</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="unique_id" />
                                </FormControl>
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
                                  <Textarea {...field} placeholder="Enter the question" rows={2} />
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
                                  value={field.value || "multiple-choice"}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select question type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                    <SelectItem value="free-text">Free Text</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {form.watch(`questions.${qIndex}.questionType`) !== "free-text" && (
                            <>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <FormLabel>Options</FormLabel>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addOption(qIndex)}
                                    className="text-xs"
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
                                              <Input {...field} placeholder={`Option ${oIndex + 1}`} />
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
                                      <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={field.value}
                                        onChange={field.onChange}
                                      >
                                        <option value="">Select correct answer</option>
                                        {question.options.map((option, oIndex) => (
                                          <option key={oIndex} value={option} disabled={!option.trim()}>
                                            {option || `Option ${oIndex + 1} (empty)`}
                                          </option>
                                        ))}
                                      </select>
                                    </FormControl>
                                    <FormDescription>
                                      Select which option is the correct answer
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}

                          {form.watch(`questions.${qIndex}.questionType`) === "free-text" && (
                            <FormField
                              control={form.control}
                              name={`questions.${qIndex}.correctAnswer`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Model Answer (Instructor Reference)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      value={field.value || ""}
                                      placeholder="Enter the model answer for grading reference"
                                      rows={3}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Used as a reference when grading free text answers
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/90 text-white"
                      disabled={updateScenarioMutation.isPending}
                    >
                      {updateScenarioMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Update Scenario
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Scenarios Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios && scenarios.length > 0 ? (
                  scenarios.map((scenario) => (
                    <TableRow key={scenario.id}>
                      <TableCell className="font-medium">{scenario.title}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {scenario.description}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-none">
                          {scenario.numberOfQuestions} questions
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditScenario(scenario)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => handleDeleteScenario(scenario.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <ClipboardList className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No scenarios found</p>
                        <Button
                          className="mt-4 bg-primary hover:bg-primary/90 text-white"
                          onClick={() => setIsCreating(true)}
                        >
                          Create Scenario
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              scenario and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
