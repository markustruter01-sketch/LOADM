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

export default function StudentProgress() {
  const [searchTerm, setSearchTerm] = useState("");
  const [scenarioFilter, setScenarioFilter] = useState<number | "all">("all");
  const [squadronFilter, setSquadronFilter] = useState<string>("all");
  
  // Fetch all scenario submissions
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery<ScenarioSubmission[]>({
    queryKey: ["/api/scenario-submissions"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });
  
  // Fetch all scenarios for filtering
  const { data: scenarios } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
  });
  
  // Apply filters to submissions
  let filteredSubmissions = submissions;
  
  if (submissions) {
    filteredSubmissions = submissions.filter(submission => {
      // Squadron filter
      if (squadronFilter !== "all") {
        if (submission.squadron !== squadronFilter) return false;
      }
      
      // Scenario filter
      if (scenarioFilter !== "all") {
        if ((submission.scenario_id || submission.scenarioId) !== scenarioFilter) return false;
      }
      
      // Search term filter (search in student name, ID, or email)
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const studentName = submission.studentName?.toLowerCase() || '';
        const studentId = submission.studentId?.toLowerCase() || '';
        const userId = submission.userId?.toString() || '';
        
        if (!studentName.includes(searchLower) && 
            !studentId.includes(searchLower) && 
            !userId.includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  // Log the raw data to help debugging
  // Process submissions data for display
  
  // Calculate statistics
  const totalSubmissions = submissions?.length || 0;
  const pendingReviews = submissions?.filter(sub => sub.status === "pending").length || 0;
  const completedReviews = submissions?.filter(sub => sub.status === "reviewed").length || 0;
  
  return (
    <>
      <Helmet>
        <title>Student Submissions - LOADMworkflow</title>
        <meta name="description" content="Manage and review student scenario submissions" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="flex items-center mb-6">
          <Link href="/instructors-portal">
            <Button variant="ghost" className="text-primary hover:text-primary/80 mr-4 p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-foreground">Student Submissions</h2>
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
        
        {/* Student Submissions Content */}
        <div className="space-y-6 mt-6">
            {/* Filters */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Filter Submissions</CardTitle>
                <CardDescription>Narrow down submissions by scenario or student</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="squadronFilter">Squadron</Label>
                  <Select
                    value={squadronFilter}
                    onValueChange={setSquadronFilter}
                  >
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
                ) : filteredSubmissions?.length === 0 ? (
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
                      {filteredSubmissions?.map((submission) => {
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
                                    {submission.first_name && submission.last_name 
                                      ? `${submission.first_name} ${submission.last_name}`
                                      : submission.studentName || submission.email || `User ${submission.userId || submission.user_id}`
                                    }
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {submission.email && `${submission.email} • `}
                                    ID: {submission.studentId || submission.userId || submission.user_id}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{submission.scenario_title || scenario?.title || `Scenario #${submission.scenario_id || submission.scenarioId}`}</TableCell>
                            <TableCell>
                              {submission.submission_date || submission.submissionDate ? (
                                format(new Date(submission.submission_date || submission.submissionDate), 'MMM d, yyyy')
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
                                  // Use the passed flag directly if available, otherwise calculate based on threshold
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
                              <Link href={`/instructors-portal/submissions/${submission.id}`}>
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
      </div>
    </>
  );
}