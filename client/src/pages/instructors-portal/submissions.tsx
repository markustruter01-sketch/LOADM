import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Scenario, ScenarioSubmission } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, FileText, Search, User } from "lucide-react";
import { format } from 'date-fns';

export default function ScenarioSubmissionsPage() {
  const [, setLocation] = useLocation();
  const [selectedSquadron, setSelectedSquadron] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date-desc");

  // Fetch all scenario submissions
  const { data: submissions = [], isLoading } = useQuery<ScenarioSubmission[]>({
    queryKey: ["/api/scenario-submissions"],
  });

  // Fetch all scenarios for reference
  const { data: scenarios = [] } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
  });

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Calculate statistics
  const totalSubmissions = submissions.length;
  const pendingSubmissions = submissions.filter(sub => !sub.status || sub.status === 'pending').length;
  const completedSubmissions = submissions.filter(sub => sub.status === 'pass' || sub.status === 'fail').length;

  // Apply filters and sorting
  const filteredSubmissions = submissions
    .filter(submission => {
      // Filter by squadron
      if (selectedSquadron !== "all") {
        return submission.squadron === selectedSquadron;
      }
      return true;
    })
    .filter(submission => {
      // Apply search query to scenario title or student name
      if (searchQuery.trim()) {
        const scenario = scenarios.find(s => s.id === submission.scenarioId);
        const lowerQuery = searchQuery.toLowerCase();
        return (
          scenario?.title.toLowerCase().includes(lowerQuery) ||
          submission.studentName?.toLowerCase().includes(lowerQuery)
        );
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by selected option
      switch (sortBy) {
        case "date-asc":
          return new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
        case "date-desc":
          return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
        case "name-asc":
          return (a.studentName || "").localeCompare(b.studentName || "");
        case "name-desc":
          return (b.studentName || "").localeCompare(a.studentName || "");
        default:
          return 0;
      }
    });

  const getScenarioTitle = (scenarioId: number) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    return scenario?.title || `Scenario #${scenarioId}`;
  };

  return (
    <InstructorLayout title="Scenario Submissions">
      <Helmet>
        <title>Scenario Submissions | LOADMworkflow</title>
        <meta name="description" content="Review and evaluate student scenario submissions" />
      </Helmet>

      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Total Submissions</p>
                  <p className="text-2xl font-bold">{totalSubmissions}</p>
                  <p className="text-xs text-muted-foreground">Student scenario submissions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-yellow-500" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Pending Review</p>
                  <p className="text-2xl font-bold">{pendingSubmissions}</p>
                  <p className="text-xs text-muted-foreground">Submissions awaiting feedback</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Completed Reviews</p>
                  <p className="text-2xl font-bold">{completedSubmissions}</p>
                  <p className="text-xs text-muted-foreground">Submissions with instructor feedback</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and sorting */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by scenario or student name"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-row gap-2">
            <Select
              value={selectedSquadron}
              onValueChange={setSelectedSquadron}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Squadron" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Squadrons</SelectItem>
                <SelectItem value="33 Squadron">33 Squadron</SelectItem>
                <SelectItem value="35 Squadron">35 Squadron</SelectItem>
                <SelectItem value="36 Squadron">36 Squadron</SelectItem>
                <SelectItem value="37 Squadron">37 Squadron</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest first)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest first)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submissions List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredSubmissions.length > 0 ? (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="overflow-hidden border-gray-800 hover:border-orange-500/50 transition-colors">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-4">
                      <div className="flex flex-col md:flex-row justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-orange-500" />
                          <h3 className="font-medium">{getScenarioTitle(submission.scenarioId)}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{submission.squadron || 'Unknown Squadron'}</Badge>
                          {submission.status && (
                            <Badge 
                              className={
                                submission.status === 'pass' 
                                  ? "bg-green-500/20 text-green-600 hover:bg-green-500/30" 
                                  : submission.status === 'fail'
                                  ? "bg-red-500/20 text-red-600 hover:bg-red-500/30"
                                  : "bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30"
                              }
                            >
                              {submission.status === 'pass' ? (
                                <span className="flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> Pass</span>
                              ) : submission.status === 'fail' ? (
                                <span className="flex items-center"><XCircle className="h-3 w-3 mr-1" /> Fail</span>
                              ) : (
                                'Pending'
                              )}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row justify-between text-sm text-muted-foreground mb-3">
                        <div>Submitted by: {submission.studentName || 'Unknown'}</div>
                        <div>{formatDate(submission.submissionDate)}</div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {submission.answers && submission.answers.length > 0 ? (
                          `${submission.answers.length} questions answered`
                        ) : (
                          'No response data available'
                        )}
                      </div>
                    </div>
                    
                    <div className="flex border-t md:border-t-0 md:border-l border-gray-800">
                      <Button 
                        variant="ghost" 
                        className="flex-1 rounded-none h-full py-6 px-4 text-sm gap-2 hover:bg-orange-500/10"
                        onClick={() => setLocation(`/instructors-portal/student-progress/${submission.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-card border border-gray-800 rounded-lg">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No submissions found</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {searchQuery || selectedSquadron !== "AMG" 
                ? "No submissions match your current filters. Try changing your search criteria."
                : "There are no scenario submissions in the system yet."}
            </p>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}