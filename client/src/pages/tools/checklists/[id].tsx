import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { ArrowLeft, CheckSquare, Clock, AlertCircle, CheckCircle, Plane, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePermissions } from "@/lib/permissions";
import { PermissionDialog } from "@/components/PermissionDialog";
import SuccessAnimation from "@/components/SuccessAnimation";

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
  enforceLinearProgression: boolean;
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

  // Initialize checked items from user completion data
  useEffect(() => {
    if (checklist?.userCompletion?.completedItems) {
      setCheckedItems(new Set(checklist.userCompletion.completedItems));
    }
  }, [checklist]);

  const updateCompletionMutation = useMutation({
    mutationFn: (data: { checklistId: number; completedItems: number[] }) => 
      apiRequest({
        url: `/api/checklists/${data.checklistId}/completion`,
        method: 'POST',
        body: { completedItems: data.completedItems }
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

    if (!checklist) return;

    // Get sorted items by order
    const sortedItems = [...checklist.items].sort((a, b) => a.itemOrder - b.itemOrder);
    const itemIndex = sortedItems.findIndex(item => item.id === itemId);
    const item = sortedItems[itemIndex];

    // Enforce linear progression if enabled (QRH mode)
    if (checklist.enforceLinearProgression) {
      const isCurrentlyChecked = checkedItems.has(itemId);
      
      if (!isCurrentlyChecked) {
        // Check if all previous items are completed
        for (let i = 0; i < itemIndex; i++) {
          if (!checkedItems.has(sortedItems[i].id)) {
            toast({
              title: "Sequential Completion Required",
              description: `Complete "${sortedItems[i].itemText}" first. QRH procedures must be completed in order.`,
              variant: "destructive"
            });
            return;
          }
        }
      } else {
        // Unchecking: Only allow unchecking the last checked item
        const lastCheckedIndex = sortedItems.reduce((last, item, idx) => 
          checkedItems.has(item.id) ? idx : last, -1);
        
        if (itemIndex !== lastCheckedIndex) {
          toast({
            title: "Cannot Uncheck",
            description: "You can only uncheck the most recently completed item.",
            variant: "destructive"
          });
          return;
        }
      }
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
      const MAX_PAGE_HEIGHT = 750; // Increased height for rectangular look
      const ITEM_HEIGHT = 65; // Increased height to account for descriptors

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
    return text.replace(/\s+(ON|OFF|CHECK|IDLE|IGN|ORDER|DOWN|AS REQ|MAN ON|START|INITIATE)$/i, "").trim();
  };

  const getItemDescription = (text: string) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("start")) return "Ensure ignition sequence is active and fuel flow is monitored.";
    if (lowerText.includes("thrust")) return "Set levers to the specified position for current flight phase.";
    if (lowerText.includes("elec")) return "Check electrical bus status and emergency power availability.";
    if (lowerText.includes("radio")) return "Establish clear communication with ATC or ground crew.";
    if (lowerText.includes("load")) return "Verify load distribution and balance parameters.";
    if (lowerText.includes("sling")) return "Inspect rigging and attachment points for structural integrity.";
    return "Verify system state and follow standard operating procedures.";
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
            background: #e5e7eb;
          }
          .leader-line::after {
            content: "";
            flex: 1;
            margin: 0 8px;
            border-bottom: 2px dotted #000;
            height: 14px;
            opacity: 0.3;
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
            {/* Spiral Binding - Full Height */}
            <div className="w-16 bg-[#d1d5db] rounded-l-2xl shadow-inner flex flex-col items-center py-4 z-20 border-r border-gray-400 justify-between">
              {/* Binding Holes - Distributed evenly */}
              {[...Array(28)].map((_, i) => (
                <div key={i} className="w-10 h-5 bg-[#1a1a1a] rounded-full shadow-inner relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
                </div>
              ))}
            </div>

            {/* Main QRH Page Container - Rectangular and Tall */}
            <div className={`flex-1 bg-white text-black min-h-[1000px] shadow-2xl rounded-r-xl overflow-hidden relative qrh-page ${isFlipping ? 'qrh-flipping' : ''}`}>
              {/* QRH Header Bar */}
              <div className="border-b-4 border-black p-6 bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 flex items-center justify-center border-2 border-black rounded-full">
                    <Plane className="h-7 w-7 text-black" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-2xl tracking-tighter leading-none">{checklist.aircraftType}</span>
                    <span className="text-xs font-bold uppercase border-t-2 border-black mt-1 pt-1">Emergency Procedures</span>
                  </div>
                </div>
                <div className="flex-1 text-center border-x-4 border-black mx-6 px-6 h-full flex flex-col justify-center py-2">
                  <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">
                    {checklist.title}
                  </h1>
                </div>
                <div className="flex gap-6 text-right items-center">
                  <div className="flex flex-col text-xs font-black tracking-tight">
                    <span>REV 06</span>
                    <span>SEQ 109</span>
                  </div>
                  <div className="bg-black text-white px-3 py-2 flex items-center justify-center font-black text-2xl min-w-[60px]">
                    {1 + currentPage / 100}.{String(currentPage + 7).padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* Page Content */}
              <div className="p-10 pb-24">
                {/* Title Section Banner */}
                <div className="bg-black text-white text-center py-2 font-black uppercase tracking-[0.2em] mb-4 text-lg">
                  {checklist.title}
                </div>
                
                {/* QRH Mode Indicator */}
                {checklist.enforceLinearProgression && (
                  <div className="flex items-center justify-center gap-2 mb-6 p-2 bg-amber-50 border border-amber-300 rounded-lg">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold uppercase tracking-wide text-amber-700">
                      QRH Mode: Sequential Completion Required
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  {pages[currentPage]?.map((item, index) => {
                    const sortedItems = [...checklist.items].sort((a, b) => a.itemOrder - b.itemOrder);
                    const itemIndex = sortedItems.findIndex(i => i.id === item.id);
                    const isLocked = checklist.enforceLinearProgression && 
                      !checkedItems.has(item.id) && 
                      itemIndex > 0 && 
                      !checkedItems.has(sortedItems[itemIndex - 1]?.id);
                    
                    return (
                      <button 
                        key={item.id}
                        onClick={() => handleItemCheck(item.id)}
                        className={`w-full text-left group cursor-pointer transition-all duration-200 rounded-lg border-2 p-4 ${
                          checkedItems.has(item.id) 
                            ? 'bg-green-50 border-green-300 shadow-sm' 
                            : isLocked
                              ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
                              : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md'
                        }`}
                        data-testid={`checklist-item-${item.id}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            checkedItems.has(item.id) 
                              ? 'bg-black border-black' 
                              : isLocked 
                                ? 'border-gray-400 bg-gray-200'
                                : 'border-black bg-white group-hover:bg-gray-100'
                          }`}>
                            {checkedItems.has(item.id) ? (
                              <CheckCircle className="w-4 h-4 text-white" />
                            ) : isLocked ? (
                              <Lock className="w-3 h-3 text-gray-500" />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center leader-line">
                              <span className={`font-black uppercase text-base tracking-tight ${
                                checkedItems.has(item.id) 
                                  ? 'line-through text-gray-400' 
                                  : isLocked 
                                    ? 'text-gray-400'
                                    : 'text-black'
                              }`}>
                                <span className="mr-3 text-xl">—</span>
                                {cleanItemText(item.itemText)}
                              </span>
                              <span className={`font-black text-lg ml-auto whitespace-nowrap pl-4 ${
                                checkedItems.has(item.id) 
                                  ? 'text-green-600' 
                                  : isLocked 
                                    ? 'text-gray-400'
                                    : 'text-black'
                              }`}>
                                {getStatusValue(item.itemText)}
                              </span>
                            </div>
                            {/* Item Word Descriptor */}
                            <p className={`mt-2 ml-8 text-[11px] leading-tight font-medium italic max-w-[85%] uppercase tracking-tight ${
                              checkedItems.has(item.id) || isLocked ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {getItemDescription(item.itemText)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer / Notes area */}
                {currentPage === pages.length - 1 && checklist.description && (
                  <div className="mt-16 p-6 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg">
                    <span className="font-black uppercase block mb-2 text-sm tracking-widest text-black">PROCEDURE NOTES:</span>
                    <p className="italic text-xs text-gray-600 leading-relaxed font-medium">
                      {checklist.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Bar (Bottom) - QRH Style */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gray-50 border-t-2 border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400">MISSION PROGRESS: {completionPercentage}%</span>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400">{completedItems}/{totalItems} ITEMS COMPLETED</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                  <div 
                    className="h-full bg-black transition-all duration-700 ease-out" 
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