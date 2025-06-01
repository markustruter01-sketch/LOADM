
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentSubmissions() {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['/api/document-submissions']
  });

  if (isLoading) return <div className="p-6">Loading document submissions...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Document Submissions</h1>
      
      <div className="space-y-4">
        {submissions?.map((submission: any) => (
          <Card key={submission.id}>
            <CardHeader>
              <CardTitle>{submission.documentTitle}</CardTitle>
              <CardDescription>Submitted by {submission.studentName}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )) || (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No document submissions found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
