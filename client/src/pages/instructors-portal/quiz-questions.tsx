import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { QuizQuestion } from "@shared/quiz-questions";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";

const QUESTION_CATEGORIES = [
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

export default function QuizQuestionsManagement() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  // Fetch quiz questions from API
  const { data: questions = [], isLoading, error } = useQuery<QuizQuestion[]>({
    queryKey: [`/api/quiz-questions`, selectedCategory],
    queryFn: async () => {
      const params = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
      const response = await fetch(`/api/quiz-questions${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.statusText}`);
      }
      return response.json();
    }
  });

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
    <div className="min-h-screen bg-slate-100 p-4 quiz-questions-page">
      <Helmet>
        <title>Quiz Questions Management - LOADMdocs</title>
        <meta name="description" content="Manage and review quiz questions for loadmaster training" />
      </Helmet>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/instructors-portal">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portal
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quiz Questions Management</h1>
            <p className="text-gray-600">Review and manage quiz questions by category</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Questions</CardTitle>
            <CardDescription>
              Select a category to view specific questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_CATEGORIES.map((category) => (
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Questions ({questions.length})
              </span>
            </CardTitle>
            <CardDescription>
              {selectedCategory === 'all' 
                ? 'All available quiz questions' 
                : `Questions in ${QUESTION_CATEGORIES.find(c => c.value === selectedCategory)?.label} category`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading questions...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-red-500">Error loading questions: {error.message}</div>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">No questions found for this category</div>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => {
                  const isExpanded = expandedQuestions.has(question.id);

                  return (
                    <Collapsible key={question.id} open={isExpanded} onOpenChange={() => toggleExpanded(question.id)}>
                      <div className="border rounded-lg bg-slate-100 shadow-sm">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 hover:bg-slate-300/50 cursor-pointer bg-slate-200 quiz-question-container">
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <span className="font-medium truncate">
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
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="p-4 border-t space-y-4 bg-slate-50 quiz-question-content">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                              <p className="text-gray-900 font-medium bg-slate-200 p-3 rounded quiz-question-text">{question.question}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Answer Options:</h4>
                              <div className="space-y-2">
                                {question.options.map((option, index) => (
                                  <div
                                    key={index}
                                    className={`p-3 rounded border ${
                                      index === question.correctAnswer
                                        ? 'bg-green-100 border-green-300 text-green-900'
                                        : 'bg-slate-200 border-slate-300 text-gray-900'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {String.fromCharCode(65 + index)}.
                                      </span>
                                      <span className="text-gray-900">{option}</span>
                                      {index === question.correctAnswer && (
                                        <span className="ml-auto text-green-600 text-sm font-medium">
                                          ✓ Correct Answer
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="text-sm text-gray-500">
                                ID: {question.id} | Category: {question.category} | Difficulty: {question.difficulty}
                              </div>
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