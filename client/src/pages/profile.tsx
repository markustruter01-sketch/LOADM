import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, Award, Target, Key, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { format } from "date-fns";

interface ProfileData {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    squadron?: string;
    serviceBranch?: string;
    licenseExpiry?: string;
  };
  submissions: Array<{
    id: number;
    type: 'scenario' | 'quiz' | 'assessment';
    title: string;
    submissionDate: string;
    passed: boolean | null;
    score: number;
    instructorFeedback?: string;
  }>;
  trainingModules: Array<{
    id: number;
    title: string;
    aircraftType: string;
    completed: boolean;
    completionDate?: string;
    progress: number;
  }>;
  stats: {
    totalSubmissions: number;
    passedSubmissions: number;
    overallPassRate: number;
    currentStreak: number;
    longestStreak: number;
  };
}

export default function Profile() {
  const { user } = useSimpleAuth();

  const { data: profileData, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Unable to load profile data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getServiceBranchColor = (branch: string) => {
    switch (branch?.toLowerCase()) {
      case 'air force': return 'bg-blue-500';
      case 'army': return 'bg-green-500';
      case 'navy': return 'bg-blue-700';
      default: return 'bg-gray-500';
    }
  };

  const getPassFailIcon = (passed: boolean | null) => {
    if (passed === null) return <Clock className="w-4 h-4 text-yellow-500" />;
    return passed ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <div className="flex items-center space-x-6">
        <div className={`w-20 h-20 rounded-full ${getServiceBranchColor(profileData.user.serviceBranch || '')} flex items-center justify-center text-white text-2xl font-bold`}>
          {profileData.user.firstName[0]}{profileData.user.lastName?.[0]}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {profileData.user.firstName} {profileData.user.lastName}
          </h1>
          <p className="text-lg text-gray-600">{profileData.user.email}</p>
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{profileData.user.role}</span>
            </Badge>
            {profileData.user.squadron && (
              <Badge variant="outline">Squadron: {profileData.user.squadron}</Badge>
            )}
            {profileData.user.serviceBranch && (
              <Badge className={getServiceBranchColor(profileData.user.serviceBranch)}>
                {profileData.user.serviceBranch}
              </Badge>
            )}
          </div>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center space-x-2"
          onClick={() => window.location.href = '/first-time-password'}
        >
          <Key className="w-4 h-4" />
          <span>Reset Password</span>
        </Button>
      </div>

      <Separator />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {profileData.stats.overallPassRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {profileData.stats.passedSubmissions}/{profileData.stats.totalSubmissions} passed
            </p>
            <Progress value={profileData.stats.overallPassRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {profileData.stats.currentStreak}
            </div>
            <p className="text-xs text-muted-foreground">
              consecutive weeks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {profileData.stats.longestStreak}
            </div>
            <p className="text-xs text-muted-foreground">
              weeks record
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">License Status</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-green-600">Active</div>
            {profileData.user.licenseExpiry && (
              <p className="text-xs text-muted-foreground">
                Expires {format(new Date(profileData.user.licenseExpiry), 'MMM dd, yyyy')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Training Modules Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Training Module Completion</span>
          </CardTitle>
          <CardDescription>Your progress across different aircraft training modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileData.trainingModules.map((module) => (
              <div key={module.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{module.title}</span>
                  <Badge variant={module.completed ? "default" : "secondary"}>
                    {module.aircraftType}
                  </Badge>
                </div>
                <Progress value={module.progress} />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{module.progress}% complete</span>
                  {module.completed && module.completionDate && (
                    <span>Completed {format(new Date(module.completionDate), 'MMM dd, yyyy')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submission History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Assessment History</span>
          </CardTitle>
          <CardDescription>Complete history of your scenarios, assessments, and quizzes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profileData.submissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      {getPassFailIcon(submission.passed)}
                      <Badge variant="outline" className="text-xs">
                        {submission.type}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">
                      {submission.score}%
                    </span>
                  </div>
                  <h4 className="font-medium text-sm mb-2 line-clamp-2">
                    {submission.title}
                  </h4>
                  <p className="text-xs text-gray-500 mb-2">
                    {format(new Date(submission.submissionDate), 'MMM dd, yyyy')}
                  </p>
                  {submission.instructorFeedback && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      "{submission.instructorFeedback}"
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {profileData.submissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No submissions yet. Start training to see your progress here!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}