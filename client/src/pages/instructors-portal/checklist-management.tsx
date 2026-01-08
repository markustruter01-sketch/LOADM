import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Plus, Edit, Trash2, CheckSquare, Plane, Clock, Users, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const checklistSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  aircraftType: z.string().min(1, "Aircraft type is required"),
  category: z.string().min(1, "Category is required"),
  enforceLinearProgression: z.boolean().default(false),
  items: z.array(z.object({
    itemText: z.string().min(1, "Item text is required"),
    isRequired: z.boolean().default(true),
    category: z.string().optional(),
    itemOrder: z.number().optional()
  })).min(1, "At least one item is required")
});

type ChecklistFormData = z.infer<typeof checklistSchema>;

interface ChecklistItem {
  id: number;
  itemText: string;
  itemOrder: number;
  isRequired: boolean;
  category?: string;
}

interface ChecklistCompletion {
  id: number;
  completionStatus: string;
  completedAt?: string;
  user: { email: string };
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
  creator: { email: string };
  completions: ChecklistCompletion[];
}

export default function ChecklistManagement() {
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['/api/instructor/checklists']
  });

  const createForm = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      title: "",
      description: "",
      aircraftType: "",
      category: "",
      enforceLinearProgression: false,
      items: [{ itemText: "", isRequired: true, category: "" }]
    }
  });

  const editForm = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      title: "",
      description: "",
      aircraftType: "",
      category: "",
      enforceLinearProgression: false,
      items: []
    }
  });

  const { fields: createFields, append: appendCreate, remove: removeCreate } = useFieldArray({
    control: createForm.control,
    name: "items"
  });

  const { fields: editFields, append: appendEdit, remove: removeEdit } = useFieldArray({
    control: editForm.control,
    name: "items"
  });

  const createMutation = useMutation({
    mutationFn: (data: ChecklistFormData) => 
      apiRequest({
        url: '/api/checklists',
        method: 'POST',
        body: JSON.stringify(data)
      }) as Promise<any>,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checklist created successfully"
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/instructor/checklists'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create checklist",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; checklist: ChecklistFormData }) =>
      apiRequest({
        url: `/api/checklists/${data.id}`,
        method: 'PUT',
        body: JSON.stringify(data.checklist)
      }) as Promise<any>,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checklist updated successfully"
      });
      setIsEditDialogOpen(false);
      setEditingChecklist(null);
      queryClient.invalidateQueries({ queryKey: ['/api/instructor/checklists'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update checklist",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest({
        url: `/api/checklists/${id}`,
        method: 'DELETE'
      }) as Promise<any>,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checklist deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/instructor/checklists'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete checklist",
        variant: "destructive"
      });
    }
  });

  const handleCreate = (data: ChecklistFormData) => {
    // Add item order to items
    const itemsWithOrder = data.items.map((item, index) => ({
      ...item,
      itemOrder: index + 1
    }));
    createMutation.mutate({ ...data, items: itemsWithOrder });
  };

  const handleEdit = (checklist: Checklist) => {
    setEditingChecklist(checklist);
    editForm.reset({
      title: checklist.title,
      description: checklist.description || "",
      aircraftType: checklist.aircraftType,
      category: checklist.category,
      enforceLinearProgression: checklist.enforceLinearProgression || false,
      items: checklist.items.sort((a, b) => a.itemOrder - b.itemOrder).map(item => ({
        itemText: item.itemText,
        isRequired: item.isRequired,
        category: item.category || ""
      }))
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (data: ChecklistFormData) => {
    if (!editingChecklist) return;
    
    const itemsWithOrder = data.items.map((item, index) => ({
      ...item,
      itemOrder: index + 1
    }));
    
    updateMutation.mutate({
      id: editingChecklist.id,
      checklist: { ...data, items: itemsWithOrder }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this checklist? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'startup': return 'bg-green-100 text-green-800 border-green-200';
      case 'shutdown': return 'bg-red-100 text-red-800 border-red-200';
      case 'pre-flight': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'post-flight': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'emergency': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'systems': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderChecklistForm = (form: any, fields: any, append: any, remove: any, onSubmit: any, isLoading: boolean, title: string) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., C-17 Engine Startup" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="aircraftType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aircraft Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select aircraft" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="C-17">C-17 Globemaster III</SelectItem>
                    <SelectItem value="C-130">C-130 Hercules</SelectItem>
                    <SelectItem value="KC30A">KC30A</SelectItem>
                    <SelectItem value="C-27J">C-27J Spartan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="shutdown">Shutdown</SelectItem>
                    <SelectItem value="pre-flight">Pre-flight</SelectItem>
                    <SelectItem value="post-flight">Post-flight</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="systems">Systems</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Optional description of the checklist" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="enforceLinearProgression"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-amber-50 border-amber-200">
              <div className="space-y-0.5">
                <FormLabel className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  QRH Mode (Sequential Completion)
                </FormLabel>
                <FormDescription className="text-xs text-amber-700">
                  When enabled, users must complete checklist items in order. Items are locked until the previous item is completed.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Checklist Items</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ itemText: "", isRequired: true, category: "" })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {fields.map((field: any, index: number) => (
            <Card key={field.id} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium">Item {index + 1}</h5>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <FormField
                  control={form.control}
                  name={`items.${index}.itemText`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Text</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Battery power - ON" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.category`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Category (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Pre-start, Engine Start" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.isRequired`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Required Item</FormLabel>
                          <FormDescription>Must be completed to finish checklist</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isLoading} className="bg-orange-500 hover:bg-orange-600">
            {isLoading ? "Saving..." : title}
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <>
      <Helmet>
        <title>Checklist Management - Instructor Portal - LOADMworkflow</title>
      </Helmet>

      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Checklist Management</h1>
              <p className="text-muted-foreground">Create and manage aircraft operational checklists</p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Checklist
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Checklist</DialogTitle>
                  <DialogDescription>
                    Create a new operational checklist for students to complete
                  </DialogDescription>
                </DialogHeader>
                {renderChecklistForm(createForm, createFields, appendCreate, removeCreate, handleCreate, createMutation.isPending, "Create Checklist")}
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(checklists as Checklist[]).map((checklist: Checklist) => {
                const completedCompletions = checklist.completions.filter(c => c.completionStatus === "completed").length;
                const totalCompletions = checklist.completions.length;

                return (
                  <Card key={checklist.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <Plane className="h-4 w-4 text-orange-500" />
                          <Badge variant="outline" className="text-xs border-orange-400 text-orange-400">
                            {checklist.aircraftType}
                          </Badge>
                          <Badge className={getCategoryColor(checklist.category)}>
                            {checklist.category.charAt(0).toUpperCase() + checklist.category.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(checklist)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(checklist.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-lg">
                        {checklist.title}
                      </CardTitle>
                      {checklist.description && (
                        <CardDescription className="text-sm">
                          {checklist.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1">
                            <CheckSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{checklist.items.length} items</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{totalCompletions} attempts</span>
                          </div>
                        </div>

                        {totalCompletions > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Completion Rate</span>
                              <span>{Math.round((completedCompletions / totalCompletions) * 100)}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-green-500"
                                style={{ 
                                  width: `${totalCompletions > 0 ? (completedCompletions / totalCompletions) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Created {new Date(checklist.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {(checklists as Checklist[]).length === 0 && !isLoading && (
            <div className="text-center py-12">
              <CheckSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Checklists Created</h3>
              <p className="text-muted-foreground mb-6">
                Create your first checklist to get started with digital aircraft procedures.
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Create Your First Checklist
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Checklist</DialogTitle>
            <DialogDescription>
              Update checklist details and items
            </DialogDescription>
          </DialogHeader>
          {renderChecklistForm(editForm, editFields, appendEdit, removeEdit, handleUpdate, updateMutation.isPending, "Update Checklist")}
        </DialogContent>
      </Dialog>
    </>
  );
}