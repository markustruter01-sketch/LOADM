import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ChevronDown, ChevronRight, ArrowLeft, CheckCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { QuizQuestion } from '@shared/quiz-questions';

export default function QuizQuestionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: questions = [], isLoading } = useQuery<QuizQuestion[]>({
    queryKey: ['/api/quiz-questions', selectedCategory],
    enabled: true,
  });

  // Mutations for CRUD operations
  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: Omit<QuizQuestion, 'id'>) => {
      const response = await fetch('/api/quiz-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData),
      });
      if (!response.ok) throw new Error('Failed to create question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-questions'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Question created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create question: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (questionData: QuizQuestion) => {
      const response = await fetch(`/api/quiz-questions/${questionData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData),
      });
      if (!response.ok) throw new Error('Failed to update question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-questions'] });
      setEditingQuestion(null);
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update question: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await fetch(`/api/quiz-questions/${questionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-questions'] });
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete question: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    setExpandedQuestions(new Set());
  }, [selectedCategory]);

  const filteredQuestions = selectedCategory === 'all' 
    ? questions 
    : questions.filter(q => q.category === selectedCategory);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'dangerous-goods', label: 'Dangerous Goods' },
    { value: 'loadmaster-fundamentals', label: 'Loadmaster Fundamentals' },
    { value: 'emergency-procedures', label: 'Emergency Procedures' },
    { value: 'weight-balance', label: 'Weight & Balance' },
    { value: 'cargo-securing', label: 'Cargo Securing' },
    { value: 'aircraft-systems', label: 'Aircraft Systems' },
    { value: 'regulations', label: 'Regulations' },
    { value: 'equipment-handling', label: 'Equipment Handling' }
  ];

  const toggleExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <Helmet>
        <title>Quiz Questions Management - LOADMdocs</title>
        <meta name="description" content="Manage and review quiz questions for loadmaster training" />
      </Helmet>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/instructors-portal">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Portal
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Quiz Questions Management</h1>
              <p className="text-muted-foreground">Review and manage quiz questions by category</p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Quiz Question</DialogTitle>
              </DialogHeader>
              <div className="text-center py-8 text-muted-foreground">
                Question form coming soon...
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Section */}
        <Card className="mb-6 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Filter Questions</CardTitle>
            <p className="text-muted-foreground">Select a category to view specific questions</p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              Questions ({filteredQuestions.length})
            </CardTitle>
            <p className="text-muted-foreground">All available quiz questions</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading questions...</div>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No questions found for the selected category.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question) => {
                  const isExpanded = expandedQuestions.has(question.id);

                  return (
                    <Collapsible key={question.id} open={isExpanded} onOpenChange={() => toggleExpanded(question.id)}>
                      <div className="border rounded-lg shadow-sm bg-card">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer bg-muted/30">
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <span className="font-medium truncate text-foreground">
                                {question.question.substring(0, 100)}
                                {question.question.length > 100 && '...'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded ${getDifficultyBadgeColor(question.difficulty)}`}>
                                {question.difficulty}
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {question.category}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingQuestion(question);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Are you sure you want to delete this question?')) {
                                    deleteQuestionMutation.mutate(question.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="p-4 border-t space-y-4 bg-card">
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Question:</h4>
                              <p className="font-medium p-3 rounded bg-muted text-foreground">
                                {question.question}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Answer Options:</h4>
                              <div className="space-y-2">
                                {question.options.map((option, index) => (
                                  <div
                                    key={index}
                                    className={`p-3 rounded border ${
                                      index === question.correctAnswer
                                        ? 'bg-green-100 border-green-300 text-green-900'
                                        : 'bg-muted border-border text-foreground'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {String.fromCharCode(65 + index)}.
                                      </span>
                                      <span>{option}</span>
                                      {index === question.correctAnswer && (
                                        <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Difficulty: <strong>{question.difficulty}</strong></span>
                              <span>Category: <strong>{question.category}</strong></span>
                            </div>
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
      </div>
    </div>
  );
}