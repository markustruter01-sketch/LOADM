import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Calendar, Shield, Mail, Key, Settings, Award, TrendingUp, Clock, Target, BookOpen, Users, AlertTriangle, CheckCircle, XCircle, Hourglass, Flame, Zap, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useIsolatedAuth } from "../auth-isolated/auth-context";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function UserProfile() {
  const { user, logout } = useIsolatedAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // State for submission detail popup - moved to top to fix hooks order
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showSubmissionDetail, setShowSubmissionDetail] = useState(false);

  // Fetch user profile data including submissions and progress
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['/api/profile'],
    enabled: !!user
  });

  // Fetch user's current squadron
  const { data: userSquadron } = useQuery({
    queryKey: ['/api/user/squadron'],
    enabled: !!user
  });

  // Fetch user activity history (including training submissions)
  const { data: activityHistory, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/user/activity-history'],
    enabled: !!user
  });

  // Squadron update mutation
  const updateSquadronMutation = useMutation({
    mutationFn: async (squadron: string) => {
      console.log('🔄 FRONTEND: Squadron update triggered for:', squadron);
      const result = await apiRequest({
        url: '/api/user/squadron',
        method: 'PUT',
        body: { squadron }
      });
      console.log('✅ FRONTEND: Squadron update result:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Squadron Updated",
        description: "Your squadron assignment has been successfully updated."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/squadron'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update squadron assignment. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Category update mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (category: string) => {
      console.log('🔄 FRONTEND: Category update triggered for:', category);
      const result = await apiRequest({
        url: '/api/user/category',
        method: 'PUT',
        body: { category }
      });
      console.log('✅ FRONTEND: Category update result:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Category Updated",
        description: "Your seniority category has been successfully updated."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update category. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for changing password
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      console.log('🔐 FRONTEND: Starting password change request');
      console.log('🔐 FRONTEND: Data:', { currentPasswordLength: data.currentPassword.length, newPasswordLength: data.newPassword.length });
      
      try {
        const response = await fetch('/api/auth/change-password', {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        console.log('🔐 FRONTEND: Response status:', response.status);
        console.log('🔐 FRONTEND: Response ok:', response.ok);

        const responseText = await response.text();
        console.log('🔐 FRONTEND: Response text:', responseText);

        if (!response.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { error: responseText };
          }
          throw new Error(errorData.error || `HTTP ${response.status}: ${responseText}`);
        }

        let result;
        try {
          result = JSON.parse(responseText);
        } catch {
          result = { message: responseText };
        }

        console.log('🔐 FRONTEND: Password change successful:', result);
        return result;
      } catch (error) {
        console.error('🔐 FRONTEND: Password change error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('🔐 FRONTEND: Password change mutation success:', data);
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully."
      });
      setShowPasswordDialog(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      console.error('🔐 FRONTEND: Password change mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-600 text-white';
      case 'instructor':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-green-600 text-white';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Super Administrator';
      case 'instructor':
        return 'Instructor';
      case 'loadmaster':
        return 'Loadmaster';
      default:
        return 'User';
    }
  };

  // Handle loading and authentication states without early returns
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading profile data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data from profileData or use defaults
  const userInfo = (profileData as any)?.user || user;
  const stats = (profileData as any)?.stats || { 
    totalSubmissions: 0, 
    passedSubmissions: 0, 
    failedSubmissions: 0, 
    pendingGrading: 0, 
    overallPassRate: 0, 
    currentStreak: 0, 
    longestStreak: 0, 
    weeksSinceLastActivity: 0 
  };
  const submissions = (profileData as any)?.submissions || [];
  
  // Process and categorize activity history data
  const processedActivityData = activityHistory && Array.isArray(activityHistory) ? activityHistory.map((item: any) => ({
    ...item,
    date: item.date ? new Date(item.date).toLocaleDateString() : 'Invalid Date',
    title: item.title || 'Untitled Activity'
  })) : [];

  // Categorize submissions by type
  const submissionsByType = {
    scenarios: processedActivityData.filter((item: any) => item.type === 'scenario'),
    quizzes: processedActivityData.filter((item: any) => item.type === 'quiz'),
    assessments: processedActivityData.filter((item: any) => item.type === 'scenario' && item.status === 'reviewed')
  };

  const trainingModules = (profileData as any)?.trainingModules || [];
  const gamification = (profileData as any)?.gamification || { 
    weeklyGoal: 1, 
    streakData: { current: 0, longest: 0, weeksSinceLastActivity: 0, streakAtRisk: false },
    thisWeekActivity: 0,
    achievements: {}
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your account information and track your progress</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Weekly Goal & Streak Status */}
      {gamification.streakData.streakAtRisk && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Streak at Risk!</p>
                <p className="text-sm text-orange-600">
                  Complete at least one activity this week to maintain your {stats.currentStreak}-week streak.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">Squadron Assignment</p>
                <Select 
                  value={(userSquadron as any)?.squadron || ""} 
                  onValueChange={(value) => updateSquadronMutation.mutate(value)}
                  disabled={updateSquadronMutation.isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select squadron..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="33SQN">33 Squadron</SelectItem>
                    <SelectItem value="35SQN">35 Squadron</SelectItem>
                    <SelectItem value="36SQN">36 Squadron</SelectItem>
                    <SelectItem value="37SQN">37 Squadron</SelectItem>
                    <SelectItem value="AMG">AMG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Users className="w-8 h-8 text-blue-600 ml-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">Category</p>
                <Select 
                  value={userInfo.category || "D"} 
                  onValueChange={(value) => updateCategoryMutation.mutate(value)}
                  disabled={updateCategoryMutation.isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D">D Category</SelectItem>
                    <SelectItem value="C">C Category</SelectItem>
                    <SelectItem value="B">B Category</SelectItem>
                    <SelectItem value="A">A Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Award className="w-8 h-8 text-purple-600 ml-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">{stats.overallPassRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <div className="flex items-center space-x-1">
                  <p className="text-2xl font-bold">{gamification.thisWeekActivity}</p>
                  <span className="text-sm text-muted-foreground">/{gamification.weeklyGoal}</span>
                </div>
              </div>
              <Zap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Account Info & Training Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Account Information</span>
              </CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Email:</span>
                  </div>
                  <span className="text-sm">{userInfo.email}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Role:</span>
                  </div>
                  <Badge className={getRoleBadgeColor(userInfo.role || user?.role || 'student')}>
                    {getRoleDisplayName(userInfo.role || user?.role || 'student')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">User ID:</span>
                  </div>
                  <span className="text-sm font-mono">{userInfo.id}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Squadron:</span>
                  </div>
                  <span className="text-sm">{userInfo.squadron || 'AMG'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Service:</span>
                  </div>
                  <span className="text-sm">{userInfo.serviceBranch || 'Air Force'}</span>
                </div>

                {userInfo.licenseExpiry && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">License Expires:</span>
                    </div>
                    <span className="text-sm">
                      {new Date(userInfo.licenseExpiry).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Training Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Training Progress</span>
              </CardTitle>
              <CardDescription>Your progress across different aircraft types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {trainingModules.map((module: any) => (
                <div key={module.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{module.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {module.aircraftType}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{module.progress}%</span>
                      {module.completed && (
                        <Award className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                  <Progress value={module.progress} className="h-2" />
                  {module.completionDate && (
                    <p className="text-xs text-muted-foreground">
                      Completed: {new Date(module.completionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Detailed Activity History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Activity History</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{stats.passedSubmissions} Passed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>{stats.failedSubmissions} Failed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Hourglass className="w-4 h-4 text-yellow-600" />
                    <span>{stats.pendingGrading} Pending</span>
                  </div>
                </div>
              </CardTitle>
              <CardDescription>Your complete submission history across all activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All ({submissions.length})</TabsTrigger>
                  <TabsTrigger value="scenarios">Scenarios ({submissionsByType.scenarios.length})</TabsTrigger>
                  <TabsTrigger value="quizzes">Quizzes ({submissionsByType.quizzes.length})</TabsTrigger>
                  <TabsTrigger value="assessments">Assessments ({submissionsByType.assessments.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4 mt-4">
                  {activityLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="mt-2 text-muted-foreground">Loading activity history...</p>
                    </div>
                  ) : (
                    <>
                      {/* Display recent activity from processed data */}
                      {processedActivityData && processedActivityData.length > 0 ? (
                        processedActivityData.slice(0, 5).map((activity: any) => (
                          <div 
                            key={`activity-${activity.id}`} 
                            className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              setSelectedSubmission(activity);
                              setShowSubmissionDetail(true);
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                activity.passed === true ? 'bg-green-500' : 
                                activity.passed === false ? 'bg-red-500' : 
                                activity.type === 'quiz' ? 'bg-blue-500' : 'bg-yellow-500'
                              }`} />
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-medium">{activity.title}</p>
                                  <Badge variant="outline" className={`text-xs ${
                                    activity.type === 'quiz' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-green-50 text-green-700 border-green-200'
                                  }`}>
                                    {activity.type === 'quiz' ? 'Quiz' : 'Scenario'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {activity.date}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {activity.score && (
                                <span className="text-sm font-medium">{activity.score}%</span>
                              )}
                              <Badge variant={
                                activity.passed === true ? 'default' : 
                                activity.passed === false ? 'destructive' : 'secondary'
                              }>
                                {activity.status === 'completed' ? 'Completed' :
                                 activity.passed === true ? 'Pass' : 
                                 activity.passed === false ? 'Fail' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : null}
                      
                      {/* Display assessment submissions */}
                      {submissions.slice(0, 3).map((submission: any) => (
                        <div key={`submission-${submission.id}`} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              submission.passed === true ? 'bg-green-500' : 
                              submission.passed === false ? 'bg-red-500' : 'bg-gray-400'
                            }`} />
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium">{submission.title}</p>
                                <Badge variant="outline" className="text-xs">
                                  Assessment
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(submission.submissionDate).toLocaleDateString()} at {new Date(submission.submissionDate).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {submission.score > 0 && (
                              <span className="text-sm font-medium">{submission.score}%</span>
                            )}
                            <Badge variant={
                              submission.passed === true ? 'default' : 
                              submission.passed === false ? 'destructive' : 'secondary'
                            }>
                              {submission.passed === true ? 'Pass' : 
                               submission.passed === false ? 'Fail' : 'Pending Review'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      
                      {(!processedActivityData || processedActivityData.length === 0) && (!submissions || submissions.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No submissions yet. Start training to see your progress here!
                        </p>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="scenarios" className="space-y-4 mt-4">
                  {submissionsByType.scenarios.slice(0, 10).map((submission: any) => (
                    <div 
                      key={submission.id} 
                      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setShowSubmissionDetail(true);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          submission.passed === true ? 'bg-green-500' : 
                          submission.passed === false ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{submission.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {submission.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {submission.score && (
                          <span className="text-sm font-medium">{submission.score}%</span>
                        )}
                        <Badge variant={
                          submission.passed === true ? 'default' : 
                          submission.passed === false ? 'destructive' : 'secondary'
                        }>
                          {submission.passed === true ? 'Pass' : 
                           submission.passed === false ? 'Fail' : 'Pending Review'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {submissionsByType.scenarios.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No scenario submissions yet. Try the load planning scenarios!
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="quizzes" className="space-y-4 mt-4">
                  {submissionsByType.quizzes.slice(0, 10).map((submission: any) => (
                    <div 
                      key={submission.id} 
                      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setShowSubmissionDetail(true);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          submission.passed === true ? 'bg-green-500' : 
                          submission.passed === false ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{submission.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {submission.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {submission.score && (
                          <span className="text-sm font-medium">{submission.score}%</span>
                        )}
                        <Badge variant={
                          submission.passed === true ? 'default' : 
                          submission.passed === false ? 'destructive' : 'secondary'
                        }>
                          {submission.passed === true ? 'Pass' : 
                           submission.passed === false ? 'Fail' : 'Pending Review'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {submissionsByType.quizzes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No quiz submissions yet. Complete your weekly quiz to maintain your streak!
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="assessments" className="space-y-4 mt-4">
                  {submissionsByType.assessments.slice(0, 10).map((submission: any) => (
                    <div 
                      key={submission.id} 
                      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setShowSubmissionDetail(true);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          submission.passed === true ? 'bg-green-500' : 
                          submission.passed === false ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{submission.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {submission.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {submission.score && (
                          <span className="text-sm font-medium">{submission.score}%</span>
                        )}
                        <Badge variant={
                          submission.passed === true ? 'default' : 
                          submission.passed === false ? 'destructive' : 'secondary'
                        }>
                          {submission.passed === true ? 'Pass' : 
                           submission.passed === false ? 'Fail' : 'Pending Review'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {submissionsByType.assessments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No assessment submissions yet. Try the document-based assessments!
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Role Info */}
        <div className="space-y-6">
          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Account Actions</span>
              </CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowPasswordDialog(true)}
              >
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  if (confirm('Are you sure you want to log out?')) {
                    logout();
                  }
                }}
              >
                <User className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </CardContent>
          </Card>

          {/* Role-specific Information */}
          {(userInfo.role || user?.role) === 'superadmin' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">Super Administrator Access</CardTitle>
                <CardDescription>You have full administrative privileges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800">
                    As a Super Administrator, you have access to all system features including:
                  </p>
                  <ul className="list-disc list-inside text-sm text-purple-700 mt-2 space-y-1">
                    <li>License Management</li>
                    <li>User Permission Management</li>
                    <li>System Administration</li>
                    <li>Full Application Access</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {(userInfo.role || user.role) === 'instructor' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Instructor Access</CardTitle>
                <CardDescription>You have instructor-level privileges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    As an Instructor, you have access to:
                  </p>
                  <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                    <li>Student Progress Monitoring</li>
                    <li>Scenario Management</li>
                    <li>Quiz Creation and Management</li>
                    <li>Teaching Resources</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements & Gamification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Achievements</span>
              </CardTitle>
              <CardDescription>Your training milestones and progress rewards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Weekly Goal Progress */}
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Weekly Goal</span>
                  </div>
                  <span className="text-xs text-blue-600">
                    {gamification.thisWeekActivity}/{gamification.weeklyGoal}
                  </span>
                </div>
                <Progress 
                  value={(gamification.thisWeekActivity / gamification.weeklyGoal) * 100} 
                  className="h-2" 
                />
                <p className="text-xs text-blue-600 mt-1">
                  {gamification.thisWeekActivity >= gamification.weeklyGoal 
                    ? "Goal completed this week! 🎉" 
                    : `${gamification.weeklyGoal - gamification.thisWeekActivity} more activity needed this week`}
                </p>
              </div>

              {/* Earned Achievements */}
              {gamification.achievements.firstSubmission && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50 border border-green-200">
                  <Award className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">First Steps</p>
                    <p className="text-xs text-green-600">Completed your first submission</p>
                  </div>
                </div>
              )}

              {gamification.achievements.quickLearner && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                  <Award className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Quick Learner</p>
                    <p className="text-xs text-yellow-600">Completed 10+ submissions</p>
                  </div>
                </div>
              )}

              {gamification.achievements.perfectionist && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-purple-50 border border-purple-200">
                  <Award className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">Perfectionist</p>
                    <p className="text-xs text-purple-600">95%+ pass rate with 5+ submissions</p>
                  </div>
                </div>
              )}

              {gamification.achievements.weeklyWarrior && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-orange-50 border border-orange-200">
                  <Flame className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Weekly Warrior</p>
                    <p className="text-xs text-orange-600">4+ week streak maintained</p>
                  </div>
                </div>
              )}

              {gamification.achievements.monthlyMaster && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-red-50 border border-red-200">
                  <Flame className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Monthly Master</p>
                    <p className="text-xs text-red-600">12+ week streak achieved!</p>
                  </div>
                </div>
              )}

              {gamification.achievements.consistent && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-indigo-50 border border-indigo-200">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-indigo-800">Consistency Champion</p>
                    <p className="text-xs text-indigo-600">8+ week longest streak</p>
                  </div>
                </div>
              )}

              {gamification.achievements.diverseLearner && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-teal-50 border border-teal-200">
                  <Award className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="text-sm font-medium text-teal-800">Multi-Aircraft Expert</p>
                    <p className="text-xs text-teal-600">Completed 3+ aircraft types</p>
                  </div>
                </div>
              )}

              {!Object.values(gamification.achievements).some(Boolean) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Complete activities to unlock achievements! Start with a quiz or scenario to earn your first badge.
                </p>
              )}

              {/* Streak Information */}
              {stats.currentStreak > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-gray-50 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Current Streak</span>
                    </div>
                    <span className="text-sm font-bold">{stats.currentStreak} weeks</span>
                  </div>
                  {gamification.streakData.streakAtRisk && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Complete an activity this week to keep your streak alive!
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({...prev, currentPassword: e.target.value}))}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm New Password</label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex space-x-2 pt-4">
              <Button
                onClick={handlePasswordChange}
                disabled={changePasswordMutation.isPending}
                className="flex-1"
              >
                {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submission Detail Popup */}
      <Dialog open={showSubmissionDetail} onOpenChange={setShowSubmissionDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-lg">{selectedSubmission.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Submitted on {selectedSubmission.date}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-2 mb-2">
                    {selectedSubmission.score && (
                      <span className="text-2xl font-bold">{selectedSubmission.score}%</span>
                    )}
                    <Badge variant={
                      selectedSubmission.passed === true ? 'default' : 
                      selectedSubmission.passed === false ? 'destructive' : 'secondary'
                    }>
                      {selectedSubmission.passed === true ? 'PASS' : 
                       selectedSubmission.passed === false ? 'FAIL' : 'PENDING'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Type: {selectedSubmission.type === 'quiz' ? 'Quiz' : 'Scenario'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Performance Summary */}
              {selectedSubmission.score && (
                <div className="space-y-4">
                  <h4 className="font-medium">Performance Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round((selectedSubmission.score / 100) * 10)}
                        </div>
                        <p className="text-xs text-muted-foreground">Questions Correct</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {10 - Math.round((selectedSubmission.score / 100) * 10)}
                        </div>
                        <p className="text-xs text-muted-foreground">Questions Incorrect</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className={`text-2xl font-bold ${
                          selectedSubmission.passed ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedSubmission.passed ? '✓' : '✗'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedSubmission.passed ? 'Passed' : 'Failed'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Instructor Feedback Section */}
              <div className="space-y-4">
                <h4 className="font-medium">Instructor Feedback</h4>
                {selectedSubmission.instructorFeedback ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm">{selectedSubmission.instructorFeedback}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {selectedSubmission.status === 'pending' 
                        ? 'Waiting for instructor review and feedback.'
                        : 'No instructor feedback provided for this submission.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <h4 className="font-medium">Additional Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className="ml-2">{selectedSubmission.status || 'Completed'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>
                    <span className="ml-2">
                      {selectedSubmission.type === 'quiz' ? 'Quiz Assessment' : 'Scenario Training'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowSubmissionDetail(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}