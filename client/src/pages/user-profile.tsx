import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Calendar, Shield, Mail, Key, Settings, Award, TrendingUp, Clock, Target, BookOpen, Users, AlertTriangle, CheckCircle, XCircle, Hourglass, Flame, Zap } from "lucide-react";
import { useIsolatedAuth } from "../auth-isolated/auth-context";
import { useQuery } from "@tanstack/react-query";

export default function UserProfile() {
  const { user, logout } = useIsolatedAuth();

  // Fetch user profile data including submissions and progress
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['/api/profile'],
    enabled: !!user
  });

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

  // Extract data from profileData or use defaults
  const userInfo = profileData?.user || user;
  const stats = profileData?.stats || { 
    totalSubmissions: 0, 
    passedSubmissions: 0, 
    failedSubmissions: 0, 
    pendingGrading: 0, 
    overallPassRate: 0, 
    currentStreak: 0, 
    longestStreak: 0, 
    weeksSinceLastActivity: 0 
  };
  const submissions = profileData?.submissions || [];
  const submissionsByType = profileData?.submissionsByType || { scenarios: [], quizzes: [], assessments: [] };
  const trainingModules = profileData?.trainingModules || [];
  const gamification = profileData?.gamification || { 
    weeklyGoal: 1, 
    streakData: { current: 0, longest: 0, weeksSinceLastActivity: 0, streakAtRisk: false },
    thisWeekActivity: 0,
    achievements: {}
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account information and track your progress</p>
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
                <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">{stats.overallPassRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${gamification.streakData.streakAtRisk ? 'border-orange-200' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weekly Streak</p>
                <div className="flex items-center space-x-1">
                  <p className="text-2xl font-bold">{stats.currentStreak}</p>
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Streak</p>
                <p className="text-2xl font-bold">{stats.longestStreak}</p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
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
                  <Badge className={getRoleBadgeColor(userInfo.role || user.role)}>
                    {getRoleDisplayName(userInfo.role || user.role)}
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
              {trainingModules.map((module) => (
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

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>Your latest submissions and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.slice(0, 5).map((submission, index) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        submission.passed === true ? 'bg-green-500' : 
                        submission.passed === false ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{submission.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(submission.submissionDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {submission.score !== undefined && (
                        <span className="text-sm font-medium">{submission.score}%</span>
                      )}
                      <Badge variant={
                        submission.passed === true ? 'default' : 
                        submission.passed === false ? 'destructive' : 'secondary'
                      }>
                        {submission.passed === true ? 'Pass' : 
                         submission.passed === false ? 'Fail' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {submissions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No submissions yet. Start training to see your progress here!
                  </p>
                )}
              </div>
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
                onClick={() => {
                  // Future: Add change password functionality
                  alert('Password change functionality coming soon!');
                }}
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
          {(userInfo.role || user.role) === 'superadmin' && (
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

          {/* Achievements Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Achievements</span>
              </CardTitle>
              <CardDescription>Your training milestones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.totalSubmissions >= 10 && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                  <Award className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Active Learner</p>
                    <p className="text-xs text-yellow-600">Completed 10+ submissions</p>
                  </div>
                </div>
              )}

              {stats.overallPassRate >= 80 && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50 border border-green-200">
                  <Award className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">High Achiever</p>
                    <p className="text-xs text-green-600">80%+ pass rate</p>
                  </div>
                </div>
              )}

              {stats.longestStreak >= 5 && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-purple-50 border border-purple-200">
                  <Award className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">Consistent Performer</p>
                    <p className="text-xs text-purple-600">5+ week streak</p>
                  </div>
                </div>
              )}

              {trainingModules.filter(m => m.completed).length >= 2 && (
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-blue-50 border border-blue-200">
                  <Award className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Multi-Aircraft Certified</p>
                    <p className="text-xs text-blue-600">Completed multiple aircraft types</p>
                  </div>
                </div>
              )}

              {stats.totalSubmissions === 0 && stats.longestStreak === 0 && trainingModules.filter(m => m.completed).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Complete training to unlock achievements!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}