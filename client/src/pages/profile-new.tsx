import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { User, BookOpen, Trophy, Calendar, Award, Clock, Target, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function ProfileNew() {
  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['profile-deployment'],
    queryFn: async () => {
      console.log("DEPLOYMENT: Fetching profile data");
      
      // Use absolute URL construction for deployment reliability
      const baseUrl = window.location.origin;
      const profileUrl = `${baseUrl}/api/profile`;
      console.log("DEPLOYMENT: Requesting URL:", profileUrl);
      
      const response = await fetch(profileUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log("DEPLOYMENT: Response status:", response.status);
      console.log("DEPLOYMENT: Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log("DEPLOYMENT: Error response:", errorText);
        console.log("DEPLOYMENT: Error response type:", typeof errorText);
        
        // Check if we got HTML instead of JSON
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html>')) {
          console.log("DEPLOYMENT: Received HTML instead of JSON - routing issue");
          throw new Error('Server returned HTML instead of JSON. This may be a routing configuration issue.');
        }
        
        throw new Error(`Profile fetch failed: ${response.status} - ${errorText}`);
      }
      
      const contentType = response.headers.get('content-type');
      console.log("DEPLOYMENT: Content-Type:", contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.log("DEPLOYMENT: Non-JSON response:", responseText);
        throw new Error('Server did not return JSON response');
      }
      
      const data = await response.json();
      console.log("DEPLOYMENT: Profile data received:", data);
      return data;
    },
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
              <span className="text-lg font-medium text-foreground">Loading profile...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-800 bg-red-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                Profile Loading Error
              </CardTitle>
              <CardDescription className="text-red-300">
                Unable to load profile data. This may be a deployment configuration issue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => refetch()} variant="outline" className="mr-2">
                Try Again
              </Button>
              <p className="text-sm text-red-300 mt-2">
                Error: {error.message}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile || !profile.user) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Profile Unavailable</CardTitle>
              <CardDescription>
                Profile data could not be loaded. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => refetch()}>Refresh</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { user, submissions, trainingModules, stats } = profile;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Loadmaster Profile</h1>
          <p className="text-muted-foreground">Professional training and performance overview</p>
        </div>

        {/* User Info Card */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <User className="h-5 w-5 text-orange-500" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-lg font-semibold text-card-foreground">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg text-card-foreground">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                  {user.role}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Squadron</p>
                <p className="text-lg text-card-foreground">{user.squadron}</p>
              </div>
            </div>
            
            {user.licenseExpiry && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground">License Expiry</p>
                <p className="text-lg text-card-foreground">{format(new Date(user.licenseExpiry), 'PPP')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                  <p className="text-2xl font-bold text-card-foreground">{stats.totalSubmissions}</p>
                </div>
                <Trophy className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                  <p className="text-2xl font-bold text-card-foreground">{stats.overallPassRate}%</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Passed</p>
                  <p className="text-2xl font-bold text-green-400">{stats.passedSubmissions}</p>
                </div>
                <Award className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold text-card-foreground">{stats.averageScore || 0}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Training Modules */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <BookOpen className="h-5 w-5 text-orange-500" />
              Training Modules
            </CardTitle>
            <CardDescription>
              Master aircraft-specific load planning and cargo operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainingModules.map((module: any) => (
                <Card key={module.id} className="border-border bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-card-foreground">{module.title}</h3>
                      <Badge variant="outline" className="border-orange-500/30 text-orange-300">
                        {module.aircraftType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Progress</span>
                        <span>{module.progress}%</span>
                      </div>
                      <Progress value={module.progress} className="h-2" />
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full mt-3 bg-orange-600 hover:bg-orange-700"
                      variant={module.completed ? "secondary" : "default"}
                    >
                      {module.completed ? "Completed" : "Start Training"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        {submissions && submissions.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Clock className="h-5 w-5 text-orange-500" />
                Recent Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {submissions.slice(0, 5).map((submission: any, index: number) => (
                  <div key={submission.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <div>
                      <p className="font-medium text-card-foreground">Scenario {submission.scenarioId}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(submission.submissionDate), 'PPp')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={submission.passed ? "secondary" : "destructive"} 
                             className={submission.passed ? "bg-green-500/20 text-green-300 border-green-500/30" : ""}>
                        {submission.passed ? "Passed" : "Failed"}
                      </Badge>
                      {submission.score && (
                        <p className="text-sm text-muted-foreground mt-1">{submission.score}%</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}