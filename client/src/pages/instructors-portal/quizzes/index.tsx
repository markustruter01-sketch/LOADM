import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Plus, BookOpen, Trash2, Edit, RefreshCw, ArrowLeft } from "lucide-react";
import { useIsolatedAuth } from "@/auth-isolated/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function InstructorQuizzes() {
  const { user } = useIsolatedAuth();
  const isReadOnly = user?.role === 'leadership';
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [quizToDelete, setQuizToDelete] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { data: quizzes, isLoading, refetch } = useQuery({
    queryKey: ['/api/quizzes'],
    queryFn: ({ queryKey, signal }) => fetch('/api/quizzes', { signal }).then(res => res.json()),
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnMount: true, // Always refresh when component mounts
    staleTime: 0, // Consider data immediately stale
  });

  // Update last refresh time when data changes
  useEffect(() => {
    if (quizzes) {
      setLastRefresh(new Date());
    }
  }, [quizzes]);

  const handleDeleteQuiz = async (id: number) => {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid quiz ID');
      }

      const response = await apiRequest({
        url: `/api/quizzes/${id}`,
        method: 'DELETE'
      });

      // apiRequest throws on error, so if we reach here, deletion was successful
      toast({
        title: "Quiz deleted",
        description: "The quiz has been successfully deleted.",
      });

      // Invalidate and refetch quizzes data immediately
      await queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      await queryClient.refetchQueries({ queryKey: ['/api/quizzes'] });
      setQuizToDelete(null);
    } catch (error: any) {
      console.error("Error deleting quiz:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete the quiz. Please try again.",
        variant: "destructive",
      });
      setQuizToDelete(null);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No date';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      'dangerous-goods': 'Dangerous Goods',
      'loadmaster-fundamentals': 'Fundamentals',
      'emergency-procedures': 'Emergency',
      'weight-balance': 'Weight & Balance',
      'cargo-securing': 'Cargo Securing',
      'aircraft-systems': 'Aircraft Systems',
      'regulations': 'Regulations',
      'equipment-handling': 'Equipment',
    };
    
    return categoryMap[category] || category;
  };

  return (
    <>
      <Helmet>
        <title>Pop Quizzes - Instructor Portal | LOADMworkflow</title>
        <meta name="description" content="Create and manage pop quizzes for loadmaster training" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/instructors-portal">
            <Button variant="ghost" className="text-primary hover:text-primary/80 p-2">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Pop Quizzes</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => refetch()}
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            {!isReadOnly && (
              <Button 
                onClick={() => setLocation('/instructors-portal/quizzes/create')}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Pop Quiz
              </Button>
            )}
          </div>
        </div>

        <p className="text-muted-foreground mb-4">
          Create random pop quizzes from the library of loadmaster questions. Assign a quiz to test students on specific topics.
        </p>
        
        <p className="text-xs text-muted-foreground mb-8">
          Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refreshes every 5 seconds
        </p>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : quizzes && quizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz: any) => (
              <Card key={quiz.id} className="bg-card hover:shadow-md transition-shadow">
                <CardHeader className="bg-muted/10 rounded-t-lg pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{quiz.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Created {formatDate(quiz.createdAt)} by {quiz.createdBy?.username || 'Unknown'}
                      </CardDescription>
                    </div>
                    <Badge variant={quiz.is_active ? "default" : "secondary"}>
                      {quiz.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    {quiz.description || "No description provided."}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {quiz.categories && quiz.categories.map((category: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                        {getCategoryLabel(category)}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{quiz.questionCount} questions</p>
                    {quiz.expiresAt && (
                      <p>Expires: {formatDate(quiz.expiresAt)}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between bg-muted/5 pt-3 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/instructors-portal/quizzes/${quiz.id}`)}
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {!isReadOnly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/instructors-portal/quizzes/edit/${quiz.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {!isReadOnly && (
                  <AlertDialog open={quizToDelete === quiz.id} onOpenChange={(open) => !open && setQuizToDelete(null)}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => setQuizToDelete(quiz.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this quiz?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the quiz and all associated data. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No Quizzes Found</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                {isReadOnly ? "No pop quizzes have been created yet." : "You haven't created any pop quizzes yet. Create your first quiz to test students on their loadmaster knowledge."}
              </p>
              {!isReadOnly && (
              <Button 
                onClick={() => setLocation('/instructors-portal/quizzes/create')}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Pop Quiz
              </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}