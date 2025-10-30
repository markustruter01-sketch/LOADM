import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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
import { ArrowLeft, FileText, Search, User, RefreshCw } from "lucide-react";
import { format } from 'date-fns';

export default function StudentProgress() {
  const [searchTerm, setSearchTerm] = useState("");
  const [scenarioFilter, setScenarioFilter] = useState<number | "all">("all");
  const [squadronFilter, setSquadronFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/scenario-submissions"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  // Fetch submissions and scenarios
  const { data: rawSubmissions, isLoading: isLoadingSubmissions } = useQuery<ScenarioSubmission[]>({
    queryKey: ["/api/scenario-submissions"],
    refetchInterval: 10000,
  });
  
  const { data: scenarios } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
  });
  
  // Process and sort submissions
  const processedSubmissions = (() => {
    if (!rawSubmissions) return [];
    
    // Step 1: Filter submissions
    let filtered = rawSubmissions.filter(submission => {
      // Squadron filter
      if (squadronFilter !== "all" && submission.squadron !== squadronFilter) {
        return false;
      }
      
      // Scenario filter
      if (scenarioFilter !== "all" && submission.scenarioId !== scenarioFilter) {
        return false;
      }
      
      // Search filter
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const name = (submission.studentName || '').toLowerCase();
        const id = (submission.studentId || '').toLowerCase();
        const userId = String(submission.userId || '');
        
        if (!name.includes(search) && !id.includes(search) && !userId.includes(search)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Step 2: Separate into pending and reviewed
    const pending = filtered.filter(s => s.status === 'pending' || s.status === 'submitted');
    const reviewed = filtered.filter(s => s.status === 'reviewed');
    
    // Step 3: Sort each group by date (newest first)
    const sortByDate = (a: ScenarioSubmission, b: ScenarioSubmission) => {
      const dateA = a.submissionDate ? new Date(a.submissionDate).getTime() : 0;
      const dateB = b.submissionDate ? new Date(b.submissionDate).getTime() : 0;
      return dateB - dateA;
    };
    
    pending.sort(sortByDate);
    reviewed.sort(sortByDate);
    
    // Step 4: Combine - pending first, then reviewed
    return [...pending, ...reviewed];
  })();
  
  // Calculate statistics
  const totalSubmissions = rawSubmissions?.length || 0;
  const pendingReviews = rawSubmissions?.filter(s => s.status === 'pending' || s.status === 'submitted').length || 0;
  const completedReviews = rawSubmissions?.filter(s => s.status === 'reviewed').length || 0;
  
  return (
    <>
      <Helmet>
        <title>Student Submissions - LOADMworkflow</title>
        <meta name="description" content="Manage and review student scenario submissions" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/instructors-portal">
              <Button variant="ghost" className="text-primary hover:text-primary/80 mr-4 p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h2 className="text-2xl font-bold text-foreground">Student Submissions</h2>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">Student scenario submissions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReviews}</div>
              <p className="text-xs text-muted-foreground">Submissions awaiting feedback</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedReviews}</div>
              <p className="text-xs text-muted-foreground">Submissions with instructor feedback</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter Submissions</CardTitle>
            <CardDescription>Narrow down submissions by scenario or student</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="squadronFilter">Squadron</Label>
              <Select value={squadronFilter} onValueChange={setSquadronFilter}>
                <SelectTrigger id="squadronFilter">
                  <SelectValue placeholder="Select squadron" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Squadrons</SelectItem>
                  <SelectItem value="AMG">AMG</SelectItem>
                  <SelectItem value="33SQN">33SQN</SelectItem>
                  <SelectItem value="35SQN">35SQN</SelectItem>
                  <SelectItem value="36SQN">36SQN</SelectItem>
                  <SelectItem value="37SQN">37SQN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenarioFilter">Scenario</Label>
              <Select
                value={scenarioFilter.toString()}
                onValueChange={(value) => setScenarioFilter(value === "all" ? "all" : parseInt(value))}
              >
                <SelectTrigger id="scenarioFilter">
                  <SelectValue placeholder="Select scenario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scenarios</SelectItem>
                  {scenarios?.map((scenario) => (
                    <SelectItem key={scenario.id} value={scenario.id.toString()}>
                      {scenario.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchStudent">Search Student</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="searchStudent"
                  placeholder="Search by name or ID..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Submissions</CardTitle>
            <CardDescription>View and manage scenario submissions from students</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSubmissions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : processedSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No submissions found matching your filters</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Scenario</TableHead>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedSubmissions.map((submission) => {
                    const scenario = scenarios?.find(s => s.id === submission.scenarioId);
                    return (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="bg-muted w-8 h-8 rounded-full flex items-center justify-center mr-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {submission.studentName || `User ${submission.userId}`}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: {submission.studentId || submission.userId}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{scenario?.title || `Scenario #${submission.scenarioId}`}</TableCell>
                        <TableCell>
                          {submission.submissionDate ? (
                            format(new Date(submission.submissionDate), 'MMM d, yyyy')
                          ) : 'Unknown date'}
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            submission.status === "reviewed" 
                              ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400" 
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400"
                          }`}>
                            {submission.status === "reviewed" ? "Reviewed" : "Pending Review"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {submission.score !== null && submission.score !== undefined
                            ? `${submission.score}%`
                            : "Not scored"}
                        </TableCell>
                        <TableCell>
                          {submission.status === "reviewed" && submission.score !== null && submission.score !== undefined ? (
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              (submission.passed === true || 
                               (submission.passed === undefined && submission.score >= (scenario?.passingThreshold || 70)))
                                ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400" 
                                : "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"
                            }`}>
                              {(submission.passed === true || 
                               (submission.passed === undefined && submission.score >= (scenario?.passingThreshold || 70)))
                                ? "Pass" : "Fail"}
                            </div>
                          ) : (
                            "Pending"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/instructors-portal/student-progress/${submission.id}`}>
                            <Button variant="outline" size="sm">
                              Review
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
