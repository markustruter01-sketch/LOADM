import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { ArrowLeft, CheckSquare, Clock, AlertCircle, CheckCircle, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePermissions } from "@/lib/permissions";
import { PermissionDialog } from "@/components/PermissionDialog";

interface ChecklistItem {
  id: number;
  itemText: string;
  itemOrder: number;
  isRequired: boolean;
  category?: string;
}

interface ChecklistCompletion {
  id: number;
  completedItems: number[];
  completionStatus: "in_progress" | "completed";
  completedCount: number;
  totalItems: number;
  startedAt: string;
  completedAt?: string;
}

interface Checklist {
  id: number;
  title: string;
  description?: string;
  aircraftType: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  items: ChecklistItem[];
  creator: {
    email: string;
  };
  userCompletion?: ChecklistCompletion | null;
}

export default function ChecklistDetailPage() {
  const [, setLocation] = useLocation();
  const [match] = useRoute("/tools/checklists/:id");
  
  console.log('DEBUG CHECKLIST DETAIL: Raw match object:', match);
  console.log('DEBUG CHECKLIST DETAIL: Match params:', match?.params);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const queryClient = useQueryClient();
  // For now, assume canSubmit is true - permissions checked server-side  
  const canSubmit = true;

  // Extract ID from URL directly as fallback
  const urlPath = window.location.pathname;
  const urlIdMatch = urlPath.match(/\/tools\/checklists\/(\d+)/);
  const urlId = urlIdMatch ? parseInt(urlIdMatch[1]) : null;
  
  const checklistId = match?.params?.id ? parseInt(match.params.id) : urlId;
  
  console.log('DEBUG CHECKLIST DETAIL: Route match:', match);
  console.log('DEBUG CHECKLIST DETAIL: URL ID from regex:', urlId);
  console.log('DEBUG CHECKLIST DETAIL: Final Checklist ID:', checklistId);
  console.log('DEBUG CHECKLIST DETAIL: Query enabled:', !!checklistId && !isNaN(checklistId));
  console.log('DEBUG CHECKLIST DETAIL: URL:', window.location.href);

  const { data: checklist, isLoading, error } = useQuery({
    queryKey: [`/api/checklists/${checklistId}`],
    enabled: !!checklistId && !isNaN(checklistId)
  });
  
  console.log('DEBUG CHECKLIST DETAIL: Query result:', { checklist, isLoading, error });
  
  // Add authentication check
  const { data: authData } = useQuery({
    queryKey: ['/api/user/check'],
    retry: false
  });

  // Initialize checked items from user completion data
  useEffect(() => {
    if (checklist?.userCompletion?.completedItems) {
      setCheckedItems(new Set(checklist.userCompletion.completedItems));
    }
  }, [checklist]);

  const updateCompletionMutation = useMutation({
    mutationFn: (data: { checklistId: number; completedItems: number[] }) => 
      apiRequest(`/api/checklists/${data.checklistId}/completion`, {
        method: 'POST',
        body: JSON.stringify({ completedItems: data.completedItems })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/checklists/${checklistId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/checklists/completions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update checklist progress",
        variant: "destructive"
      });
    }
  });

  const handleItemCheck = (itemId: number) => {
    if (!canSubmit) {
      setShowPermissionDialog(true);
      return;
    }

    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(itemId)) {
      newCheckedItems.delete(itemId);
    } else {
      newCheckedItems.add(itemId);
    }
    setCheckedItems(newCheckedItems);

    // Auto-save progress
    updateCompletionMutation.mutate({
      checklistId: checklistId!,
      completedItems: Array.from(newCheckedItems)
    });
  };

  const handleCompleteChecklist = () => {
    if (!canSubmit) {
      setShowPermissionDialog(true);
      return;
    }

    if (!checklist) return;

    const allRequiredItems = checklist.items.filter(item => item.isRequired).map(item => item.id);
    const completedRequiredItems = allRequiredItems.filter(id => checkedItems.has(id));

    if (completedRequiredItems.length !== allRequiredItems.length) {
      toast({
        title: "Checklist Incomplete",
        description: "Please complete all required items before finishing the checklist.",
        variant: "destructive"
      });
      return;
    }

    // Mark all items as completed
    const allItemIds = checklist.items.map(item => item.id);
    setCheckedItems(new Set(allItemIds));

    updateCompletionMutation.mutate({
      checklistId: checklistId!,
      completedItems: allItemIds
    });

    toast({
      title: "Checklist Completed!",
      description: `${checklist.title} has been successfully completed.`,
      variant: "default"
    });
  };

  const handleBackClick = () => {
    setLocation("/tools/checklists");
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'startup': return 'bg-gray-700 text-green-400 border-gray-600';
      case 'shutdown': return 'bg-gray-700 text-red-400 border-gray-600';
      case 'pre-flight': return 'bg-gray-700 text-blue-400 border-gray-600';
      case 'post-flight': return 'bg-gray-700 text-purple-400 border-gray-600';
      case 'emergency': return 'bg-orange-500 text-white border-orange-400';
      default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
  };

  const groupItemsByCategory = (items: ChecklistItem[]) => {
    if (!items.length) return {};
    
    const grouped = items.reduce((acc, item) => {
      const category = item.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, ChecklistItem[]>);

    // Sort items within each category by itemOrder
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.itemOrder - b.itemOrder);
    });

    return grouped;
  };

  if (isLoading) {
    console.log('DEBUG CHECKLIST DETAIL: Showing loading state');
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading Checklist...</h1>
          <p className="text-gray-400">Please wait while we fetch the checklist details.</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('DEBUG CHECKLIST DETAIL: Showing error state:', error);
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Error Loading Checklist</h1>
          <p className="text-gray-400 mb-6">Error: {error.message}</p>
          <Button onClick={handleBackClick} className="bg-orange-500 hover:bg-orange-600">
            Back to Checklists
          </Button>
        </div>
      </div>
    );
  }
  
  if (!checklist) {
    console.log('DEBUG CHECKLIST DETAIL: Showing not found state - checklist is null/undefined');
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Checklist Not Found</h1>
          <p className="text-gray-400 mb-6">The requested checklist could not be found. ID: {checklistId}</p>
          <Button onClick={handleBackClick} className="bg-orange-500 hover:bg-orange-600">
            Back to Checklists
          </Button>
        </div>
      </div>
    );
  }

  const groupedItems = groupItemsByCategory(checklist.items);
  const totalItems = checklist.items.length;
  const completedItems = checkedItems.size;
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const isCompleted = checklist.userCompletion?.completionStatus === "completed";
  const requiredItems = checklist.items.filter(item => item.isRequired);
  const completedRequiredItems = requiredItems.filter(item => checkedItems.has(item.id)).length;

  return (
    <>
      <Helmet>
        <title>{checklist.title} - Aircraft Checklist - LOADMworkflow</title>
        <meta name="description" content={`Complete ${checklist.title} checklist for ${checklist.aircraftType}`} />
      </Helmet>

      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-200 hover:bg-gray-800" 
              onClick={handleBackClick}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Checklists
            </Button>
            
            {isCompleted && (
              <Badge className="bg-green-600 text-white border-green-500 px-3 py-1">
                <CheckCircle className="h-4 w-4 mr-1" />
                Completed
              </Badge>
            )}
          </div>

          {/* Checklist Header */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 mb-3">
                  <Plane className="h-6 w-6 text-orange-500" />
                  <Badge variant="outline" className="border-gray-600 text-gray-300 bg-gray-700">
                    {checklist.aircraftType}
                  </Badge>
                  <Badge className={getCategoryColor(checklist.category)}>
                    {checklist.category.charAt(0).toUpperCase() + checklist.category.slice(1).replace('-', ' ')}
                  </Badge>
                </div>
              </div>
              
              <CardTitle className="text-2xl text-white mb-2">
                {checklist.title}
              </CardTitle>
              
              {checklist.description && (
                <CardDescription className="text-gray-300 text-base">
                  {checklist.description}
                </CardDescription>
              )}

              {/* Progress Section */}
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Overall Progress</span>
                  <span className="text-sm text-gray-300">{completedItems}/{totalItems} items</span>
                </div>
                <Progress 
                  value={completionPercentage} 
                  className="h-2"
                  style={{
                    background: "rgb(55, 65, 81)" // gray-700
                  } as any}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span className="text-orange-400">{completionPercentage}% Complete</span>
                  {requiredItems.length > 0 && (
                    <span>Required: <span className="text-orange-400">{completedRequiredItems}/{requiredItems.length}</span></span>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Checklist Items */}
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([categoryName, items]) => (
              <Card key={categoryName} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-orange-500" />
                    {categoryName}
                    <Badge variant="outline" className="ml-2 text-xs border-gray-600 text-gray-300 bg-gray-700">
                      {items.filter(item => checkedItems.has(item.id)).length}/{items.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div 
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                          checkedItems.has(item.id)
                            ? 'bg-green-900/20 border-green-700'
                            : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        <Checkbox
                          checked={checkedItems.has(item.id)}
                          onCheckedChange={() => handleItemCheck(item.id)}
                          className="mt-0.5 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <div className="flex-1">
                          <div className={`font-medium ${
                            checkedItems.has(item.id) ? 'text-green-300' : 'text-gray-100'
                          }`}>
                            {item.itemText}
                            {item.isRequired && (
                              <Badge className="ml-2 text-xs bg-orange-500 text-white border-orange-400">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Complete Button */}
          {!isCompleted && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Ready to Complete?</h3>
                <p className="text-gray-400 mb-4">
                  Make sure all required items are checked before completing the checklist.
                </p>
                <Button
                  onClick={handleCompleteChecklist}
                  disabled={updateCompletionMutation.isPending || completedRequiredItems !== requiredItems.length}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2"
                >
                  {updateCompletionMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Checklist
                    </>
                  )}
                </Button>
                {completedRequiredItems !== requiredItems.length && requiredItems.length > 0 && (
                  <p className="text-xs text-orange-400 mt-2">
                    Complete all {requiredItems.length} required items to finish
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Completion Info */}
          {isCompleted && checklist.userCompletion?.completedAt && (
            <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                  Checklist Completed!
                </h3>
                <p className="text-green-600 dark:text-green-300">
                  Completed on {new Date(checklist.userCompletion.completedAt).toLocaleDateString()} at{' '}
                  {new Date(checklist.userCompletion.completedAt).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PermissionDialog 
        isOpen={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        action="complete checklists"
        feature="Checklist Completion"
      />
    </>
  );
}