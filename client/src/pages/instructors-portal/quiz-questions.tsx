import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, ArrowLeft, CheckCircle } from 'lucide-react';
import type { QuizQuestion } from '@shared/quiz-questions';

export default function QuizQuestionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const { data: questions = [], isLoading } = useQuery<QuizQuestion[]>({
    queryKey: ['/api/quiz-questions', selectedCategory],
    enabled: true,
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
    <div className="min-h-screen p-4" style={{ backgroundColor: '#f1f5f9' }}>
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

        {/* Filter Section */}
        <Card className="mb-6" style={{ backgroundColor: '#e2e8f0' }}>
          <CardHeader>
            <CardTitle className="text-gray-900">Filter Questions</CardTitle>
            <p className="text-gray-600">Select a category to view specific questions</p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger style={{ backgroundColor: '#f8fafc' }}>
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
        <Card style={{ backgroundColor: '#e2e8f0' }}>
          <CardHeader>
            <CardTitle className="text-gray-900">
              Questions ({filteredQuestions.length})
            </CardTitle>
            <p className="text-gray-600">All available quiz questions</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading questions...</div>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No questions found for the selected category.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question) => {
                  const isExpanded = expandedQuestions.has(question.id);

                  return (
                    <Collapsible key={question.id} open={isExpanded} onOpenChange={() => toggleExpanded(question.id)}>
                      <div className="border rounded-lg shadow-sm" style={{ backgroundColor: '#f8fafc' }}>
                        <CollapsibleTrigger asChild>
                          <div 
                            className="flex items-center justify-between p-4 hover:bg-slate-300/50 cursor-pointer"
                            style={{ backgroundColor: '#e2e8f0' }}
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <span className="font-medium truncate text-gray-900">
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
                          <div className="p-4 border-t space-y-4" style={{ backgroundColor: '#f8fafc' }}>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                              <p 
                                className="font-medium p-3 rounded" 
                                style={{ backgroundColor: '#e2e8f0', color: '#111827' }}
                              >
                                {question.question}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Answer Options:</h4>
                              <div className="space-y-2">
                                {question.options.map((option, index) => (
                                  <div
                                    key={index}
                                    className="p-3 rounded border"
                                    style={{
                                      backgroundColor: index === question.correctAnswer ? '#dcfce7' : '#e2e8f0',
                                      borderColor: index === question.correctAnswer ? '#86efac' : '#cbd5e1',
                                      color: '#111827'
                                    }}
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

                            <div className="flex items-center gap-4 text-sm text-gray-600">
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