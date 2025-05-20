import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { 
  CheckCircle2, XCircle, Search, FileText, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import InstructorLayout from "../../components/InstructorLayout";
import { DocumentSubmission } from "@shared/schema";

export default function DocumentSubmissionsPage() {
  const [, setLocation] = useLocation();
  const [selectedSquadron, setSelectedSquadron] = useState<string>("AMG");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date-desc");

  // Fetch all document submissions
  const { data: submissions, isLoading } = useQuery<DocumentSubmission[]>({
    queryKey: ["/api/document-submissions"],
  });

  // Fetch all documents for reference
  const { data: documents } = useQuery({
    queryKey: ["/api/documents"],
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Apply filters and sorting
  const filteredSubmissions = submissions
    ? submissions
        .filter(submission => {
          // Filter by squadron
          if (selectedSquadron !== "AMG") {
            return submission.squadron === selectedSquadron;
          }
          return true;
        })
        .filter(submission => {
          // Apply search query to document title or student name
          if (searchQuery.trim()) {
            const document = documents?.find(d => d.id === submission.documentId);
            const lowerQuery = searchQuery.toLowerCase();
            return (
              document?.title.toLowerCase().includes(lowerQuery) ||
              submission.userName?.toLowerCase().includes(lowerQuery)
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
              return (a.userName || "").localeCompare(b.userName || "");
            case "name-desc":
              return (b.userName || "").localeCompare(a.userName || "");
            default:
              return 0;
          }
        })
    : [];

  const getDocumentTitle = (documentId: number) => {
    const document = documents?.find(d => d.id === documentId);
    return document?.title || `Document #${documentId}`;
  };

  return (
    <InstructorLayout title="Document Submissions">
      <Helmet>
        <title>Document Submissions | LOADMworkflow</title>
        <meta name="description" content="Review and evaluate student document submissions" />
      </Helmet>

      <div className="space-y-6">
        {/* Filters and sorting */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by document or student name"
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
                <SelectItem value="AMG">All Squadrons</SelectItem>
                <SelectItem value="33SQN">33SQN</SelectItem>
                <SelectItem value="35SQN">35SQN</SelectItem>
                <SelectItem value="36SQN">36SQN</SelectItem>
                <SelectItem value="37SQN">37SQN</SelectItem>
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
                          <h3 className="font-medium">{getDocumentTitle(submission.documentId)}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{submission.squadron || 'AMG'}</Badge>
                          {submission.status && (
                            <Badge 
                              className={
                                submission.status === 'approved' 
                                  ? "bg-green-500/20 text-green-600 hover:bg-green-500/30" 
                                  : submission.status === 'rejected'
                                  ? "bg-red-500/20 text-red-600 hover:bg-red-500/30"
                                  : "bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30"
                              }
                            >
                              {submission.status === 'approved' ? (
                                <span className="flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</span>
                              ) : submission.status === 'rejected' ? (
                                <span className="flex items-center"><XCircle className="h-3 w-3 mr-1" /> Rejected</span>
                              ) : (
                                'Pending'
                              )}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row justify-between text-sm text-muted-foreground mb-3">
                        <div>Submitted by: {submission.userName || 'Unknown'}</div>
                        <div>{formatDate(submission.submissionDate)}</div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {submission.answers && Object.keys(submission.answers).length > 0 ? (
                          `${Object.keys(submission.answers).length} fields completed`
                        ) : (
                          'No response data available'
                        )}
                      </div>
                    </div>
                    
                    <div className="flex border-t md:border-t-0 md:border-l border-gray-800">
                      <Button 
                        variant="ghost" 
                        className="flex-1 rounded-none h-full py-6 px-4 text-sm gap-2 hover:bg-orange-500/10"
                        onClick={() => setLocation(`/instructors-portal/document-review/${submission.id}`)}
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
                : "There are no document submissions in the system yet."}
            </p>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}