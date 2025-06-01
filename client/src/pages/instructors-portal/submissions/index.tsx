
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function ScenarioSubmissions() {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['/api/scenario-submissions']
  });

  if (isLoading) return <div className="p-6">Loading submissions...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Scenario Submissions</h1>
      
      <div className="space-y-4">
        {submissions?.map((submission: any) => (
          <Card key={submission.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{submission.scenarioTitle}</CardTitle>
                  <CardDescription>Submitted by {submission.studentName}</CardDescription>
                </div>
                <Badge variant={submission.passed ? 'default' : 'destructive'}>
                  {submission.score}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                </div>
                <Link href={"/instructors-portal/student-progress/" + submission.id}>
                  <Button variant="outline" size="sm">Review</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )) || (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No submissions found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
