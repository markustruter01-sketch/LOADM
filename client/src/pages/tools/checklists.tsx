import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { ArrowLeft, CheckSquare, Clock, Filter, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePermissions } from "@/lib/permissions";
import { PermissionDialog } from "@/components/PermissionDialog";

interface ChecklistItem {
  id: number;
  itemText: string;
  itemOrder: number;
  isRequired: boolean;
  category?: string;
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
}

interface ChecklistCompletion {
  id: number;
  checklistId: number;
  completionStatus: "in_progress" | "completed";
  completedCount: number;
  totalItems: number;
  startedAt: string;
  completedAt?: string;
  checklist: {
    title: string;
    aircraftType: string;
    category: string;
  };
}

export default function ChecklistsPage() {
  const [, setLocation] = useLocation();
  const [aircraftFilter, setAircraftFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  // For now, assume canSubmit is true - user permissions will be checked server-side
  const canSubmit = true;

  const { data: checklists = [], isLoading: checklistsLoading } = useQuery({
    queryKey: ['/api/checklists'],
    enabled: true
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['/api/checklists/completions'],
    enabled: canSubmit
  });

  const handleBackClick = () => {
    setLocation("/tools");
  };

  const handleChecklistClick = (checklistId: number) => {
    if (!canSubmit) {
      setShowPermissionDialog(true);
      return;
    }
    setLocation(`/tools/checklists/${checklistId}`);
  };

  const getCompletionStatus = (checklistId: number) => {
    if (!canSubmit) return null;
    return (completions as ChecklistCompletion[]).find((c: ChecklistCompletion) => c.checklistId === checklistId);
  };

  const getAircraftIcon = (aircraftType: string) => {
    return <Plane className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'startup': return 'bg-green-100 text-green-800 border-green-200';
      case 'shutdown': return 'bg-red-100 text-red-800 border-red-200';
      case 'pre-flight': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'post-flight': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'emergency': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredChecklists = (checklists as Checklist[]).filter((checklist: Checklist) => {
    const aircraftMatch = aircraftFilter === "all" || checklist.aircraftType.toLowerCase() === aircraftFilter.toLowerCase();
    const categoryMatch = categoryFilter === "all" || checklist.category === categoryFilter;
    return aircraftMatch && categoryMatch;
  });

  const aircraftTypes = Array.from(new Set((checklists as Checklist[]).map((c: Checklist) => c.aircraftType)));
  const categories = Array.from(new Set((checklists as Checklist[]).map((c: Checklist) => c.category)));

  return (
    <>
      <Helmet>
        <title>Aircraft Checklists - LOADMworkflow</title>
        <meta name="description" content="Digital aircraft operational checklists with completion tracking" />
      </Helmet>

      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-200 hover:bg-gray-800" 
              onClick={handleBackClick}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tools
            </Button>
          </div>

          <div className="text-center mb-8">
            <CheckSquare className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Aircraft Checklists</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Complete digital checklists for various aircraft operations. Track your progress and ensure all procedures are followed correctly.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Select value={aircraftFilter} onValueChange={setAircraftFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-200">
                  <SelectValue placeholder="Filter by Aircraft" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Aircraft</SelectItem>
                  {aircraftTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-200">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {checklistsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChecklists.map((checklist: Checklist) => {
                const completion = getCompletionStatus(checklist.id);
                const isCompleted = completion?.completionStatus === "completed";
                const completionPercentage = completion ? Math.round((completion.completedCount / completion.totalItems) * 100) : 0;

                return (
                  <Card 
                    key={checklist.id}
                    className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer group"
                    onClick={() => handleChecklistClick(checklist.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          {getAircraftIcon(checklist.aircraftType)}
                          <Badge variant="outline" className="text-xs border-orange-400 text-orange-400">
                            {checklist.aircraftType}
                          </Badge>
                        </div>
                        {completion && (
                          <Badge 
                            className={`text-xs ${isCompleted 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }`}
                          >
                            {isCompleted ? 'Completed' : 'In Progress'}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg text-white group-hover:text-orange-400 transition-colors">
                        {checklist.title}
                      </CardTitle>
                      {checklist.description && (
                        <CardDescription className="text-gray-400 text-sm">
                          {checklist.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <Badge className={getCategoryColor(checklist.category)}>
                            {checklist.category.charAt(0).toUpperCase() + checklist.category.slice(1).replace('-', ' ')}
                          </Badge>
                          <span className="text-gray-400">
                            {checklist.items.length} items
                          </span>
                        </div>

                        {completion && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>Progress</span>
                              <span>{completionPercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  isCompleted ? 'bg-green-500' : 'bg-orange-500'
                                }`}
                                style={{ width: `${completionPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Created {new Date(checklist.createdAt).toLocaleDateString()}</span>
                          </div>
                          {completion?.completedAt && (
                            <span>Completed {new Date(completion.completedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredChecklists.length === 0 && !checklistsLoading && (
            <div className="text-center py-12">
              <CheckSquare className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Checklists Found</h3>
              <p className="text-gray-500">
                {aircraftFilter !== "all" || categoryFilter !== "all" 
                  ? "Try adjusting your filters to see more checklists."
                  : "No checklists have been created yet."}
              </p>
            </div>
          )}
        </div>
      </div>

      <PermissionDialog 
        isOpen={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        action="access checklists"
        feature="Checklist Access"
      />
    </>
  );
}