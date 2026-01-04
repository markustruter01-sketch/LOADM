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
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
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

    // Show completion animation
    setShowCompletionAnimation(true);

    updateCompletionMutation.mutate({
      checklistId: checklistId!,
      completedItems: allItemIds
    });

    // Hide animation after 3 seconds and navigate back to tools
    setTimeout(() => {
      setShowCompletionAnimation(false);
      setLocation("/tools");
    }, 3000);
  };

  const handleBackClick = () => {
    setLocation("/tools");
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

  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [pages, setPages] = useState<ChecklistItem[][]>([]);

  // Page height logic
  useEffect(() => {
    if (checklist?.items) {
      const sortedItems = [...checklist.items].sort((a, b) => a.itemOrder - b.itemOrder);
      const newPages: ChecklistItem[][] = [];
      let currentPageItems: ChecklistItem[] = [];
      let currentHeight = 0;
      const MAX_PAGE_HEIGHT = 650; // Roughly the height of a QRH page in pixels
      const ITEM_HEIGHT = 42; // Height of an item including spacing and leader line

      sortedItems.forEach(item => {
        if (currentHeight + ITEM_HEIGHT > MAX_PAGE_HEIGHT) {
          newPages.push(currentPageItems);
          currentPageItems = [item];
          currentHeight = ITEM_HEIGHT;
        } else {
          currentPageItems.push(item);
          currentHeight += ITEM_HEIGHT;
        }
      });
      if (currentPageItems.length > 0) newPages.push(currentPageItems);
      setPages(newPages);
    }
  }, [checklist]);

  const handleNextPage = () => {
    if (currentPage < pages.length - 1 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsFlipping(false);
      }, 600);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsFlipping(false);
      }, 600);
    }
  };

  const getStatusValue = (itemText: string) => {
    if (itemText.toLowerCase().includes("off")) return "OFF";
    if (itemText.toLowerCase().includes("on")) return "ON";
    if (itemText.toLowerCase().includes("check")) return "CHECK";
    if (itemText.toLowerCase().includes("idle")) return "IDLE";
    if (itemText.toLowerCase().includes("ign")) return "IGN";
    if (itemText.toLowerCase().includes("order")) return "ORDER";
    if (itemText.toLowerCase().includes("down")) return "DOWN";
    return "AS REQ";
  };

  const cleanItemText = (text: string) => {
    // Remove status words from the main text to avoid duplication
    return text.replace(/\s+(ON|OFF|CHECK|IDLE|IGN|ORDER|DOWN|AS REQ)$/i, "").trim();
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
            Back to Tools
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
            Back to Tools
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

      <div className="min-h-screen p-6 bg-[#121212]">
        <style>{`
          .qrh-page {
            transition: transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1);
            transform-origin: left center;
            perspective: 1500px;
          }
          .qrh-flipping {
            transform: rotateY(-180deg);
            opacity: 0;
          }
          .qrh-binding {
            background-image: radial-gradient(circle at 10px 10px, #000 8px, transparent 9px);
            background-size: 100% 32px;
          }
          .leader-line::after {
            content: "";
            flex: 1;
            margin: 0 8px;
            border-bottom: 2px dotted #ccc;
            height: 14px;
          }
        `}</style>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-200 hover:bg-gray-800" 
              onClick={handleBackClick}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tools
            </Button>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">Page {currentPage + 1} of {pages.length}</span>
              {isCompleted && (
                <Badge className="bg-green-600 text-white border-green-500 px-3 py-1">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>

          <div className="relative flex">
            {/* Spiral Binding */}
            <div className="w-12 bg-gray-300 rounded-l-lg shadow-inner qrh-binding flex flex-col items-center py-4 z-20">
              {/* Visible rings */}
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-8 h-3 bg-black rounded-full mb-5 shadow-md" />
              ))}
            </div>

            {/* Main QRH Page Container */}
            <div className={`flex-1 bg-white text-black min-h-[850px] shadow-2xl rounded-r-lg overflow-hidden relative qrh-page ${isFlipping ? 'qrh-flipping' : ''}`}>
              {/* QRH Header Bar */}
              <div className="border-b-4 border-black p-4 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center border-2 border-black rounded-full">
                    <Plane className="h-6 w-6 text-black" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xl tracking-tighter">{checklist.aircraftType}</span>
                    <span className="text-[10px] font-bold uppercase border-t border-black pt-0.5">Emergency Procedures</span>
                  </div>
                </div>
                <div className="flex-1 text-center border-x-2 border-black mx-4 px-4 h-full flex flex-col justify-center">
                  <h1 className="text-xl font-extrabold uppercase tracking-tight leading-none">
                    {checklist.title}
                  </h1>
                </div>
                <div className="flex gap-4 text-right">
                  <div className="flex flex-col text-[10px] font-bold">
                    <span>REV 06</span>
                    <span>SEQ 109</span>
                  </div>
                  <div className="bg-black text-white px-2 py-1 flex items-center justify-center font-black text-xl">
                    {1 + currentPage / 100}.{String(currentPage + 7).padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* Page Content */}
              <div className="p-8 pb-20">
                {/* Title Section Banner */}
                <div className="bg-black text-white text-center py-1 font-black uppercase tracking-widest mb-6">
                  {checklist.title}
                </div>

                <div className="space-y-4">
                  {pages[currentPage]?.map((item, index) => (
                    <div 
                      key={item.id}
                      className={`flex items-start gap-4 p-2 transition-colors ${
                        checkedItems.has(item.id) ? 'bg-green-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Checkbox
                        checked={checkedItems.has(item.id)}
                        onCheckedChange={() => handleItemCheck(item.id)}
                        className="mt-1 border-black data-[state=checked]:bg-black data-[state=checked]:border-black"
                      />
                      <div className="flex-1 flex items-center leader-line">
                        <span className={`font-bold uppercase text-sm tracking-tighter ${checkedItems.has(item.id) ? 'line-through text-gray-400' : ''}`}>
                          <span className="mr-2">—</span>
                          {cleanItemText(item.itemText)}
                        </span>
                        <span className={`font-black text-sm ml-auto whitespace-nowrap ${checkedItems.has(item.id) ? 'text-green-600' : ''}`}>
                          {getStatusValue(item.itemText)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer / Notes area */}
                {currentPage === pages.length - 1 && checklist.description && (
                  <div className="mt-12 p-4 border-2 border-dashed border-gray-400 italic text-xs text-gray-600">
                    <span className="font-bold uppercase block mb-1">NOTES:</span>
                    {checklist.description}
                  </div>
                )}
              </div>

              {/* Progress Bar (Bottom) */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase text-gray-500">Progress: {completionPercentage}%</span>
                  <span className="text-[10px] font-bold uppercase text-gray-500">{completedItems}/{totalItems} ITEMS</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-black transition-all duration-500" 
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Flip Button Right */}
              {currentPage < pages.length - 1 && (
                <button
                  onClick={handleNextPage}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-24 bg-black/10 hover:bg-black/20 rounded-l-full flex items-center justify-center transition-all group z-30"
                  aria-label="Next Page"
                >
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[15px] border-l-black border-b-[10px] border-b-transparent group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {/* Flip Button Left */}
              {currentPage > 0 && (
                <button
                  onClick={handlePrevPage}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-24 bg-black/10 hover:bg-black/20 rounded-r-full flex items-center justify-center transition-all group z-30"
                  aria-label="Previous Page"
                >
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-r-[15px] border-r-black border-b-[10px] border-b-transparent group-hover:-translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* Complete Button - External to the page for clarity */}
          {!isCompleted && currentPage === pages.length - 1 && (
            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleCompleteChecklist}
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-6 text-xl rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95"
                disabled={updateCompletionMutation.isPending || completedRequiredItems !== requiredItems.length}
              >
                <CheckCircle className="h-6 w-6 mr-2" />
                COMPLETE CHECKLIST
              </Button>
            </div>
          )}
        </div>
      </div>

      <PermissionDialog 
        isOpen={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        action="complete checklists"
        feature="Checklist Completion"
      />

      {/* Completion Animation Overlay */}
      {showCompletionAnimation && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="relative">
              {/* Main check mark animation */}
              <div className="mx-auto mb-6">
                <div className="relative w-32 h-32 mx-auto">
                  {/* Animated background circle */}
                  <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-75"></div>
                  <div className="absolute inset-0 rounded-full bg-green-500 animate-pulse"></div>
                  
                  {/* Check mark */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle className="w-20 h-20 text-white animate-bounce" />
                  </div>
                </div>
              </div>
              
              {/* Text animation */}
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-white animate-pulse">
                  Down to the Line
                </h1>
                <h2 className="text-2xl font-semibold text-green-400 animate-bounce">
                  Checklist Complete!
                </h2>
                <div className="flex items-center justify-center gap-2 mt-6">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}