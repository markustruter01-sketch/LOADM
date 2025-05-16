import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Scenario, ScenarioQuestion } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, ClipboardList, Edit, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function ScenarioManagement() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all scenarios
  const { data: scenarios, isLoading } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
    refetchInterval: 2000, // Refetch every 2 seconds
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });

  // Delete scenario mutation
  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/scenarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      toast({
        title: "Scenario deleted",
        description: "The scenario has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setScenarioToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete scenario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle edit scenario
  const handleEditScenario = (scenario: Scenario) => {
    navigate(`/instructors-portal/scenarios/edit/${scenario.id}`);
  };

  // Handle delete scenario
  const handleDeleteScenario = (id: number) => {
    setScenarioToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const confirmDelete = () => {
    if (scenarioToDelete) {
      deleteScenarioMutation.mutate(scenarioToDelete);
    }
  };

  // Filter scenarios based on search term
  const filteredScenarios = scenarios?.filter(scenario => 
    scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Scenario Management - LOADMworkflow</title>
        <meta name="description" content="Manage training scenarios for LOADMworkflow - create, edit, and delete scenarios." />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/instructors-portal">
              <Button variant="ghost" className="text-primary hover:text-primary/80 mr-4 p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h2 className="text-2xl font-bold text-foreground">Scenario Management</h2>
          </div>
          <Link href="/instructors-portal/scenarios/create">
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Create Scenario
            </Button>
          </Link>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Training Scenarios</CardTitle>
            <CardDescription>
              Manage all training scenarios for loadmaster training and assessment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search input */}
            <div className="flex items-center mb-4 relative">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scenarios..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[350px]">Title</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScenarios && filteredScenarios.length > 0 ? (
                      filteredScenarios.map((scenario) => (
                        <TableRow key={scenario.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{scenario.title}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                                {scenario.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {scenario.numberOfQuestions} questions
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditScenario(scenario)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                onClick={() => handleDeleteScenario(scenario.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center">
                            <ClipboardList className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">
                              {searchTerm ? "No scenarios match your search" : "No scenarios found"}
                            </p>
                            <Link href="/instructors-portal/scenarios/create">
                              <Button className="mt-4 bg-primary hover:bg-primary/90 text-white">
                                Create First Scenario
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this scenario?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              scenario and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteScenarioMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}