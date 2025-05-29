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
      const response = await fetch('/api/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log("DEPLOYMENT: Response status:", response.status);
      console.log("DEPLOYMENT: Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log("DEPLOYMENT: Error response:", errorText);
        throw new Error(`Profile fetch failed: ${response.status}`);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg font-medium">Loading profile...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                Profile Loading Error
              </CardTitle>
              <CardDescription className="text-red-600">
                Unable to load profile data. This may be a deployment configuration issue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => refetch()} variant="outline" className="mr-2">
                Try Again
              </Button>
              <p className="text-sm text-red-600 mt-2">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Profile Unavailable</CardTitle>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Loadmaster Profile</h1>
          <p className="text-slate-600">Professional training and performance overview</p>
        </div>

        {/* User Info Card */}
        <Card className="border-blue-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Name</p>
                <p className="text-lg font-semibold">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Email</p>
                <p className="text-lg">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Role</p>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {user.role}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Squadron</p>
                <p className="text-lg">{user.squadron}</p>
              </div>
            </div>
            
            {user.licenseExpiry && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-slate-500">License Expiry</p>
                <p className="text-lg">{format(new Date(user.licenseExpiry), 'PPP')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Submissions</p>
                  <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                </div>
                <Trophy className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Pass Rate</p>
                  <p className="text-2xl font-bold">{stats.overallPassRate}%</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Passed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.passedSubmissions}</p>
                </div>
                <Award className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Average Score</p>
                  <p className="text-2xl font-bold">{stats.averageScore || 0}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Training Modules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Training Modules
            </CardTitle>
            <CardDescription>
              Master aircraft-specific load planning and cargo operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainingModules.map((module) => (
                <Card key={module.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{module.title}</h3>
                      <Badge variant="outline">{module.aircraftType}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{module.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{module.progress}%</span>
                      </div>
                      <Progress value={module.progress} className="h-2" />
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full mt-3"
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Recent Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {submissions.slice(0, 5).map((submission, index) => (
                  <div key={submission.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">Scenario {submission.scenarioId}</p>
                      <p className="text-sm text-slate-500">
                        {format(new Date(submission.submissionDate), 'PPp')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={submission.passed ? "secondary" : "destructive"}>
                        {submission.passed ? "Passed" : "Failed"}
                      </Badge>
                      {submission.score && (
                        <p className="text-sm text-slate-500 mt-1">{submission.score}%</p>
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