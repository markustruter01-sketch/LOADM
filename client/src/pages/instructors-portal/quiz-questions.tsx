import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { QuizQuestion as DBQuizQuestion } from "@shared/schema";
import { QuizQuestion as SharedQuizQuestion } from "@shared/quiz-questions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, ChevronDown, ChevronRight, Edit, Trash2, Plus, Save, X } from "lucide-react";

const QUESTION_CATEGORIES = [
  { value: 'dangerous-goods', label: 'Dangerous Goods' },
  { value: 'loadmaster-fundamentals', label: 'Loadmaster Fundamentals' },
  { value: 'emergency-procedures', label: 'Emergency Procedures' },
  { value: 'weight-balance', label: 'Weight & Balance' },
  { value: 'cargo-securing', label: 'Cargo Securing' },
  { value: 'aircraft-systems', label: 'Aircraft Systems' },
  { value: 'regulations', label: 'Regulations' },
  { value: 'equipment-handling', label: 'Equipment Handling' }
];

interface EditingQuestion extends QuizQuestion {
  isEditing?: boolean;
}

export default function QuizQuestionsManagement() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('dangerous-goods');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [editingQuestions, setEditingQuestions] = useState<Map<number, EditingQuestion>>(new Map());
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    category: 'dangerous-goods',
    questionText: '',
    correctAnswer: '',
    incorrectOption1: '',
    incorrectOption2: '',
    incorrectOption3: '',
    difficulty: 'medium'
  });

  const { data: questions, isLoading } = useQuery<QuizQuestion[]>({
    queryKey: ['/api/quiz-questions', selectedCategory],
    queryFn: ({ queryKey, signal }) => 
      fetch(`${queryKey[0]}?category=${queryKey[1]}`, { signal })
        .then(res => res.ok ? res.json() : [])
        .catch(() => [])
  });

  const createQuestionMutation = useMutation({
    mutationFn: (questionData: any) => apiRequest({
      url: '/api/quiz-questions',
      method: 'POST',
      body: questionData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-questions'] });
      setShowNewQuestion(false);
      setNewQuestion({
        category: 'dangerous-goods',
        questionText: '',
        correctAnswer: '',
        incorrectOption1: '',
        incorrectOption2: '',
        incorrectOption3: '',
        difficulty: 'medium'
      });
      toast({
        title: "Question created",
        description: "New quiz question has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest({
        url: `/api/quiz-questions/${id}`,
        method: 'PUT',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-questions'] });
      setEditingQuestions(new Map());
      toast({
        title: "Question updated",
        description: "Quiz question has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: number) => apiRequest({
      url: `/api/quiz-questions/${id}`,
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-questions'] });
      setQuestionToDelete(null);
      toast({
        title: "Question deleted",
        description: "Quiz question has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleExpanded = (questionId: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const startEditing = (question: QuizQuestion) => {
    const newEditing = new Map(editingQuestions);
    newEditing.set(question.id, { ...question, isEditing: true });
    setEditingQuestions(newEditing);
  };

  const cancelEditing = (questionId: number) => {
    const newEditing = new Map(editingQuestions);
    newEditing.delete(questionId);
    setEditingQuestions(newEditing);
  };

  const saveQuestion = (questionId: number) => {
    const editingQuestion = editingQuestions.get(questionId);
    if (!editingQuestion) return;

    if (!editingQuestion.questionText.trim() || 
        !editingQuestion.correctAnswer.trim() || 
        !editingQuestion.incorrectOption1.trim() || 
        !editingQuestion.incorrectOption2.trim() || 
        !editingQuestion.incorrectOption3.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    updateQuestionMutation.mutate({ 
      id: questionId, 
      data: {
        category: editingQuestion.category,
        questionText: editingQuestion.questionText,
        correctAnswer: editingQuestion.correctAnswer,
        incorrectOption1: editingQuestion.incorrectOption1,
        incorrectOption2: editingQuestion.incorrectOption2,
        incorrectOption3: editingQuestion.incorrectOption3,
        difficulty: editingQuestion.difficulty
      }
    });
  };

  const updateEditingQuestion = (questionId: number, field: string, value: string) => {
    const newEditing = new Map(editingQuestions);
    const question = newEditing.get(questionId);
    if (question) {
      newEditing.set(questionId, { ...question, [field]: value });
      setEditingQuestions(newEditing);
    }
  };

  const handleCreateQuestion = () => {
    if (!newQuestion.questionText.trim() || 
        !newQuestion.correctAnswer.trim() || 
        !newQuestion.incorrectOption1.trim() || 
        !newQuestion.incorrectOption2.trim() || 
        !newQuestion.incorrectOption3.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createQuestionMutation.mutate(newQuestion);
  };

  const filteredQuestions = questions?.filter(q => q.category === selectedCategory) || [];

  return (
    <>
      <Helmet>
        <title>Pop Quiz Questions - Instructors Portal</title>
        <meta 
          name="description" 
          content="Manage quiz question bank for pop quizzes." 
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-6"
          onClick={() => navigate("/instructors-portal")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Instructors Portal
        </Button>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pop Quiz Questions</h1>
          <p className="text-muted-foreground">
            Manage the question bank used for generating pop quizzes. Edit questions, correct answers, and incorrect options.
          </p>
        </div>

        {/* Category Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Category</CardTitle>
            <CardDescription>Choose a question category to view and edit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={() => setShowNewQuestion(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Question
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* New Question Form */}
        {showNewQuestion && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Create New Question</CardTitle>
              <CardDescription>Add a new question to the {QUESTION_CATEGORIES.find(c => c.value === selectedCategory)?.label} category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newQuestionText">Question</Label>
                <Textarea
                  id="newQuestionText"
                  value={newQuestion.questionText}
                  onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                  placeholder="Enter the quiz question..."
                  rows={3}
                  className="text-white bg-gray-800 border-gray-600"
                />
              </div>
              
              <div>
                <Label htmlFor="correctAnswer">Correct Answer</Label>
                <Input
                  id="correctAnswer"
                  value={newQuestion.correctAnswer}
                  onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                  placeholder="Enter the correct answer..."
                  className="text-gray-900"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="incorrect1">Incorrect Option 1</Label>
                  <Input
                    id="incorrect1"
                    value={newQuestion.incorrectOption1}
                    onChange={(e) => setNewQuestion({ ...newQuestion, incorrectOption1: e.target.value })}
                    placeholder="First incorrect answer..."
                    className="text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="incorrect2">Incorrect Option 2</Label>
                  <Input
                    id="incorrect2"
                    value={newQuestion.incorrectOption2}
                    onChange={(e) => setNewQuestion({ ...newQuestion, incorrectOption2: e.target.value })}
                    placeholder="Second incorrect answer..."
                    className="text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="incorrect3">Incorrect Option 3</Label>
                  <Input
                    id="incorrect3"
                    value={newQuestion.incorrectOption3}
                    onChange={(e) => setNewQuestion({ ...newQuestion, incorrectOption3: e.target.value })}
                    placeholder="Third incorrect answer..."
                    className="text-gray-900"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={handleCreateQuestion}
                  disabled={createQuestionMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Create Question
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewQuestion(false)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {QUESTION_CATEGORIES.find(c => c.value === selectedCategory)?.label} Questions 
              ({filteredQuestions.length})
            </CardTitle>
            <CardDescription>
              Click on any question to expand and edit its content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading questions...</div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No questions found for this category. Click "Add New Question" to create one.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question) => {
                  const isExpanded = expandedQuestions.has(question.id);
                  const editingQuestion = editingQuestions.get(question.id);
                  const isEditing = editingQuestion?.isEditing;

                  return (
                    <Collapsible key={question.id} open={isExpanded} onOpenChange={() => toggleExpanded(question.id)}>
                      <div className="border rounded-lg">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer">
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <span className="font-medium truncate">
                                {question.question?.substring(0, 100) || question.questionText?.substring(0, 100) || 'No question text'}
                                {(question.question && question.question.length > 100) || (question.questionText && question.questionText.length > 100) ? '...' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                {question.difficulty}
                              </span>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="p-4 border-t space-y-4">
                            {isEditing ? (
                              <>
                                <div>
                                  <Label htmlFor={`edit-question-${question.id}`}>Question</Label>
                                  <Textarea
                                    id={`edit-question-${question.id}`}
                                    value={editingQuestion.question || editingQuestion.questionText}
                                    onChange={(e) => updateEditingQuestion(question.id, 'question', e.target.value)}
                                    rows={3}
                                    className="text-white bg-gray-800 border-gray-600"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`edit-correct-${question.id}`}>Correct Answer</Label>
                                  <Input
                                    id={`edit-correct-${question.id}`}
                                    value={editingQuestion.correctAnswer}
                                    onChange={(e) => updateEditingQuestion(question.id, 'correctAnswer', e.target.value)}
                                    className="bg-green-50 border-green-200 text-gray-900"
                                  />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <Label htmlFor={`edit-inc1-${question.id}`}>Incorrect Option 1</Label>
                                    <Input
                                      id={`edit-inc1-${question.id}`}
                                      value={editingQuestion.incorrectOption1}
                                      onChange={(e) => updateEditingQuestion(question.id, 'incorrectOption1', e.target.value)}
                                      className="bg-red-50 border-red-200 text-gray-900"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`edit-inc2-${question.id}`}>Incorrect Option 2</Label>
                                    <Input
                                      id={`edit-inc2-${question.id}`}
                                      value={editingQuestion.incorrectOption2}
                                      onChange={(e) => updateEditingQuestion(question.id, 'incorrectOption2', e.target.value)}
                                      className="bg-red-50 border-red-200 text-gray-900"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`edit-inc3-${question.id}`}>Incorrect Option 3</Label>
                                    <Input
                                      id={`edit-inc3-${question.id}`}
                                      value={editingQuestion.incorrectOption3}
                                      onChange={(e) => updateEditingQuestion(question.id, 'incorrectOption3', e.target.value)}
                                      className="bg-red-50 border-red-200 text-gray-900"
                                    />
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => saveQuestion(question.id)}
                                    disabled={updateQuestionMutation.isPending}
                                  >
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => cancelEditing(question.id)}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <Label>Question</Label>
                                  <div className="p-3 bg-muted rounded border text-white">
                                    {question.questionText}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label>Correct Answer</Label>
                                  <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800">
                                    ✓ {question.correctAnswer}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label>Incorrect Options</Label>
                                  <div className="space-y-2">
                                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                                      ✗ {question.incorrectOption1}
                                    </div>
                                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                                      ✗ {question.incorrectOption2}
                                    </div>
                                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                                      ✗ {question.incorrectOption3}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2 pt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => startEditing(question)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Question
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => setQuestionToDelete(question.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={questionToDelete !== null} onOpenChange={() => setQuestionToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Question</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this question? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => questionToDelete && deleteQuestionMutation.mutate(questionToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Question
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}